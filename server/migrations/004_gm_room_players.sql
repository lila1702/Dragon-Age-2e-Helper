CREATE TABLE IF NOT EXISTS campaign_owlbear_rooms (
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  obr_room_id TEXT NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (campaign_id),
  UNIQUE (obr_room_id)
);

CREATE TABLE IF NOT EXISTS campaign_player_profiles (
  id UUID PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (campaign_id, user_id)
);

CREATE INDEX IF NOT EXISTS campaign_player_profiles_campaign_idx
  ON campaign_player_profiles(campaign_id);
