export type OpenClawGatewayReply = {
  status: "ok" | "not_configured" | "failed";
  message?: string;
  reply?: {
    content: string;
    runtimeMessageId?: string;
  };
  traceId?: string;
  providerResponseId?: string;
};

export type OpenClawGatewayRequest = {
  agentId: string;
  sessionKey: string;
  message: string;
  metadata: {
    discordMessageId: string;
    discordChannelId: string;
    userId: string;
    expertId: string;
    assignmentId: string;
  };
};

export type OpenClawGatewayClient = {
  sendUserMessage(request: OpenClawGatewayRequest): Promise<OpenClawGatewayReply>;
  close?(): void;
};

export type OpenClawGatewaySocket = {
  addEventListener(type: string, listener: (event: { data?: unknown }) => void | Promise<void>): void;
  send(data: string): void;
  close(code?: number, reason?: string): void;
};

export type OpenClawGatewayClientConfig = {
  gatewayUrl: string;
  authToken?: string;
  deviceIdentityJwk: JsonWebKey;
  clientVersion?: string;
  clientPlatform?: string;
  clientId?: string;
  clientMode?: string;
  deviceFamily?: string;
  locale?: string;
  userAgent?: string;
  requestTimeoutMs?: number;
};

export type OpenClawGatewayClientDependencies = {
  createWebSocket?: (url: string) => OpenClawGatewaySocket;
  now?: () => number;
};

type PendingRequest = {
  resolve(value: unknown): void;
  reject(error: Error): void;
  timeoutId: number;
};

type ChatTerminalEvent = {
  kind: "final" | "error" | "aborted";
  runId?: string;
  sessionKey?: string;
  content?: string;
  message?: string;
  traceId?: string;
  providerResponseId?: string;
  runtimeMessageId?: string;
};

type ChatTerminalWaiter = {
  sessionKey: string;
  runId?: string;
  resolve(event: ChatTerminalEvent): void;
  reject(error: Error): void;
  timeoutId: number;
};

type AssistantHistoryCursor = {
  index: number;
  runtimeMessageId?: string;
};

const PROTOCOL_VERSION = 3;
const DEFAULT_CLIENT_ID = "cli";
const DEFAULT_CLIENT_MODE = "operator";
const DEFAULT_CLIENT_VERSION = "0.1.0";
const DEFAULT_CLIENT_PLATFORM = "node";
const DEFAULT_DEVICE_FAMILY = "server";
const DEFAULT_LOCALE = "en-US";
const DEFAULT_USER_AGENT = "v1-openclaw/0.1.0";
const DEFAULT_REQUEST_TIMEOUT_MS = 30_000;
const CONNECT_ROLE = "operator";
const CONNECT_SCOPES = ["operator.read", "operator.write"] as const;

export function createUnconfiguredOpenClawGateway(): OpenClawGatewayClient {
  return {
    async sendUserMessage() {
      return {
        status: "not_configured",
        message: "OpenClaw gateway is not wired in this bootstrap slice."
      };
    }
  };
}

