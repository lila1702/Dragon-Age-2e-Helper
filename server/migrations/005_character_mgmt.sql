ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive'));

ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS assigned_player_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS characters_status_idx ON characters(campaign_id, status);
CREATE INDEX IF NOT EXISTS characters_assigned_player_idx
  ON characters(assigned_player_user_id)
  WHERE assigned_player_user_id IS NOT NULL;

ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS players_see_only_own_sheets BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS catalog_entries (
  id UUID PRIMARY KEY,
  ruleset_id TEXT NOT NULL REFERENCES rulesets(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN (
    'item', 'spell', 'talent', 'class_ability', 'class_specialization'
  )),
  name TEXT NOT NULL,
  summary TEXT NOT NULL DEFAULT '',
  body JSONB NOT NULL DEFAULT '{}'::jsonb,
  class_tags TEXT[] NOT NULL DEFAULT '{}',
  requirement_tags TEXT[] NOT NULL DEFAULT '{}',
  requirements_text TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS catalog_entries_ruleset_kind_idx
  ON catalog_entries(ruleset_id, kind, sort_order, name);
