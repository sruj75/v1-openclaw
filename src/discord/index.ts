export type NormalizedDiscordEvent = {
  id: string;
  channelId: string;
  authorId: string;
  content: string;
  occurredAt: string;
  isBot: boolean;
  isSystem: boolean;
  rawEvent: unknown;
};

export type DiscordSendMessageRequest = {
  channelId: string;
  content: string;
  metadata: {
    originatingDiscordMessageId: string;
    sessionId: string;
    agentId: string;
  };
};

export type DiscordSendMessageResult = {
  id: string;
  channelId: string;
};

export type DiscordOutboundAdapter = {
  sendMessage(request: DiscordSendMessageRequest): Promise<DiscordSendMessageResult>;
};

export const DISCORD_DIRECT_MESSAGES_INTENT = 1 << 12;
export const DISCORD_MESSAGE_CONTENT_INTENT = 1 << 15;
export const DEFAULT_DISCORD_GATEWAY_INTENTS =
  DISCORD_DIRECT_MESSAGES_INTENT | DISCORD_MESSAGE_CONTENT_INTENT;

export type DiscordBotAdapterConfig = {
  token: string;
  selfUserId?: string;
  gatewayUrl?: string;
  apiBaseUrl?: string;
  intents?: number;
};

export type DiscordInboundMessageHandler = (event: NormalizedDiscordEvent) => Promise<void> | void;

export type DiscordBotAdapter = DiscordOutboundAdapter & {
  connect(input: { onMessage: DiscordInboundMessageHandler }): Promise<void>;
  close(): void;
  getSelfUserId(): string | undefined;
};

export type DiscordGatewaySocket = {
  addEventListener(type: string, listener: (event: { data?: unknown }) => void | Promise<void>): void;
  send(data: string): void;
  close(code?: number, reason?: string): void;
};

export type DiscordBotAdapterDependencies = {
  createWebSocket?: (url: string) => DiscordGatewaySocket;
  fetch?: (url: string, init: DiscordRestRequestInit) => Promise<DiscordRestResponse>;
  logger?: {
    info(message?: unknown, ...optionalParameters: unknown[]): void;
    warn(message?: unknown, ...optionalParameters: unknown[]): void;
    error(message?: unknown, ...optionalParameters: unknown[]): void;
  };
  setInterval?: (handler: () => void, timeout: number) => unknown;
  clearInterval?: (intervalId: unknown) => void;
};

type DiscordRestRequestInit = {
  method: string;
  headers: Record<string, string>;
  body?: string;
};

type DiscordRestResponse = {
  ok: boolean;
  status: number;
  statusText?: string;
  json(): Promise<unknown>;
  text?(): Promise<string>;
};

type DiscordGatewayEnvelope = {
  op: number;
  d?: unknown;
  s?: number | null;
  t?: string | null;
};

const DISCORD_GATEWAY_URL = "wss://gateway.discord.gg/?v=10&encoding=json";
const DISCORD_API_BASE_URL = "https://discord.com/api/v10";
const GATEWAY_OPCODE_DISPATCH = 0;
const GATEWAY_OPCODE_HEARTBEAT = 1;
const GATEWAY_OPCODE_IDENTIFY = 2;
const GATEWAY_OPCODE_RECONNECT = 7;
const GATEWAY_OPCODE_INVALID_SESSION = 9;
const GATEWAY_OPCODE_HELLO = 10;