export function createOpenClawGatewayClient(
  config: OpenClawGatewayClientConfig,
  dependencies: OpenClawGatewayClientDependencies = {}
): OpenClawGatewayClient {
  const gatewayUrl = requireNonEmptyString(config.gatewayUrl, "OpenClaw gateway URL");
  const createWebSocket = dependencies.createWebSocket ?? defaultCreateWebSocket;
  const now = dependencies.now ?? (() => Date.now());
  const requestTimeoutMs = config.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;
  const clientId = normalizeMetadata(config.clientId ?? DEFAULT_CLIENT_ID);
  const clientMode = normalizeMetadata(config.clientMode ?? DEFAULT_CLIENT_MODE);
  const clientPlatform = normalizeMetadata(config.clientPlatform ?? DEFAULT_CLIENT_PLATFORM);
  const deviceFamily = normalizeMetadata(config.deviceFamily ?? DEFAULT_DEVICE_FAMILY);
  const clientVersion = requireNonEmptyString(
    config.clientVersion ?? DEFAULT_CLIENT_VERSION,
    "OpenClaw client version"
  );
  const locale = requireNonEmptyString(config.locale ?? DEFAULT_LOCALE, "OpenClaw locale");
  const userAgent = requireNonEmptyString(config.userAgent ?? DEFAULT_USER_AGENT, "OpenClaw user agent");

  let socket: OpenClawGatewaySocket | null = null;
  let connectPromise: Promise<void> | null = null;
  let connected = false;
  let nextRequestId = 1;
  let challengeNonce: string | null = null;
  let resolveChallenge: ((nonce: string) => void) | null = null;
  let rejectChallenge: ((error: Error) => void) | null = null;
  const pendingRequests = new Map<string, PendingRequest>();
  const bufferedChatTerminalEvents: ChatTerminalEvent[] = [];
  const chatTerminalWaiters: ChatTerminalWaiter[] = [];

  async function sendUserMessage(request: OpenClawGatewayRequest): Promise<OpenClawGatewayReply> {
    await ensureConnected();

    const sessionKey = requireNonEmptyString(request.sessionKey, "OpenClaw session key");
    const message = requireNonEmptyString(request.message, "OpenClaw chat message");
    const idempotencyKey = requireNonEmptyString(
      request.metadata.discordMessageId,
      "OpenClaw idempotency key"
    );
    const historyCursorPromise = readAssistantHistoryCursor(sessionKey).catch(() => null);

    let sendResult: unknown;
    try {
      sendResult = await sendRequest("chat.send", {
        sessionKey,
        message,
        idempotencyKey
      });
    } catch (error) {
      return {
        status: "failed",
        message: error instanceof Error ? error.message : "OpenClaw chat.send failed"
      };
    }

    const runId = readStringField(sendResult, ["runId", "run_id", "id"]);
    let shouldStopHistoryPolling = false;
    const terminalEventWaiters: Promise<ChatTerminalEvent>[] = [
      waitForChatTerminalEvent(sessionKey, runId)
    ];
    terminalEventWaiters.push(
      waitForAssistantReplyFromHistory(sessionKey, historyCursorPromise, () => shouldStopHistoryPolling)
    );

    const terminalEvent: ChatTerminalEvent = await Promise.race(terminalEventWaiters)
      .catch((error) => ({
        kind: "error" as const,
        sessionKey,
        runId,
        message: error instanceof Error ? error.message : "OpenClaw chat event wait failed"
      }))
      .finally(() => {
        shouldStopHistoryPolling = true;
      });
    const finalContent = terminalEvent.kind === "final" ? terminalEvent.content : undefined;
    if (finalContent) {
      return buildOkReply({
        content: finalContent,
        runtimeMessageId: terminalEvent.runtimeMessageId,
        traceId: terminalEvent.traceId ?? readStringField(sendResult, ["traceId", "trace_id"]),
        providerResponseId:
          terminalEvent.providerResponseId ??
          readStringField(sendResult, ["providerResponseId", "provider_response_id", "responseId"])
      });
    }

    if (terminalEvent.kind === "error") {
      return {
        status: "failed",
        message: terminalEvent.message ?? "OpenClaw chat returned an error.",
        traceId: terminalEvent.traceId ?? readStringField(sendResult, ["traceId", "trace_id"])
      };
    }

    const historyCursor = await historyCursorPromise;
    const historyReply = historyCursor
      ? await readAssistantReplyFromHistory(sessionKey, historyCursor).catch(() => null)
      : null;
    if (historyReply) {
      return buildOkReply({
        content: historyReply.content,
        runtimeMessageId: historyReply.runtimeMessageId,
        traceId: terminalEvent.traceId ?? readStringField(sendResult, ["traceId", "trace_id"]),
        providerResponseId:
          terminalEvent.providerResponseId ??
          readStringField(sendResult, ["providerResponseId", "provider_response_id", "responseId"]) ??
          historyReply.runtimeMessageId
      });
    }

    return {
      status: "failed",
      message: terminalEvent.message ?? `OpenClaw chat.${terminalEvent.kind} did not include assistant text`
    };
  }

  async function ensureConnected(): Promise<void> {
    if (connected) {
      return;
    }

    if (connectPromise) {
      return connectPromise;
    }

    connectPromise = connectToGateway().catch((error) => {
      connected = false;
      connectPromise = null;
      rejectAllPendingRequests(
        pendingRequests,
        error instanceof Error ? error : new Error("OpenClaw gateway connect failed")
      );
      throw error;
    });

    return connectPromise;
  }

  async function connectToGateway(): Promise<void> {
    const challengePromise = waitForConnectChallenge();
    socket = createWebSocket(gatewayUrl);
    socket.addEventListener("message", async (event) => {
      await handleSocketMessage(event.data);
    });
    socket.addEventListener("error", () => {
      const error = new Error("OpenClaw gateway socket error");
      rejectChallenge?.(error);
      rejectAllPendingRequests(pendingRequests, error);
    });
    socket.addEventListener("close", () => {
      if (!connected) {
        rejectChallenge?.(new Error("OpenClaw gateway closed before connect completed"));
      }

      challengeNonce = null;
      resolveChallenge = null;
      rejectChallenge = null;
      connected = false;
      connectPromise = null;
    });

    const nonce = await challengePromise;
    const auth = await buildDeviceChallengeAuth(nonce);

    await sendRequest("connect", {
      minProtocol: PROTOCOL_VERSION,
      maxProtocol: PROTOCOL_VERSION,
      client: {
        id: clientId,
        version: clientVersion,
        platform: clientPlatform,
        deviceFamily,
        mode: clientMode
      },
      role: CONNECT_ROLE,
      scopes: [...CONNECT_SCOPES],
      caps: [],
      commands: [],
      permissions: {},
      auth: {
        token: config.authToken
      },
      device: auth,
      locale,
      userAgent
    });

    connected = true;
  }

  async function buildDeviceChallengeAuth(nonce: string): Promise<Record<string, string | number>> {
    const publicKey = requireNonEmptyString(config.deviceIdentityJwk.x, "OpenClaw device public key");
    const rawPublicKey = base64UrlToBytes(publicKey);
    const deviceId = bytesToHex(await crypto.subtle.digest("SHA-256", rawPublicKey));
    const signedAtMs = now();
    const signaturePayload = [
      "v3",
      deviceId,
      clientId,
      clientMode,
      CONNECT_ROLE,
      CONNECT_SCOPES.join(","),
      String(signedAtMs),
      config.authToken ?? "",
      nonce,
      clientPlatform,
      deviceFamily
    ].join("|");
    const privateKey = await crypto.subtle.importKey(
      "jwk",
      config.deviceIdentityJwk,
      { name: "Ed25519" },
      false,
      ["sign"]
    );
    const signature = await crypto.subtle.sign(
      "Ed25519",
      privateKey,
      new TextEncoder().encode(signaturePayload)
    );

    return {
      id: deviceId,
      publicKey,
      signedAt: signedAtMs,
      nonce,
      signature: bytesToBase64Url(signature)
    };
  }

  function sendRequest(method: string, params: unknown): Promise<unknown> {
    const id = `openclaw-${nextRequestId}`;
    nextRequestId += 1;

    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error("OpenClaw gateway socket is not connected"));
        return;
      }

      const timeoutId = setTimeout(() => {
        pendingRequests.delete(id);
        reject(new Error(`OpenClaw ${method} timed out after ${requestTimeoutMs}ms`));
      }, requestTimeoutMs);
      pendingRequests.set(id, { resolve, reject, timeoutId });

      socket.send(
        JSON.stringify({
          type: "req",
          id,
          method,
          params
        })
      );
    });
  }

  async function handleSocketMessage(data: unknown): Promise<void> {
    const frame = parseJsonFrame(data);
    if (handleResponseFrame(frame)) {
      return;
    }

    const eventName = readEventName(frame);
    if (!eventName) {
      return;
    }

    const payload = readFramePayload(frame);
    if (eventName === "connect.challenge") {
      const nonce = readStringField(payload, ["nonce", "challengeNonce", "challenge_nonce"]);
      if (!nonce) {
        rejectChallenge?.(new Error("OpenClaw connect.challenge missing nonce"));
        return;
      }

      challengeNonce = nonce;
      resolveChallenge?.(nonce);
      resolveChallenge = null;
      rejectChallenge = null;
      return;
    }

    const terminalEvent = parseChatTerminalEvent(eventName, payload);
    if (terminalEvent) {
      const waiterIndex = chatTerminalWaiters.findIndex((waiter) =>
        chatTerminalMatches(terminalEvent, waiter.sessionKey, waiter.runId)
      );
      if (waiterIndex !== -1) {
        const [waiter] = chatTerminalWaiters.splice(waiterIndex, 1);
        clearTimeout(waiter.timeoutId);
        waiter.resolve(terminalEvent);
        return;
      }

      bufferedChatTerminalEvents.push(terminalEvent);
    }
  }

  function handleResponseFrame(frame: Record<string, unknown>): boolean {
    const id = typeof frame.id === "string" ? frame.id : undefined;
    if (!id || !pendingRequests.has(id)) {
      return false;
    }

    const pending = pendingRequests.get(id);
    if (!pending) {
      return true;
    }

    pendingRequests.delete(id);
    clearTimeout(pending.timeoutId);

    const error = frame.error;
    if (error) {
      pending.reject(new Error(readErrorMessage(error)));
      return true;
    }

    if (frame.ok === false) {
      pending.reject(new Error(readErrorMessage(frame)));
      return true;
    }

    pending.resolve(frame.result ?? frame.payload ?? frame.data ?? frame.d ?? {});
    return true;
  }

  function waitForConnectChallenge(): Promise<string> {
    return new Promise((resolve, reject) => {
      resolveChallenge = resolve;
      rejectChallenge = reject;
    });
  }

  function waitForChatTerminalEvent(sessionKey: string, runId: string | undefined): Promise<ChatTerminalEvent> {
    const buffered = takeBufferedChatTerminalEvent(sessionKey, runId);
    if (buffered) {
      return Promise.resolve(buffered);
    }

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        const waiterIndex = chatTerminalWaiters.findIndex((waiter) => waiter.timeoutId === timeoutId);
        if (waiterIndex !== -1) {
          chatTerminalWaiters.splice(waiterIndex, 1);
        }

        reject(new Error(`OpenClaw chat event timed out after ${requestTimeoutMs}ms`));
      }, requestTimeoutMs);
      chatTerminalWaiters.push({ sessionKey, runId, resolve, reject, timeoutId });
    });
  }

  function takeBufferedChatTerminalEvent(
    sessionKey: string,
    runId: string | undefined
  ): ChatTerminalEvent | undefined {
    const index = bufferedChatTerminalEvents.findIndex((event) =>
      chatTerminalMatches(event, sessionKey, runId)
    );

    if (index === -1) {
      return undefined;
    }

    const [event] = bufferedChatTerminalEvents.splice(index, 1);
    return event;
  }

  async function readAssistantHistoryCursor(sessionKey: string): Promise<AssistantHistoryCursor> {
    const history = await sendRequest("chat.history", { sessionKey });
    const messages = readHistoryMessages(history);
    for (let index = messages.length - 1; index >= 0; index -= 1) {
      if (isAssistantHistoryMessage(messages[index])) {
        return {
          index,
          runtimeMessageId: readStringField(messages[index], ["id", "messageId", "message_id"])
        };
      }
    }

    return { index: -1 };
  }

  async function readAssistantReplyFromHistory(
    sessionKey: string,
    cursor: AssistantHistoryCursor
  ): Promise<{ content: string; runtimeMessageId?: string } | null> {
    const history = await sendRequest("chat.history", { sessionKey });
    const messages = readHistoryMessages(history);
    for (let index = messages.length - 1; index > cursor.index; index -= 1) {
      const message = messages[index];
      if (!isAssistantHistoryMessage(message)) {
        continue;
      }

      const runtimeMessageId = readStringField(message, ["id", "messageId", "message_id"]);
      if (runtimeMessageId && runtimeMessageId === cursor.runtimeMessageId) {
        continue;
      }

      const content = readMessageContent(message);
      if (content) {
        return {
          content,
          runtimeMessageId
        };
      }
    }

    return null;
  }

  async function waitForAssistantReplyFromHistory(
    sessionKey: string,
    cursorPromise: Promise<AssistantHistoryCursor | null>,
    shouldStop: () => boolean
  ): Promise<ChatTerminalEvent> {
    await delay(Math.min(1_000, requestTimeoutMs));
    const cursor = await cursorPromise;
    if (!cursor) {
      return new Promise(() => undefined);
    }

    while (!shouldStop()) {
      const historyReply = await readAssistantReplyFromHistory(sessionKey, cursor).catch(() => null);
      if (historyReply) {
        return {
          kind: "final",
          sessionKey,
          content: historyReply.content,
          runtimeMessageId: historyReply.runtimeMessageId
        };
      }

      await delay(Math.min(2_000, requestTimeoutMs));
    }

    return new Promise(() => undefined);
  }

  return {
    sendUserMessage,

    close() {
      for (const pending of pendingRequests.values()) {
        clearTimeout(pending.timeoutId);
        pending.reject(new Error("OpenClaw gateway client closed"));
      }

      pendingRequests.clear();
      for (const waiter of chatTerminalWaiters.splice(0)) {
        clearTimeout(waiter.timeoutId);
        waiter.reject(new Error("OpenClaw gateway client closed"));
      }

      socket?.close(1000, "Intentive relay shutdown");
      socket = null;
      challengeNonce = null;
      resolveChallenge = null;
      rejectChallenge = null;
      connected = false;
      connectPromise = null;
    }
  };
}

