-- =========================================================================
-- Migration: Meeting Conclusion to Task Mapping (PH06)
-- Database: MSSQL (app_tancang)
-- Description: Ensure meeting_conclusion_id on task table
-- =========================================================================

IF OBJECT_ID('task', 'U') IS NOT NULL AND NOT EXISTS (
  SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('task') AND name = 'meeting_conclusion_id'
)
BEGIN
  ALTER TABLE task ADD meeting_conclusion_id BIGINT NULL;
  CREATE INDEX IX_task_meeting_conclusion_id ON task(meeting_conclusion_id);
END
GO
