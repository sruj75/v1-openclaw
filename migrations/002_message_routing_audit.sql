ALTER TABLE messages ADD COLUMN routing_metadata_json TEXT;
ALTER TABLE messages ADD COLUMN openclaw_status TEXT;
ALTER TABLE messages ADD COLUMN openclaw_trace_id TEXT;
ALTER TABLE messages ADD COLUMN openclaw_provider_response_id TEXT;