function chatTerminalMatches(
  event: ChatTerminalEvent,
  sessionKey: string,
  runId: string | undefined
): boolean {
  if (event.sessionKey !== undefined && event.sessionKey !== sessionKey) {
    return false;
  }

  return !runId || !event.runId || event.runId === runId;
}

function buildOkReply(input: {
  content: string;
  runtimeMessageId?: string;
  traceId?: string;
  providerResponseId?: string;
}): OpenClawGatewayReply {
  const reply: OpenClawGatewayReply = {
    status: "ok",
    reply: {
      content: input.content
    }
  };

  if (input.runtimeMessageId) {
    reply.reply = {
      content: input.content,
      runtimeMessageId: input.runtimeMessageId
    };
  }

  if (input.traceId) {
    reply.traceId = input.traceId;
  }

  if (input.providerResponseId) {
    reply.providerResponseId = input.providerResponseId;
  }

  return reply;
}

function parseChatTerminalEvent(eventName: string, payload: unknown): ChatTerminalEvent | null {
  const payloadRecord = isRecord(payload) ? payload : {};
  const kind = readChatTerminalKind(eventName, payloadRecord);
  if (!kind) {
    return null;
  }

  const message = readMessageObject(payloadRecord);

  return {
    kind,
    runId: readStringField(payloadRecord, ["runId", "run_id"]),
    sessionKey: readStringField(payloadRecord, ["sessionKey", "session_key"]),
    content: readMessageContent(message ?? payloadRecord),
    message: readStringField(payloadRecord, ["errorMessage", "error_message", "message", "error", "reason"]),
    traceId: readStringField(payloadRecord, ["traceId", "trace_id"]),
    providerResponseId: readStringField(payloadRecord, [
      "providerResponseId",
      "provider_response_id",
      "responseId"
    ]),
    runtimeMessageId: readStringField(message ?? payloadRecord, ["id", "messageId", "message_id"])
  };
}

