# FreeSQL Azure Function Form

Embeddable Azure Function form that writes submissions to Azure SQL using Entra/Managed Identity.

## Deploy from GitHub (recommended)

1. Create a GitHub repo and push this project.
2. In Azure Portal, open Function App **knraiclass**.
3. Go to **Deployment Center**.
4. Source: **GitHub**.
5. Authorize GitHub and select your repo + branch.
6. Save. Azure creates a GitHub Actions workflow and deploys on push.

## Required app settings (Azure Portal)

Function App -> **Settings** -> **Environment variables**:

- `SQL_SERVER` = `knrsql.database.windows.net`
- `SQL_DATABASE` = `db-knr`

Do **not** store secrets in code or `local.settings.json` in GitHub.

## Database setup

Run [sql/create-table.sql](sql/create-table.sql) in Azure SQL.

If table already exists from prior versions, adjust by dropping/recreating or applying the latest schema/constraints as needed.

## Managed Identity permissions

Enable **System assigned managed identity** on the Function App.

Then in Azure SQL (as Entra admin):

```sql
CREATE USER [knraiclass] FROM EXTERNAL PROVIDER;
ALTER ROLE db_datareader ADD MEMBER [knraiclass];
ALTER ROLE db_datawriter ADD MEMBER [knraiclass];
```

## Verify endpoints after deployment

- Form page: `https://knraiclass-aydtdnahf6hbecan.canadacentral-01.azurewebsites.net/api/contactForm`
- Submit API: `https://knraiclass-aydtdnahf6hbecan.canadacentral-01.azurewebsites.net/api/submitForm`

## Embed in landing page

```html
<iframe
  src="https://knraiclass-aydtdnahf6hbecan.canadacentral-01.azurewebsites.net/api/contactForm"
  width="100%"
  height="900"
  frameborder="0"
  style="border:none; display:block;"
></iframe>
```

## Performance — cold start optimizations

Azure Functions on the Consumption plan shuts down after ~5 minutes of inactivity. Without mitigation this causes 30–45 second delays on the first request after idle. Three changes address this:

### 1. Keep-warm timer (`src/functions/keepWarm.js`)
A timer trigger fires every 4 minutes to keep the function app from going idle. This is the primary fix for slow first loads. Cost: ~10,800 executions/month, well within the free tier's 1 million execution limit.

### 2. Lazy-loaded heavy modules (`submitForm.js`)
`mssql`, `tedious`, and `@azure/identity` are large packages. Previously they were loaded at startup for all functions, making even the lightweight `contactForm` wait for them. They are now deferred and only loaded when `submitForm` is first invoked.

### 3. Faster credential resolution on Azure (`submitForm.js`)
`DefaultAzureCredential` probes multiple credential providers sequentially on every cold start. When running on Azure with a managed identity, `ManagedIdentityCredential` is used directly instead (detected via the `IDENTITY_ENDPOINT` environment variable), skipping unnecessary probing. `DefaultAzureCredential` is still used locally for development.
