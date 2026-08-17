-- =========================================================================
-- Migration: News Like / Dislike Reaction Engine (PH03)
-- Database: MSSQL (app_tancang)
-- Description: Schema for News & Comment Reactions (Like/Dislike)
-- =========================================================================

IF OBJECT_ID(N'[dbo].[news_like]', N'U') IS NULL
BEGIN
  CREATE TABLE [dbo].[news_like] (
    [id] BIGINT IDENTITY(1,1) PRIMARY KEY,
    [news_id] BIGINT NULL,
    [comment_id] BIGINT NULL,
    [user_id] NVARCHAR(100) NOT NULL,
    [is_like] BIT NOT NULL DEFAULT 1, -- 1 = Like, 0 = Dislike
    [created_at] DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME()
  );

  CREATE INDEX [IX_news_like_news_id] ON [dbo].[news_like]([news_id]);
  CREATE INDEX [IX_news_like_comment_id] ON [dbo].[news_like]([comment_id]);
  CREATE INDEX [IX_news_like_user_id] ON [dbo].[news_like]([user_id]);
END
GO
