-- Run this script against your Azure SQL database before deploying the functions.
-- If you ran the original script, drop the old table first:
--   DROP TABLE IF EXISTS dbo.ContactSubmissions;

CREATE TABLE dbo.WorkshopRegistrations
(
    Id                          INT           NOT NULL IDENTITY(1,1) PRIMARY KEY,
    FullName                    NVARCHAR(200) NOT NULL,
    Email                       NVARCHAR(320) NOT NULL,
    Phone                       NVARCHAR(50)  NULL,
    -- Q4: What would make this session extremely valuable for you?
    SV_MakeMoreMoney            BIT           NOT NULL DEFAULT 0,
    SV_SaveTime                 BIT           NOT NULL DEFAULT 0,
    SV_ReduceExpenses           BIT           NOT NULL DEFAULT 0,
    SV_CloseBlindSpots          BIT           NOT NULL DEFAULT 0,
    SV_OtherText                NVARCHAR(200) NULL,
    -- Q5: Where do you want AI to help you the most right now?
    AH_WorkProductivity         BIT           NOT NULL DEFAULT 0,
    AH_BusinessOperations       BIT           NOT NULL DEFAULT 0,
    AH_MarketingContent         BIT           NOT NULL DEFAULT 0,
    AH_CareerGrowth             BIT           NOT NULL DEFAULT 0,
    AH_PersonalLifeEfficiency   BIT           NOT NULL DEFAULT 0,
    AH_LearningAIFundamentals   BIT           NOT NULL DEFAULT 0,
    AH_OtherText                NVARCHAR(200) NULL,
    -- Q6: Which AI tools do you currently use?
    AT_ChatGPT                  BIT           NOT NULL DEFAULT 0,
    AT_MicrosoftCopilot         BIT           NOT NULL DEFAULT 0,
    AT_GoogleGemini             BIT           NOT NULL DEFAULT 0,
    AT_Claude                   BIT           NOT NULL DEFAULT 0,
    AT_MidjourneyImageAI        BIT           NOT NULL DEFAULT 0,
    AT_None                     BIT           NOT NULL DEFAULT 0,
    AT_OtherText                NVARCHAR(200) NULL,
    -- Q7 & Q8: Open-ended text
    BiggestBarrier              NVARCHAR(MAX) NULL,
    AnythingElse                NVARCHAR(MAX) NULL,
    SubmittedAt                 DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);

-- Unique constraint on email — prevents duplicate registrations
ALTER TABLE dbo.WorkshopRegistrations
    ADD CONSTRAINT UQ_WorkshopRegistrations_Email UNIQUE (Email);

-- Index on email is covered by the unique constraint above.
-- If upgrading an existing table instead of recreating it, run:
--   ALTER TABLE dbo.WorkshopRegistrations ADD CONSTRAINT UQ_WorkshopRegistrations_Email UNIQUE (Email);

-- Grant permissions to the Function App managed identity (replace with your app name)
-- CREATE USER [your-function-app-name] FROM EXTERNAL PROVIDER;
-- ALTER ROLE db_datareader ADD MEMBER [your-function-app-name];
-- ALTER ROLE db_datawriter ADD MEMBER [your-function-app-name];
