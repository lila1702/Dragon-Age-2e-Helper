CREATE TABLE IF NOT EXISTS initiative_entries (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  character_id UUID NULL REFERENCES characters(id) ON DELETE SET NULL,
  label TEXT NOT NULL,
  value INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS initiative_campaign_idx ON initiative_entries(campaign_id);
