ALTER TABLE messages ADD COLUMN originating_message_id TEXT REFERENCES messages(id);
