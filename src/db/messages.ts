import type { ClassifiedDiscordMessage } from "../relay/classification.js";
import type { OpenClawGatewayReply } from "../openclaw/index.js";
import type { ConversationSession } from "./sessions.js";
import type { SqliteDatabase } from "./sqlite.js";

export type PersistedMessage = {
  id: string;
  discordMessageId: string;
  messageType: string;
  role: string;
};

export type MessagePersistenceOptions = {
  session?: ConversationSession | null;
  openClaw?: OpenClawGatewayReply | null;
};

export type AgentReplyMessageInput = {
  discordMessageId: string;
  channelId: string;
  agentId: string;
  session: ConversationSession;
  originatingMessageId: string;
  content: string;
  openClaw: OpenClawGatewayReply;
};

export function persistClassifiedMessage(
  database: SqliteDatabase,
  message: ClassifiedDiscordMessage,
  options: MessagePersistenceOptions = {}
): PersistedMessage {
  const messageId = `discord_${message.event.id}`;
  const routing = message.routing;
  const routingMetadata = buildRoutingMetadata(message, options);

  database
    .prepare(
      `
      INSERT INTO messages (
        id,
        discord_message_id,
        channel_id,
        user_id,
        expert_id,
        agent_id,
        session_id,
        originating_message_id,
        role,
        message_type,
        content,
        raw_event_json,
        routing_metadata_json,
        openclaw_status,
        openclaw_trace_id,
        openclaw_provider_response_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(discord_message_id) DO UPDATE SET
        channel_id = excluded.channel_id,
        user_id = excluded.user_id,
        expert_id = excluded.expert_id,
        agent_id = excluded.agent_id,
        session_id = excluded.session_id,
        originating_message_id = excluded.originating_message_id,
        role = excluded.role,
        message_type = excluded.message_type,
        content = excluded.content,
        raw_event_json = excluded.raw_event_json,
        routing_metadata_json = excluded.routing_metadata_json,
        openclaw_status = excluded.openclaw_status,
        openclaw_trace_id = excluded.openclaw_trace_id,
        openclaw_provider_response_id = excluded.openclaw_provider_response_id
      `
    )
    .run(
      messageId,
      message.event.id,
      message.event.channelId,
      message.role === "user" ? routing?.user.id ?? null : null,
      message.role === "expert" ? routing?.expert.id ?? null : null,
      routing?.agent.id ?? null,
      options.session?.id ?? null,
      message.role,
      message.messageType,
      message.event.content,
      JSON.stringify({
        normalized: message.event,
        raw: message.event.rawEvent
      }),
      routingMetadata ? JSON.stringify(routingMetadata) : null,
      options.openClaw?.status ?? null,
      options.openClaw?.traceId ?? null,
      options.openClaw?.providerResponseId ?? null
    );

  return {
    id: messageId,
    discordMessageId: message.event.id,
    messageType: message.messageType,
    role: message.role
  };
}

export function persistAgentReplyMessage(
  database: SqliteDatabase,
  input: AgentReplyMessageInput
): PersistedMessage {
  const messageId = `discord_${input.discordMessageId}`;

  database
    .prepare(
      `
      INSERT INTO messages (
        id,
        discord_message_id,
        channel_id,
        user_id,
        expert_id,
        agent_id,
        session_id,
        originating_message_id,
        role,
        message_type,
        content,
        raw_event_json,
        routing_metadata_json,
        openclaw_status,
        openclaw_trace_id,
        openclaw_provider_response_id
      )
      VALUES (?, ?, ?, NULL, NULL, ?, ?, ?, 'agent', 'agent_reply', ?, ?, ?, ?, ?, ?)
      ON CONFLICT(discord_message_id) DO UPDATE SET
        channel_id = excluded.channel_id,
        agent_id = excluded.agent_id,
        session_id = excluded.session_id,
        originating_message_id = excluded.originating_message_id,
        role = excluded.role,
        message_type = excluded.message_type,
        content = excluded.content,
        raw_event_json = excluded.raw_event_json,
        routing_metadata_json = excluded.routing_metadata_json,
        openclaw_status = excluded.openclaw_status,
        openclaw_trace_id = excluded.openclaw_trace_id,
        openclaw_provider_response_id = excluded.openclaw_provider_response_id
      `
    )
    .run(
      messageId,
      input.discordMessageId,
      input.channelId,
      input.agentId,
      input.session.id,
      input.originatingMessageId,
      input.content,
      JSON.stringify({
        openClawReply: input.openClaw.reply ?? null
      }),
      JSON.stringify({
        sessionId: input.session.id,
        openClawSessionKey: input.session.openClawSessionKey,
        originatingMessageId: input.originatingMessageId
      }),
      input.openClaw.status,
      input.openClaw.traceId ?? null,
      input.openClaw.providerResponseId ?? input.openClaw.reply?.runtimeMessageId ?? null
    );

  return {
    id: messageId,
    discordMessageId: input.discordMessageId,
    messageType: "agent_reply",
    role: "agent"
  };
}

function buildRoutingMetadata(
  message: ClassifiedDiscordMessage,
  options: MessagePersistenceOptions
): Record<string, unknown> | null {
  if (!message.routing && !options.session && !options.openClaw) {
    return null;
  }

  return {
    shouldForwardToOpenClaw: message.shouldForwardToOpenClaw,
    assignmentId: message.routing?.assignmentId ?? null,
    userId: message.routing?.user.id ?? null,
    expertId: message.routing?.expert.id ?? null,
    agentId: message.routing?.agent.id ?? null,
    discordChannelId: message.routing?.discordChannelId ?? message.event.channelId,
    sessionId: options.session?.id ?? null,
    openClawSessionKey: options.session?.openClawSessionKey ?? null
  };
}
