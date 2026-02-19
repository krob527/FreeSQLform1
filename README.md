# FreeSQLform1

Azure Function to receive form data via iframe and save it to a free SQL database.

## Features

- HTTP POST endpoint to receive form submissions
- CORS enabled for iframe embedding
- Saves form data to Azure SQL Database (or any SQL Server)
- Automatic database table creation on startup
- Input validation and error handling
- Supports both JSON and form-encoded data

## Setup

### Prerequisites

- .NET 8.0 SDK
- Azure SQL Database or SQL Server (free tier available)
- Azure Functions Core Tools (optional, for local development)

### Configuration

1. Update the connection string in `local.settings.json`:
   ```json
   {
     "ConnectionStrings": {
       "SqlDatabase": "Server=tcp:your-server.database.windows.net,1433;Initial Catalog=your-database;User ID=your-username;Password=your-password;..."
     }
   }
   ```

2. For Azure deployment, add the connection string to your Function App's Application Settings:
   - Name: `ConnectionStrings:SqlDatabase`
   - Value: Your SQL connection string

### Database Schema

The application automatically creates the following table on startup:

```sql
CREATE TABLE FormSubmissions (
    Id INT PRIMARY KEY IDENTITY(1,1),
    Name NVARCHAR(255) NOT NULL,
    Email NVARCHAR(255) NOT NULL,
    Message NVARCHAR(MAX) NOT NULL,
    SubmittedAt DATETIME NOT NULL
)
```

## Usage

### Running Locally

```bash
dotnet build
dotnet run
```

The function will be available at: `http://localhost:7071/api/form/submit`

### API Endpoint

**POST** `/api/form/submit`

**Request Body (JSON):**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "message": "This is a test message"
}
```

**Response (Success):**
```json
{
  "message": "Form submitted successfully!",
  "submittedAt": "2026-02-19T03:40:00Z"
}
```

**Response (Error):**
```json
{
  "error": "All fields (Name, Email, Message) are required."
}
```

### Embedding in an iframe

Use the included `sample-form.html` as a reference. Update the form's fetch URL to point to your deployed Azure Function endpoint.

Example:
```html
<iframe src="https://your-form-page.com/sample-form.html" width="600" height="500"></iframe>
```

## Deployment to Azure

1. Create an Azure Function App
2. Create an Azure SQL Database (free tier available)
3. Configure the connection string in the Function App settings
4. Deploy using:
   ```bash
   func azure functionapp publish <your-function-app-name>
   ```

## Project Structure

- `Functions/FormSubmissionFunction.cs` - HTTP trigger function to handle form submissions
- `Services/FormDataService.cs` - Database service for data persistence
- `Models/FormSubmission.cs` - Data model for form submissions
- `Program.cs` - Application startup and dependency injection configuration
- `sample-form.html` - Sample HTML form that can be embedded in an iframe

## Security Notes

- The function uses `AuthorizationLevel.Anonymous` for easy iframe embedding
- CORS is configured to allow all origins for iframe support
- Add authentication and restrict CORS origins for production use
- Never commit `local.settings.json` with real connection strings