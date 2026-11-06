CREATE TABLE IF NOT EXISTS schema_migrations (
  filename TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  ruleset_id TEXT NOT NULL,
  dice_roller TEXT NOT NULL DEFAULT 'dice-plus',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('GM', 'PLAYER')),
  PRIMARY KEY (campaign_id, user_id)
);

CREATE TABLE IF NOT EXISTS owlbear_identities (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  obr_player_id TEXT NOT NULL,
  obr_room_id TEXT NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (obr_player_id, obr_room_id)
);

CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  owner_user_id UUID NOT NULL REFERENCES users(id),
  ruleset_id TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1,
  sheet JSONB NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS characters_campaign_idx ON characters(campaign_id);
CREATE INDEX IF NOT EXISTS characters_owner_idx ON characters(owner_user_id);

CREATE TABLE IF NOT EXISTS token_links (
  id UUID PRIMARY KEY,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  obr_room_id TEXT NOT NULL,
  token_id TEXT NOT NULL,
  UNIQUE (obr_room_id, token_id)
);

CREATE INDEX IF NOT EXISTS token_links_character_idx ON token_links(character_id);