function readChatTerminalKind(
  eventName: string,
  payload: Record<string, unknown>
): ChatTerminalEvent["kind"] | null {
  if (eventName === "chat") {
    return readPayloadChatState(payload);
  }

  if (!eventName.startsWith("chat.")) {
    return null;
  }

  if (eventName.endsWith(".final") || eventName === "chat.final") {
    return "final";
  }

  if (eventName.endsWith(".error") || eventName === "chat.error") {
    return "error";
  }

  if (eventName.endsWith(".aborted") || eventName === "chat.aborted") {
    return "aborted";
  }

  return null;
}

function readPayloadChatState(payload: Record<string, unknown>): ChatTerminalEvent["kind"] | null {
  if (payload.state === "final" || payload.state === "error" || payload.state === "aborted") {
    return payload.state;
  }

  return null;
}

function readHistoryMessages(history: unknown): Record<string, unknown>[] {
  if (Array.isArray(history)) {
    return history.filter(isRecord);
  }

  if (!isRecord(history)) {
    return [];
  }

  const messages = history.messages ?? history.items ?? history.entries;
  return Array.isArray(messages) ? messages.filter(isRecord) : [];
}

function isAssistantHistoryMessage(message: Record<string, unknown>): boolean {
  const role = readStringField(message, ["role", "authorRole", "author_role"]);
  return role === "assistant" || role === "agent";
}

