export const PHASE_1_SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  discord_user_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS experts (
  id TEXT PRIMARY KEY,
  discord_user_id TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  openclaw_agent_id TEXT NOT NULL UNIQUE,
  workspace_path TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_assignments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  expert_id TEXT NOT NULL REFERENCES experts(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  discord_channel_id TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversation_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  agent_id TEXT NOT NULL REFERENCES agents(id),
  discord_channel_id TEXT NOT NULL,
  openclaw_session_key TEXT NOT NULL,
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  discord_message_id TEXT NOT NULL UNIQUE,
  channel_id TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  expert_id TEXT REFERENCES experts(id),
  agent_id TEXT REFERENCES agents(id),
  session_id TEXT REFERENCES conversation_sessions(id),
  role TEXT NOT NULL,
  message_type TEXT NOT NULL,
  content TEXT NOT NULL,
  raw_event_json TEXT NOT NULL,
  routing_metadata_json TEXT,
  openclaw_status TEXT,
  openclaw_trace_id TEXT,
  openclaw_provider_response_id TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
`;
