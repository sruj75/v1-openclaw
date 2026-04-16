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
