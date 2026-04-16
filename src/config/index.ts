import type { DiscordBotAdapterConfig } from "../discord/index.js";

export type RelayConfig = {
  environment: string;
  serviceName: string;
  databasePath: string;
};

export function loadConfig(env: Record<string, string | undefined> = {}): RelayConfig {
  return {
    environment: env.NODE_ENV ?? "development",
    serviceName: env.SERVICE_NAME ?? "intentive-relay",
    databasePath: env.RELAY_DATABASE_PATH ?? env.DATABASE_PATH ?? "data/local.sqlite"
  };
}

export function loadDiscordBotConfig(
  env: Record<string, string | undefined> = {}
): DiscordBotAdapterConfig {
  const token = env.DISCORD_BOT_TOKEN;
  if (typeof token !== "string" || token.trim() === "") {
    throw new Error("DISCORD_BOT_TOKEN is required to run the Discord bot adapter.");
  }

  return {
    token: token.trim(),
    selfUserId: readOptionalString(env.DISCORD_BOT_USER_ID),
    gatewayUrl: readOptionalString(env.DISCORD_GATEWAY_URL),
    apiBaseUrl: readOptionalString(env.DISCORD_API_BASE_URL),
    intents: readOptionalInteger(env.DISCORD_GATEWAY_INTENTS, "DISCORD_GATEWAY_INTENTS")
  };
}

function readOptionalString(value: string | undefined): string | undefined {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function readOptionalInteger(value: string | undefined, label: string): number | undefined {
  if (value === undefined || value.trim() === "") {
    return undefined;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${label} must be a non-negative integer.`);
  }

  return parsed;
}
