using Microsoft.Azure.Functions.Worker;
using Microsoft.Azure.Functions.Worker.Builder;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using FormDataFunction.Services;

var builder = FunctionsApplication.CreateBuilder(args);

builder.ConfigureFunctionsWebApplication();

// Configure CORS for iframe embedding
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Register FormDataService with connection string from configuration
var connectionString = builder.Configuration.GetConnectionString("SqlDatabase") 
    ?? throw new InvalidOperationException("Connection string 'SqlDatabase' not found.");

builder.Services.AddSingleton(new FormDataService(connectionString));

builder.Services
    .AddApplicationInsightsTelemetryWorkerService()
    .ConfigureFunctionsApplicationInsights();

var app = builder.Build();

// Initialize database table on startup
using (var scope = app.Services.CreateScope())
{
    var formDataService = scope.ServiceProvider.GetRequiredService<FormDataService>();
    await formDataService.InitializeDatabaseAsync();
}

app.Run();