export function createDiscordBotAdapter(
  config: DiscordBotAdapterConfig,
  dependencies: DiscordBotAdapterDependencies = {}
): DiscordBotAdapter {
  const token = requireNonEmptyString(config.token, "Discord bot token");
  const gatewayUrl = config.gatewayUrl ?? DISCORD_GATEWAY_URL;
  const apiBaseUrl = stripTrailingSlash(config.apiBaseUrl ?? DISCORD_API_BASE_URL);
  const intents = config.intents ?? DEFAULT_DISCORD_GATEWAY_INTENTS;
  const createWebSocket = dependencies.createWebSocket ?? defaultCreateWebSocket;
  const fetchImpl = dependencies.fetch ?? defaultFetch;
  const logger = dependencies.logger ?? console;
  const scheduleHeartbeat = dependencies.setInterval ?? ((handler, timeout) => setInterval(handler, timeout));
  const cancelHeartbeat = dependencies.clearInterval ?? ((intervalId) => clearInterval(intervalId as number));

  let socket: DiscordGatewaySocket | null = null;
  let heartbeatInterval: unknown;
  let lastSequence: number | null = null;
  let selfUserId = config.selfUserId;
  let onMessage: DiscordInboundMessageHandler | undefined;

  async function handleSocketMessage(event: { data?: unknown }): Promise<void> {
    const envelope = parseGatewayEnvelope(event.data);
    if (typeof envelope.s === "number") {
      lastSequence = envelope.s;
    }

    if (envelope.op === GATEWAY_OPCODE_HELLO) {
      sendIdentify();
      startHeartbeat(envelope.d);
      return;
    }

    if (envelope.op === GATEWAY_OPCODE_RECONNECT || envelope.op === GATEWAY_OPCODE_INVALID_SESSION) {
      logger.warn("Discord gateway requested reconnect; close the adapter and restart the service.");
      socket?.close(1012, "Discord gateway reconnect requested");
      return;
    }

    if (envelope.op !== GATEWAY_OPCODE_DISPATCH) {
      return;
    }

    if (envelope.t === "READY") {
      selfUserId = readReadyUserId(envelope.d) ?? selfUserId;
      return;
    }

    if (envelope.t !== "MESSAGE_CREATE" || !onMessage) {
      return;
    }

    const normalized = normalizeDiscordMessagePayload(envelope.d);
    if (shouldIgnoreInboundDiscordMessage(normalized, selfUserId)) {
      return;
    }

    await onMessage(normalized);
  }

  function sendIdentify(): void {
    sendGatewayPayload({
      op: GATEWAY_OPCODE_IDENTIFY,
      d: {
        token,
        intents,
        properties: {
          $os: "node",
          $browser: "v1-openclaw",
          $device: "v1-openclaw"
        }
      }
    });
  }

  function startHeartbeat(helloData: unknown): void {
    const heartbeatIntervalMs = readHeartbeatInterval(helloData);
    if (!heartbeatIntervalMs) {
      return;
    }

    if (heartbeatInterval !== undefined) {
      cancelHeartbeat(heartbeatInterval);
    }

    heartbeatInterval = scheduleHeartbeat(() => {
      sendGatewayPayload({ op: GATEWAY_OPCODE_HEARTBEAT, d: lastSequence });
    }, heartbeatIntervalMs);
  }

  function sendGatewayPayload(payload: unknown): void {
    if (!socket) {
      throw new Error("Discord gateway socket is not connected");
    }

    socket.send(JSON.stringify(payload));
  }

  return {
    async connect(input) {
      onMessage = input.onMessage;
      socket = createWebSocket(gatewayUrl);
      socket.addEventListener("message", async (event) => {
        try {
          await handleSocketMessage(event);
        } catch (error) {
          logger.error(error);
          throw error;
        }
      });
      logger.info("Discord bot adapter connected to gateway.");
    },

    close() {
      if (heartbeatInterval !== undefined) {
        cancelHeartbeat(heartbeatInterval);
        heartbeatInterval = undefined;
      }

      socket?.close(1000, "Intentive relay shutdown");
      socket = null;
    },

    getSelfUserId() {
      return selfUserId;
    },

    async sendMessage(request) {
      const content = requireNonEmptyString(request.content, "Discord message content");
      const response = await fetchImpl(
        `${apiBaseUrl}/channels/${encodeURIComponent(request.channelId)}/messages`,
        {
          method: "POST",
          headers: {
            authorization: `Bot ${token}`,
            "content-type": "application/json"
          },
          body: JSON.stringify({
            content,
            allowed_mentions: { parse: [] }
          })
        }
      );

      if (!response.ok) {
        const body = response.text ? await response.text() : response.statusText ?? "";
        throw new Error(`Discord sendMessage failed with status ${response.status}: ${body}`);
      }

      const responseBody = await response.json();
      return parseDiscordSendMessageResult(responseBody);
    }
  };
}

export function createRecordingDiscordAdapter(sentMessages: DiscordSendMessageRequest[] = []): DiscordOutboundAdapter {
  return {
    async sendMessage(request) {
      sentMessages.push(request);

      return {
        id: `discord-agent-reply-${sentMessages.length}`,
        channelId: request.channelId
      };
    }
  };
}

export class DiscordPayloadValidationError extends Error {
  constructor(readonly errors: string[]) {
    super(`Invalid Discord payload:\n${errors.map((error) => `- ${error}`).join("\n")}`);
    this.name = "DiscordPayloadValidationError";
  }
}