function readMessageObject(payload: Record<string, unknown>): Record<string, unknown> | null {
  const message = payload.message ?? payload.output ?? payload.reply;
  return isRecord(message) ? message : null;
}

function readMessageContent(payload: unknown): string | undefined {
  if (typeof payload === "string" && payload.trim() !== "") {
    return payload;
  }

  if (!isRecord(payload)) {
    return undefined;
  }

  const content = payload.content ?? payload.text;
  if (typeof content === "string" && content.trim() !== "") {
    return content;
  }

  if (Array.isArray(content)) {
    const textParts: string[] = [];
    for (const part of content) {
      if (typeof part === "string" && part.trim() !== "") {
        textParts.push(part);
        continue;
      }

      if (!isRecord(part)) {
        continue;
      }

      const text = readStringField(part, ["text", "content"]);
      if (text) {
        textParts.push(text);
      }
    }

    const joinedText = textParts.join("").trim();
    return joinedText === "" ? undefined : joinedText;
  }

  return undefined;
}

function readEventName(frame: Record<string, unknown>): string | undefined {
  for (const key of ["event", "name", "method"]) {
    const value = frame[key];
    if (typeof value === "string" && value.trim() !== "") {
      return value;
    }
  }

  return typeof frame.type === "string" && frame.type.includes(".") ? frame.type : undefined;
}

