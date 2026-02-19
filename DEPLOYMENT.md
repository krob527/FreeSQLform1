# Deployment Guide

This guide will help you deploy the Azure Function to Azure and set up the free SQL database.

## Prerequisites

- Azure account (free tier available)
- Azure CLI installed (`az` command)
- .NET 8.0 SDK

## Step 1: Create Azure SQL Database (Free Tier)

1. Log in to Azure Portal: https://portal.azure.com

2. Create a new SQL Database:
   - Click "Create a resource"
   - Search for "SQL Database"
   - Click "Create"

3. Configure the database:
   - **Subscription**: Select your subscription
   - **Resource Group**: Create new or select existing
   - **Database Name**: e.g., `formsubmissions-db`
   - **Server**: Create a new server
     - Server name: e.g., `formsubmissions-server`
     - Location: Choose nearest region
     - Authentication: SQL authentication
     - Admin login: Create username
     - Password: Create strong password
   - **Compute + storage**: Click "Configure database"
     - Select "Basic" tier (5 DTUs, 2GB storage) - cheapest option
     - Or use "Serverless" for auto-scaling

4. Click "Review + create" then "Create"

5. After deployment, configure firewall:
   - Go to your SQL Server resource
   - Click "Firewalls and virtual networks"
   - Set "Allow Azure services and resources to access this server" to "Yes"
   - Add your client IP if you want to access from your machine
   - Click "Save"

6. Get the connection string:
   - Go to your database resource
   - Click "Connection strings" under Settings
   - Copy the ADO.NET connection string
   - Replace `{your_password}` with your actual password

## Step 2: Create Azure Function App

Using Azure Portal:

1. Click "Create a resource"
2. Search for "Function App"
3. Configure:
   - **Resource Group**: Use same as database
   - **Function App name**: e.g., `formsubmissions-func`
   - **Runtime stack**: .NET
   - **Version**: 8 (LTS), isolated worker model
   - **Region**: Same as database
   - **Operating System**: Linux (recommended) or Windows
   - **Plan type**: Consumption (Serverless) - free tier available

4. Click "Review + create" then "Create"

Using Azure CLI:

```bash
# Login to Azure
az login

# Create a resource group (if not exists)
az group create --name formsubmissions-rg --location eastus

# Create a storage account (required for Function Apps)
az storage account create --name formsubmissionssa --resource-group formsubmissions-rg --location eastus --sku Standard_LRS

# Create the Function App
az functionapp create --name formsubmissions-func --resource-group formsubmissions-rg --consumption-plan-location eastus --runtime dotnet-isolated --functions-version 4 --storage-account formsubmissionssa
```

## Step 3: Configure Connection String

In Azure Portal:

1. Go to your Function App
2. Click "Configuration" under Settings
3. Click "New connection string"
4. Set:
   - **Name**: `SqlDatabase`
   - **Value**: Your SQL connection string from Step 1
   - **Type**: SQLAzure
5. Click "OK" then "Save"

Using Azure CLI:

```bash
az functionapp config connection-string set --name formsubmissions-func --resource-group formsubmissions-rg --connection-string-type SQLAzure --settings SqlDatabase="Server=tcp:your-server.database.windows.net,1433;Initial Catalog=formsubmissions-db;User ID=your-username;Password=your-password;Encrypt=True;"
```

## Step 4: Deploy the Function

### Option A: Deploy from Local Machine

1. Install Azure Functions Core Tools:
   ```bash
   # On macOS
   brew tap azure/functions
   brew install azure-functions-core-tools@4
   
   # On Windows
   npm install -g azure-functions-core-tools@4 --unsafe-perm true
   
   # On Linux
   wget -q https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb
   sudo dpkg -i packages-microsoft-prod.deb
   sudo apt-get update
   sudo apt-get install azure-functions-core-tools-4
   ```

2. Build the project:
   ```bash
   dotnet build --configuration Release
   ```

3. Deploy to Azure:
   ```bash
   func azure functionapp publish formsubmissions-func
   ```

### Option B: Deploy from GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Azure Functions

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: 8.0.x
    
    - name: Build
      run: dotnet build --configuration Release
    
    - name: Publish
      run: dotnet publish --configuration Release --output ./output
    
    - name: Deploy to Azure Functions
      uses: Azure/functions-action@v1
      with:
        app-name: formsubmissions-func
        package: ./output
        publish-profile: ${{ secrets.AZURE_FUNCTIONAPP_PUBLISH_PROFILE }}
```

Get the publish profile from Azure Portal:
1. Go to your Function App
2. Click "Download publish profile"
3. Add the content as `AZURE_FUNCTIONAPP_PUBLISH_PROFILE` secret in GitHub

## Step 5: Test the Deployment

1. Get your Function URL:
   - Go to your Function App in Azure Portal
   - Click "Functions" under Functions
   - Click "SubmitForm"
   - Click "Get Function Url"
   - Copy the URL

2. Update `sample-form.html`:
   - Replace `http://localhost:7071/api/form/submit` with your Function URL

3. Test the form:
   - Open `iframe-example.html` in a browser
   - Fill out and submit the form
   - Check for success message

4. Verify data in database:
   - Use Azure Portal Query Editor
   - Or connect with SQL Server Management Studio
   - Run: `SELECT * FROM FormSubmissions`

## Step 6: Configure Custom Domain (Optional)

If you want to use a custom domain for your form:

1. In Function App, go to "Custom domains"
2. Click "Add custom domain"
3. Follow the instructions to verify your domain
4. Update DNS records as required
5. Enable HTTPS (free with App Service Managed Certificate)

## Cost Estimation

For a free/low-cost setup:

- **Azure SQL Database (Basic tier)**: ~$5/month
- **Azure Functions (Consumption plan)**: First 1 million executions free, then $0.20 per million
- **Storage Account**: ~$0.02/month for minimal usage

**Total estimated cost**: ~$5-6/month for low to moderate traffic

## Monitoring

View logs and monitor your function:

1. In Function App, go to "Log stream" to see real-time logs
2. Use "Application Insights" for detailed metrics (automatically configured)
3. View invocation count and performance metrics in the Overview tab

## Security Best Practices

1. **Enable Application Insights** for monitoring and debugging
2. **Use Azure Key Vault** for storing connection strings in production
3. **Restrict CORS origins** to specific domains instead of allowing all
4. **Add authentication** if the form should only be accessible to authenticated users
5. **Enable rate limiting** to prevent abuse
6. **Use managed identity** instead of connection strings when possible

## Troubleshooting

### Function not responding
- Check Function App logs in Log stream
- Verify connection string is correctly configured
- Ensure SQL firewall allows Azure services

### Database connection errors
- Verify connection string format
- Check SQL Server firewall rules
- Ensure database exists and is accessible

### CORS errors
- Verify CORS is enabled in Function App Configuration
- Check that the form's origin is allowed
- Test with browser developer tools network tab

## Support

For issues or questions:
- Check Azure Functions documentation: https://docs.microsoft.com/azure/azure-functions/
- Check Azure SQL Database documentation: https://docs.microsoft.com/azure/sql-database/
