using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using FormDataFunction.Models;
using FormDataFunction.Services;
using System.Text.Json;

namespace FormDataFunction.Functions;

public class FormSubmissionFunction
{
    private readonly ILogger<FormSubmissionFunction> _logger;
    private readonly FormDataService _formDataService;

    public FormSubmissionFunction(ILogger<FormSubmissionFunction> logger, FormDataService formDataService)
    {
        _logger = logger;
        _formDataService = formDataService;
    }

    [Function("SubmitForm")]
    public async Task<IActionResult> Run(
        [HttpTrigger(AuthorizationLevel.Anonymous, "post", "options", Route = "form/submit")] HttpRequest req)
    {
        _logger.LogInformation("Form submission request received.");

        // Handle CORS preflight request for iframe
        if (req.Method == "OPTIONS")
        {
            return new OkResult();
        }

        try
        {
            // Read and parse the form data
            string requestBody = await new StreamReader(req.Body).ReadToEndAsync();
            
            FormSubmission? submission;
            
            // Try to parse as JSON first
            try
            {
                submission = JsonSerializer.Deserialize<FormSubmission>(requestBody, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch
            {
                // If JSON parsing fails, try form data
                submission = new FormSubmission
                {
                    Name = req.Form["name"].ToString() ?? req.Form["Name"].ToString() ?? string.Empty,
                    Email = req.Form["email"].ToString() ?? req.Form["Email"].ToString() ?? string.Empty,
                    Message = req.Form["message"].ToString() ?? req.Form["Message"].ToString() ?? string.Empty
                };
            }

            // Validate the submission
            if (submission == null || string.IsNullOrWhiteSpace(submission.Name) || 
                string.IsNullOrWhiteSpace(submission.Email) || 
                string.IsNullOrWhiteSpace(submission.Message))
            {
                _logger.LogWarning("Invalid form submission: missing required fields");
                return new BadRequestObjectResult(new { error = "All fields (Name, Email, Message) are required." });
            }

            // Basic email validation
            if (!submission.Email.Contains("@") || !submission.Email.Contains("."))
            {
                _logger.LogWarning("Invalid email format: {Email}", submission.Email);
                return new BadRequestObjectResult(new { error = "Invalid email format." });
            }

            // Set submission timestamp
            submission.SubmittedAt = DateTime.UtcNow;

            // Save to database
            var success = await _formDataService.SaveFormSubmissionAsync(submission);

            if (success)
            {
                _logger.LogInformation("Form submission saved successfully for email: {Email}", submission.Email);
                return new OkObjectResult(new 
                { 
                    message = "Form submitted successfully!",
                    submittedAt = submission.SubmittedAt
                });
            }
            else
            {
                _logger.LogError("Failed to save form submission to database");
                return new StatusCodeResult(StatusCodes.Status500InternalServerError);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error processing form submission");
            return new StatusCodeResult(StatusCodes.Status500InternalServerError);
        }
    }
}