function readFramePayload(frame: Record<string, unknown>): unknown {
  return frame.payload ?? frame.data ?? frame.d ?? frame.params ?? frame;
}

function parseJsonFrame(data: unknown): Record<string, unknown> {
  const json = typeof data === "string" ? data : decodeFrameData(data);
  const parsed = JSON.parse(json) as unknown;
  if (!isRecord(parsed)) {
    throw new Error("OpenClaw gateway frame must be a JSON object");
  }

  return parsed;
}

function decodeFrameData(data: unknown): string {
  if (data instanceof ArrayBuffer) {
    return new TextDecoder().decode(data);
  }

  throw new Error("OpenClaw gateway frame data must be JSON text");
}

function readStringField(value: unknown, keys: string[]): string | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  for (const key of keys) {
    const fieldValue = value[key];
    if (typeof fieldValue === "string" && fieldValue.trim() !== "") {
      return fieldValue;
    }
  }

  return undefined;
}

function readErrorMessage(error: unknown): string {
  if (typeof error === "string" && error.trim() !== "") {
    return error;
  }

  if (isRecord(error)) {
    return (
      readStringField(error, ["message", "error", "reason"]) ??
      "OpenClaw gateway request failed"
    );
  }

  return "OpenClaw gateway request failed";
}

function rejectAllPendingRequests(pendingRequests: Map<string, PendingRequest>, error: Error): void {
  for (const pending of pendingRequests.values()) {
    clearTimeout(pending.timeoutId);
    pending.reject(error);
  }

  pendingRequests.clear();
}

function requireNonEmptyString(value: string | undefined, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} is required`);
  }

  return value.trim();
}

function normalizeMetadata(value: string | undefined): string {
  return (value ?? "").trim().replace(/[A-Z]/g, (character) => character.toLowerCase());
}

function base64UrlToBytes(value: string): Uint8Array<ArrayBuffer> {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function bytesToBase64Url(value: ArrayBuffer): string {
  const bytes = new Uint8Array(value);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function bytesToHex(value: ArrayBuffer): string {
  return [...new Uint8Array(value)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function defaultCreateWebSocket(url: string): OpenClawGatewaySocket {
  return new WebSocket(url);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
