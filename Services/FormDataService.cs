using Microsoft.Data.SqlClient;
using System.Data;
using FormDataFunction.Models;

namespace FormDataFunction.Services;

public class FormDataService
{
    private readonly string _connectionString;

    public FormDataService(string connectionString)
    {
        _connectionString = connectionString;
    }

    public async Task<bool> SaveFormSubmissionAsync(FormSubmission submission)
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var query = @"
                INSERT INTO FormSubmissions (Name, Email, Message, SubmittedAt)
                VALUES (@Name, @Email, @Message, @SubmittedAt)";

            using var command = new SqlCommand(query, connection);
            command.Parameters.Add("@Name", SqlDbType.NVarChar, 255).Value = submission.Name ?? string.Empty;
            command.Parameters.Add("@Email", SqlDbType.NVarChar, 255).Value = submission.Email ?? string.Empty;
            command.Parameters.Add("@Message", SqlDbType.NVarChar, -1).Value = submission.Message ?? string.Empty;
            command.Parameters.Add("@SubmittedAt", SqlDbType.DateTime).Value = submission.SubmittedAt;

            await command.ExecuteNonQueryAsync();
            return true;
        }
        catch (Exception ex)
        {
            // Log error in production
            Console.WriteLine($"Error saving form submission: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> InitializeDatabaseAsync()
    {
        try
        {
            using var connection = new SqlConnection(_connectionString);
            await connection.OpenAsync();

            var createTableQuery = @"
                IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='FormSubmissions' AND xtype='U')
                CREATE TABLE FormSubmissions (
                    Id INT PRIMARY KEY IDENTITY(1,1),
                    Name NVARCHAR(255) NOT NULL,
                    Email NVARCHAR(255) NOT NULL,
                    Message NVARCHAR(MAX) NOT NULL,
                    SubmittedAt DATETIME NOT NULL
                )";

            using var command = new SqlCommand(createTableQuery, connection);
            await command.ExecuteNonQueryAsync();
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error initializing database: {ex.Message}");
            return false;
        }
    }
}
