-- Azure SQL Database / SQL Server Setup Script
-- This script creates the FormSubmissions table
-- Note: The Azure Function will automatically create this table on startup
-- You only need to run this manually if you want to set up the database beforehand

-- Create the FormSubmissions table
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='FormSubmissions' AND xtype='U')
BEGIN
    CREATE TABLE FormSubmissions (
        Id INT PRIMARY KEY IDENTITY(1,1),
        Name NVARCHAR(255) NOT NULL,
        Email NVARCHAR(255) NOT NULL,
        Message NVARCHAR(MAX) NOT NULL,
        SubmittedAt DATETIME NOT NULL
    );
    
    PRINT 'FormSubmissions table created successfully';
END
ELSE
BEGIN
    PRINT 'FormSubmissions table already exists';
END
GO

-- Optional: Create an index on SubmittedAt for better query performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FormSubmissions_SubmittedAt' AND object_id = OBJECT_ID('FormSubmissions'))
BEGIN
    CREATE INDEX IX_FormSubmissions_SubmittedAt ON FormSubmissions(SubmittedAt DESC);
    PRINT 'Index on SubmittedAt created successfully';
END
GO

-- Optional: Create an index on Email for better search performance
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_FormSubmissions_Email' AND object_id = OBJECT_ID('FormSubmissions'))
BEGIN
    CREATE INDEX IX_FormSubmissions_Email ON FormSubmissions(Email);
    PRINT 'Index on Email created successfully';
END
GO

-- View the table structure
SELECT 
    c.name AS ColumnName,
    t.name AS DataType,
    c.max_length AS MaxLength,
    c.is_nullable AS IsNullable
FROM sys.columns c
INNER JOIN sys.types t ON c.user_type_id = t.user_type_id
WHERE c.object_id = OBJECT_ID('FormSubmissions')
ORDER BY c.column_id;
