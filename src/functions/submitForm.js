const { app } = require('@azure/functions');

// Heavy modules are lazy-loaded on first use so they don't slow down cold starts
// for other functions (e.g. contactForm) that don't need them.
let _sql = null;
let _credential = null;

function getSql() {
  if (!_sql) _sql = require('mssql');
  return _sql;
}

function getCredential() {
  if (!_credential) {
    // On Azure, IDENTITY_ENDPOINT is set when a managed identity is configured.
    // ManagedIdentityCredential is much faster than DefaultAzureCredential because
    // it goes directly to the IMDS endpoint instead of probing multiple providers.
    if (process.env.IDENTITY_ENDPOINT) {
      const { ManagedIdentityCredential } = require('@azure/identity');
      _credential = new ManagedIdentityCredential();
    } else {
      // Local development fallback (uses Azure CLI / VS Code credentials, etc.)
      const { DefaultAzureCredential } = require('@azure/identity');
      _credential = new DefaultAzureCredential();
    }
  }
  return _credential;
}

// Pool is cached but rebuilt whenever the access token has expired
let pool = null;
let poolTokenExpiresAt = 0;

async function getPool() {
  const nowMs = Date.now();
  // Refresh pool if it doesn't exist or the token expires within 2 minutes
  if (!pool || nowMs >= poolTokenExpiresAt - 2 * 60 * 1000) {
    if (pool) {
      try { await pool.close(); } catch { /* ignore */ }
      pool = null;
    }

    const server   = process.env.SQL_SERVER;
    const database = process.env.SQL_DATABASE;
    if (!server || !database) {
      throw new Error('SQL_SERVER and SQL_DATABASE environment variables must be set.');
    }

    const sql = getSql();
    const credential = getCredential();

    // Acquire an Entra access token for Azure SQL
    const tokenResponse = await credential.getToken('https://database.windows.net/.default');
    poolTokenExpiresAt = tokenResponse.expiresOnTimestamp;

    pool = await sql.connect({
      server,
      database,
      options: {
        encrypt: true,
        trustServerCertificate: false
      },
      authentication: {
        type: 'azure-active-directory-access-token',
        options: { token: tokenResponse.token }
      }
    });
  }

  return pool;
}

