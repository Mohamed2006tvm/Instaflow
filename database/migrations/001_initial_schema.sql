-- =============================================
-- Instagram Automation Platform — Schema v1
-- Run this in your Neon SQL editor
-- =============================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- instagram_accounts
-- =============================================
CREATE TABLE instagram_accounts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ig_user_id            TEXT UNIQUE NOT NULL,
  username              TEXT NOT NULL,
  name                  TEXT,
  profile_picture_url   TEXT,
  access_token_encrypted TEXT NOT NULL,
  token_expires_at      TIMESTAMPTZ,
  account_type          TEXT DEFAULT 'BUSINESS',
  follower_count        INTEGER DEFAULT 0,
  connected_page_id     TEXT,
  is_active             BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- automations
-- =============================================
CREATE TABLE automations (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instagram_account_id   UUID NOT NULL REFERENCES instagram_accounts(id) ON DELETE CASCADE,
  post_id                TEXT NOT NULL,
  name                   TEXT NOT NULL,
  public_reply_text      TEXT NOT NULL,
  dm_text                TEXT NOT NULL,
  is_enabled             BOOLEAN DEFAULT true,
  follow_gate_enabled    BOOLEAN DEFAULT false,
  deleted_at             TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- automation_keywords
-- =============================================
CREATE TABLE automation_keywords (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  keyword       TEXT NOT NULL,
  match_type    TEXT NOT NULL DEFAULT 'contains'
                  CHECK (match_type IN ('contains', 'exact', 'starts_with')),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- webhook_events  (idempotency table)
-- =============================================
CREATE TABLE webhook_events (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id      TEXT UNIQUE NOT NULL,
  event_type    TEXT NOT NULL,
  raw_payload   JSONB,
  processed     BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- automation_logs
-- =============================================
CREATE TABLE automation_logs (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id        UUID REFERENCES automations(id) ON DELETE SET NULL,
  comment_id           TEXT NOT NULL,
  commenter_ig_id      TEXT,
  commenter_username   TEXT,
  comment_text         TEXT,
  matched_keyword      TEXT,
  public_reply_sent    BOOLEAN DEFAULT false,
  public_reply_text    TEXT,
  dm_sent              BOOLEAN DEFAULT false,
  dm_text              TEXT,
  follow_gate_enabled  BOOLEAN DEFAULT false,
  follow_gate_passed   BOOLEAN,
  status               TEXT NOT NULL DEFAULT 'pending'
                         CHECK (status IN ('pending','success','partial','failed','skipped')),
  error_message        TEXT,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- dm_logs
-- =============================================
CREATE TABLE dm_logs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_log_id UUID REFERENCES automation_logs(id) ON DELETE SET NULL,
  recipient_ig_id   TEXT NOT NULL,
  message_text      TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending','sent','failed')),
  meta_message_id   TEXT,
  error_message     TEXT,
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- failed_jobs
-- =============================================
CREATE TABLE failed_jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_name    TEXT NOT NULL,
  job_name      TEXT NOT NULL,
  job_data      JSONB,
  error_message TEXT,
  stack_trace   TEXT,
  attempts      INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_automations_account_id    ON automations(instagram_account_id);
CREATE INDEX idx_automations_post_id       ON automations(post_id);
CREATE INDEX idx_automations_enabled       ON automations(is_enabled) WHERE deleted_at IS NULL;
CREATE INDEX idx_keywords_automation_id    ON automation_keywords(automation_id);
CREATE INDEX idx_webhook_events_event_id   ON webhook_events(event_id);
CREATE INDEX idx_automation_logs_auto_id   ON automation_logs(automation_id);
CREATE INDEX idx_automation_logs_created   ON automation_logs(created_at DESC);
CREATE INDEX idx_automation_logs_status    ON automation_logs(status);
CREATE INDEX idx_dm_logs_log_id            ON dm_logs(automation_log_id);
CREATE INDEX idx_failed_jobs_queue         ON failed_jobs(queue_name);
CREATE INDEX idx_failed_jobs_created       ON failed_jobs(created_at DESC);

-- =============================================
-- updated_at trigger
-- =============================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_instagram_accounts_updated_at
  BEFORE UPDATE ON instagram_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_automations_updated_at
  BEFORE UPDATE ON automations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