export function normalizeDiscordMessagePayload(payload: unknown): NormalizedDiscordEvent {
  const errors: string[] = [];

  if (!isRecord(payload)) {
    throw new DiscordPayloadValidationError(["payload must be an object"]);
  }

  const id = readString(payload, "id", errors);
  const channelId = readStringAlias(payload, ["channelId", "channel_id"], errors, "channelId");
  const content = typeof payload.content === "string" ? payload.content : "";
  const author = isRecord(payload.author) ? payload.author : undefined;

  if (!author) {
    errors.push("author must be an object");
  }

  const authorId = author ? readString(author, "id", errors, "author.id") : undefined;
  const occurredAt = typeof payload.timestamp === "string" && payload.timestamp.trim() !== ""
    ? payload.timestamp
    : new Date(0).toISOString();

  if (errors.length > 0 || !id || !channelId || !authorId) {
    throw new DiscordPayloadValidationError(errors);
  }

  return {
    id,
    channelId,
    authorId,
    content,
    occurredAt,
    isBot: author?.bot === true,
    isSystem: payload.system === true,
    rawEvent: payload
  };
}

function parseGatewayEnvelope(data: unknown): DiscordGatewayEnvelope {
  const json = typeof data === "string" ? data : decodeGatewayData(data);
  const parsed = JSON.parse(json) as unknown;

  if (!isRecord(parsed) || typeof parsed.op !== "number") {
    throw new DiscordPayloadValidationError(["gateway envelope op must be a number"]);
  }

  return parsed as DiscordGatewayEnvelope;
}

function decodeGatewayData(data: unknown): string {
  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data);
  }

  throw new DiscordPayloadValidationError(["gateway event data must be JSON text"]);
}

function shouldIgnoreInboundDiscordMessage(event: NormalizedDiscordEvent, selfUserId: string | undefined): boolean {
  return event.isBot || event.isSystem || (selfUserId !== undefined && event.authorId === selfUserId);
}

function readReadyUserId(data: unknown): string | undefined {
  if (!isRecord(data) || !isRecord(data.user)) {
    return undefined;
  }

  return typeof data.user.id === "string" && data.user.id.trim() !== "" ? data.user.id : undefined;
}

function readHeartbeatInterval(data: unknown): number | undefined {
  if (!isRecord(data) || typeof data.heartbeat_interval !== "number") {
    return undefined;
  }

  return data.heartbeat_interval;
}

function parseDiscordSendMessageResult(payload: unknown): DiscordSendMessageResult {
  const errors: string[] = [];

  if (!isRecord(payload)) {
    throw new DiscordPayloadValidationError(["send message response must be an object"]);
  }

  const id = readString(payload, "id", errors);
  const channelId = readStringAlias(payload, ["channelId", "channel_id"], errors, "channelId");

  if (errors.length > 0 || !id || !channelId) {
    throw new DiscordPayloadValidationError(errors);
  }

  return { id, channelId };
}

function requireNonEmptyString(value: string | undefined, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} is required`);
  }

  return value;
}

function stripTrailingSlash(value: string): string {
  return value.endsWith("/") ? value.slice(0, -1) : value;
}

function defaultCreateWebSocket(url: string): DiscordGatewaySocket {
  return new WebSocket(url);
}

async function defaultFetch(url: string, init: DiscordRestRequestInit): Promise<DiscordRestResponse> {
  return fetch(url, init);
}

export function createSyntheticNormalizedEvent(
  overrides: Partial<NormalizedDiscordEvent> = {}
): NormalizedDiscordEvent {
  return {
    id: overrides.id ?? "synthetic-discord-message-1",
    channelId: overrides.channelId ?? "discord-channel-private-1",
    authorId: overrides.authorId ?? "discord-user-1",
    content: overrides.content ?? "I am stuck starting the next task.",
    occurredAt: overrides.occurredAt ?? new Date(0).toISOString(),
    isBot: overrides.isBot ?? false,
    isSystem: overrides.isSystem ?? false,
    rawEvent: overrides.rawEvent ?? { synthetic: true }
  };
}

function readString(
  value: Record<string, unknown>,
  key: string,
  errors: string[],
  label = key
): string | undefined {
  const fieldValue = value[key];

  if (typeof fieldValue !== "string" || fieldValue.trim() === "") {
    errors.push(`${label} must be a non-empty string`);
    return undefined;
  }

  return fieldValue;
}

function readStringAlias(
  value: Record<string, unknown>,
  keys: string[],
  errors: string[],
  label: string
): string | undefined {
  for (const key of keys) {
    const fieldValue = value[key];
    if (typeof fieldValue === "string" && fieldValue.trim() !== "") {
      return fieldValue;
    }
  }

  errors.push(`${label} must be a non-empty string`);
  return undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
