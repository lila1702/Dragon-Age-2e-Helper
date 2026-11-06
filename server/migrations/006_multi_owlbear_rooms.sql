ALTER TABLE campaign_owlbear_rooms DROP CONSTRAINT IF EXISTS campaign_owlbear_rooms_pkey;

ALTER TABLE campaign_owlbear_rooms
  ADD CONSTRAINT campaign_owlbear_rooms_pkey PRIMARY KEY (campaign_id, obr_room_id);
