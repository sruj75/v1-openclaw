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

export const DISCORD_GUILD_MESSAGES_INTENT = 1 << 9;
export const DISCORD_DIRECT_MESSAGES_INTENT = 1 << 12;
export const DISCORD_MESSAGE_CONTENT_INTENT = 1 << 15;
export const DEFAULT_DISCORD_GATEWAY_INTENTS =
  DISCORD_GUILD_MESSAGES_INTENT | DISCORD_DIRECT_MESSAGES_INTENT | DISCORD_MESSAGE_CONTENT_INTENT;

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
const GATEWAY_OPCODE_RESUME = 6;
const GATEWAY_OPCODE_RECONNECT = 7;
const GATEWAY_OPCODE_INVALID_SESSION = 9;
const GATEWAY_OPCODE_HELLO = 10;
const GATEWAY_OPCODE_HEARTBEAT_ACK = 11;
const MAX_GATEWAY_RECONNECT_ATTEMPTS = 3;

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
  let heartbeatAcknowledged = true;
  let lastSequence: number | null = null;
  let sessionId: string | undefined;
  let resumeGatewayUrl: string | undefined;
  let shouldResumeNextConnection = false;
  let reconnectAttempts = 0;
  let isShuttingDown = false;
  let selfUserId = config.selfUserId;
  let onMessage: DiscordInboundMessageHandler | undefined;
  const ignoredCloseSockets = new Set<DiscordGatewaySocket>();

  async function handleSocketMessage(event: { data?: unknown }): Promise<void> {
    const envelope = parseGatewayEnvelope(event.data);
    if (typeof envelope.s === "number") {
      lastSequence = envelope.s;
    }

    if (envelope.op === GATEWAY_OPCODE_HELLO) {
      startHeartbeat(envelope.d);
      if (shouldResumeNextConnection && sessionId) {
        sendResume();
      } else {
        sendIdentify();
      }
      return;
    }

    if (envelope.op === GATEWAY_OPCODE_HEARTBEAT) {
      sendHeartbeat();
      return;
    }

    if (envelope.op === GATEWAY_OPCODE_HEARTBEAT_ACK) {
      heartbeatAcknowledged = true;
      return;
    }

    if (envelope.op === GATEWAY_OPCODE_RECONNECT || envelope.op === GATEWAY_OPCODE_INVALID_SESSION) {
      const canResume = envelope.op === GATEWAY_OPCODE_RECONNECT || envelope.d === true;
      logger.warn(
        canResume
          ? "Discord gateway requested reconnect; attempting to resume the session."
          : "Discord gateway invalidated the session; reconnecting with a fresh identify."
      );
      reconnectGateway(canResume);
      return;
    }

    if (envelope.op !== GATEWAY_OPCODE_DISPATCH) {
      return;
    }

    if (envelope.t === "READY") {
      const ready = readReadyState(envelope.d);
      selfUserId = ready.selfUserId ?? selfUserId;
      sessionId = ready.sessionId ?? sessionId;
      resumeGatewayUrl = ready.resumeGatewayUrl ?? resumeGatewayUrl;
      reconnectAttempts = 0;
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
    shouldResumeNextConnection = false;
    sendGatewayPayload({
      op: GATEWAY_OPCODE_IDENTIFY,
      d: {
        token,
        intents,
        properties: {
          os: "node",
          browser: "v1-openclaw",
          device: "v1-openclaw"
        }
      }
    });
  }

  function sendResume(): void {
    shouldResumeNextConnection = false;
    sendGatewayPayload({
      op: GATEWAY_OPCODE_RESUME,
      d: {
        token,
        session_id: sessionId,
        seq: lastSequence
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
      if (!heartbeatAcknowledged) {
        logger.warn("Discord gateway heartbeat ACK was not received; closing stale connection.");
        socket?.close(4000, "Discord gateway heartbeat ACK not received");
        return;
      }

      sendHeartbeat();
    }, heartbeatIntervalMs);
  }

  function stopHeartbeat(): void {
    if (heartbeatInterval !== undefined) {
      cancelHeartbeat(heartbeatInterval);
      heartbeatInterval = undefined;
    }

    heartbeatAcknowledged = true;
  }

  function sendHeartbeat(): void {
    heartbeatAcknowledged = false;
    sendGatewayPayload({ op: GATEWAY_OPCODE_HEARTBEAT, d: lastSequence });
  }

  function reconnectGateway(canResume: boolean): void {
    stopHeartbeat();
    shouldResumeNextConnection = canResume && sessionId !== undefined;
    const closingSocket = socket;
    if (closingSocket) {
      ignoredCloseSockets.add(closingSocket);
      closingSocket.close(1012, "Discord gateway reconnect requested");
    }

    openGatewaySocket(shouldResumeNextConnection ? resumeGatewayUrl ?? gatewayUrl : gatewayUrl);
  }

  function attachSocketListeners(nextSocket: DiscordGatewaySocket): void {
    nextSocket.addEventListener("message", async (event) => {
      try {
        await handleSocketMessage(event);
      } catch (error) {
        logger.error(error);
        handleUnexpectedGatewayDisconnect(nextSocket, true, "Discord gateway message handling failed");
      }
    });
    nextSocket.addEventListener("error", () => {
      logger.error("Discord gateway socket error; reconnecting.");
      handleUnexpectedGatewayDisconnect(nextSocket, true, "Discord gateway socket error");
    });
    nextSocket.addEventListener("close", () => {
      if (ignoredCloseSockets.delete(nextSocket)) {
        return;
      }

      logger.warn("Discord gateway socket closed unexpectedly; reconnecting.");
      handleUnexpectedGatewayDisconnect(nextSocket, true, "Discord gateway socket closed");
    });
  }

  function openGatewaySocket(url: string): void {
    socket = createWebSocket(url);
    attachSocketListeners(socket);
  }

  function handleUnexpectedGatewayDisconnect(
    disconnectedSocket: DiscordGatewaySocket,
    canResume: boolean,
    closeReason: string
  ): void {
    if (isShuttingDown || disconnectedSocket !== socket) {
      return;
    }

    if (reconnectAttempts >= MAX_GATEWAY_RECONNECT_ATTEMPTS) {
      stopHeartbeat();
      socket = null;
      logger.error(`Discord gateway reconnect limit reached after ${reconnectAttempts} attempts.`);
      return;
    }

    reconnectAttempts += 1;
    ignoredCloseSockets.add(disconnectedSocket);
    disconnectedSocket.close(1011, closeReason);
    stopHeartbeat();
    socket = null;
    shouldResumeNextConnection = canResume && sessionId !== undefined;
    openGatewaySocket(shouldResumeNextConnection ? resumeGatewayUrl ?? gatewayUrl : gatewayUrl);
  }

  function sendGatewayPayload(payload: unknown): void {
    if (!socket) {
      throw new Error("Discord gateway socket is not connected");
    }

    socket.send(JSON.stringify(payload));
  }

  return {
    async connect(input) {
      isShuttingDown = false;
      onMessage = input.onMessage;
      openGatewaySocket(gatewayUrl);
      logger.info("Discord bot adapter connected to gateway.");
    },

    close() {
      isShuttingDown = true;
      stopHeartbeat();

      const closingSocket = socket;
      if (closingSocket) {
        ignoredCloseSockets.add(closingSocket);
        closingSocket.close(1000, "Intentive relay shutdown");
      }
      socket = null;
      shouldResumeNextConnection = false;
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

function readReadyState(data: unknown): {
  selfUserId?: string;
  sessionId?: string;
  resumeGatewayUrl?: string;
} {
  if (!isRecord(data)) {
    return {};
  }

  return {
    selfUserId: isRecord(data.user) && typeof data.user.id === "string" && data.user.id.trim() !== ""
      ? data.user.id
      : undefined,
    sessionId: typeof data.session_id === "string" && data.session_id.trim() !== ""
      ? data.session_id
      : undefined,
    resumeGatewayUrl:
      typeof data.resume_gateway_url === "string" && data.resume_gateway_url.trim() !== ""
        ? data.resume_gateway_url
        : undefined
  };
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
