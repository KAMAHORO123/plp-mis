-- Members can find each other in the hub. Anyone can hide their profile; messages are relayed by PLP,
-- so a recipient's address is never shown, and replies go straight back to the sender.
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_visible boolean NOT NULL DEFAULT true;
ALTER TABLE notification_mail ADD COLUMN IF NOT EXISTS reply_to text;