app.http('submitForm', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'submitForm',
  handler: async (request, context) => {
    // CORS headers — allows any origin to POST from an iframe
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    // Handle pre-flight
    if (request.method === 'OPTIONS') {
      return { status: 204, headers: corsHeaders };
    }

    // Parse body
    let body;
    try {
      body = await request.json();
    } catch {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { message: 'Invalid JSON body.' }
      };
    }

    const {
      fullName, email, phone,
      // Q4
      sv_makeMoreMoney, sv_saveTime, sv_reduceExpenses, sv_closeBlindSpots, sv_otherText,
      // Q5
      ah_workProductivity, ah_businessOperations, ah_marketingContent,
      ah_careerGrowth, ah_personalLifeEfficiency, ah_learningAIFundamentals, ah_otherText,
      // Q6
      at_chatGPT, at_microsoftCopilot, at_googleGemini, at_claude,
      at_midjourneyImageAI, at_none, at_otherText,
      // Q7 & Q8
      biggestBarrier, anythingElse
    } = body ?? {};

    // Required field validation
    const svSelected = sv_makeMoreMoney || sv_saveTime || sv_reduceExpenses || sv_closeBlindSpots || sv_otherText;
    const ahSelected = ah_workProductivity || ah_businessOperations || ah_marketingContent ||
                       ah_careerGrowth || ah_personalLifeEfficiency || ah_learningAIFundamentals || ah_otherText;
    const atSelected = at_chatGPT || at_microsoftCopilot || at_googleGemini || at_claude ||
                       at_midjourneyImageAI || at_none || at_otherText;
    if (!fullName || !email || !svSelected || !ahSelected || !atSelected || !biggestBarrier) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { message: 'fullName, email, sessionValue, aiHelpAreas, aiTools, and biggestBarrier are all required.' }
      };
    }

    // Email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        status: 400,
        headers: corsHeaders,
        jsonBody: { message: 'Please provide a valid email address.' }
      };
    }

    const b = (v) => v ? 1 : 0; // coerce to BIT-safe 0/1

    try {
      const sql = getSql();
      const db = await getPool();

      await db.request()
        .input('fullName',                  sql.NVarChar(200),    fullName.substring(0, 200))
        .input('email',                     sql.NVarChar(320),    email.substring(0, 320))
        .input('phone',                     sql.NVarChar(50),     phone ? phone.substring(0, 50) : null)
        // Q4
        .input('sv_makeMoreMoney',          sql.Bit,              b(sv_makeMoreMoney))
        .input('sv_saveTime',               sql.Bit,              b(sv_saveTime))
        .input('sv_reduceExpenses',         sql.Bit,              b(sv_reduceExpenses))
        .input('sv_closeBlindSpots',        sql.Bit,              b(sv_closeBlindSpots))
        .input('sv_otherText',              sql.NVarChar(200),    sv_otherText ? sv_otherText.substring(0, 200) : null)
        // Q5
        .input('ah_workProductivity',       sql.Bit,              b(ah_workProductivity))
        .input('ah_businessOperations',     sql.Bit,              b(ah_businessOperations))
        .input('ah_marketingContent',       sql.Bit,              b(ah_marketingContent))
        .input('ah_careerGrowth',           sql.Bit,              b(ah_careerGrowth))
        .input('ah_personalLifeEfficiency', sql.Bit,              b(ah_personalLifeEfficiency))
        .input('ah_learningAIFundamentals', sql.Bit,              b(ah_learningAIFundamentals))
        .input('ah_otherText',              sql.NVarChar(200),    ah_otherText ? ah_otherText.substring(0, 200) : null)
        // Q6
        .input('at_chatGPT',                sql.Bit,              b(at_chatGPT))
        .input('at_microsoftCopilot',       sql.Bit,              b(at_microsoftCopilot))
        .input('at_googleGemini',           sql.Bit,              b(at_googleGemini))
        .input('at_claude',                 sql.Bit,              b(at_claude))
        .input('at_midjourneyImageAI',      sql.Bit,              b(at_midjourneyImageAI))
        .input('at_none',                   sql.Bit,              b(at_none))
        .input('at_otherText',              sql.NVarChar(200),    at_otherText ? at_otherText.substring(0, 200) : null)
        // Q7 & Q8
        .input('biggestBarrier',            sql.NVarChar(sql.MAX), biggestBarrier || null)
        .input('anythingElse',              sql.NVarChar(sql.MAX), anythingElse   || null)
        .query(`
          INSERT INTO dbo.WorkshopRegistrations
            (FullName, Email, Phone,
             SV_MakeMoreMoney, SV_SaveTime, SV_ReduceExpenses, SV_CloseBlindSpots, SV_OtherText,
             AH_WorkProductivity, AH_BusinessOperations, AH_MarketingContent,
             AH_CareerGrowth, AH_PersonalLifeEfficiency, AH_LearningAIFundamentals, AH_OtherText,
             AT_ChatGPT, AT_MicrosoftCopilot, AT_GoogleGemini, AT_Claude,
             AT_MidjourneyImageAI, AT_None, AT_OtherText,
             BiggestBarrier, AnythingElse, SubmittedAt)
          VALUES
            (@fullName, @email, @phone,
             @sv_makeMoreMoney, @sv_saveTime, @sv_reduceExpenses, @sv_closeBlindSpots, @sv_otherText,
             @ah_workProductivity, @ah_businessOperations, @ah_marketingContent,
             @ah_careerGrowth, @ah_personalLifeEfficiency, @ah_learningAIFundamentals, @ah_otherText,
             @at_chatGPT, @at_microsoftCopilot, @at_googleGemini, @at_claude,
             @at_midjourneyImageAI, @at_none, @at_otherText,
             @biggestBarrier, @anythingElse, GETUTCDATE())
        `);

      context.log('Workshop registration saved — email: ' + email);

      return {
        status: 200,
        headers: corsHeaders,
        jsonBody: { message: 'Submission received. Thank you!' }
      };
    } catch (err) {
      // SQL Server error 2627 = unique constraint violation, 2601 = duplicate key in unique index
      if (err.number === 2627 || err.number === 2601) {
        return {
          status: 409,
          headers: corsHeaders,
          jsonBody: { message: 'This email address has already been registered.' }
        };
      }
      context.error('Database error:', err);
      return {
        status: 500,
        headers: corsHeaders,
        jsonBody: { message: 'An internal error occurred. Please try again later.' }
      };
    }
  }
});
