import type { DiscordBotAdapterConfig } from "../discord/index.js";
import {
  OPENCLAW_GATEWAY_CLIENT_DEFAULTS,
  type OpenClawGatewayClientConfig
} from "../openclaw/index.js";

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

export function loadOpenClawGatewayConfig(
  env: Record<string, string | undefined> = {}
): OpenClawGatewayClientConfig | undefined {
  const gatewayUrl = readOptionalString(env.OPENCLAW_GATEWAY_URL);
  if (!gatewayUrl) {
    return undefined;
  }

  return {
    gatewayUrl,
    authToken: readOptionalString(env.OPENCLAW_GATEWAY_TOKEN) ?? readOptionalString(env.OPENCLAW_AUTH_TOKEN),
    deviceIdentityJwk: readDeviceIdentityJwk(env.OPENCLAW_DEVICE_IDENTITY_JWK),
    clientVersion:
      readOptionalString(env.OPENCLAW_CLIENT_VERSION) ??
      OPENCLAW_GATEWAY_CLIENT_DEFAULTS.clientVersion,
    clientPlatform:
      readOptionalString(env.OPENCLAW_CLIENT_PLATFORM) ??
      OPENCLAW_GATEWAY_CLIENT_DEFAULTS.clientPlatform,
    clientId: readOptionalString(env.OPENCLAW_CLIENT_ID) ?? OPENCLAW_GATEWAY_CLIENT_DEFAULTS.clientId,
    clientMode:
      readOptionalString(env.OPENCLAW_CLIENT_MODE) ?? OPENCLAW_GATEWAY_CLIENT_DEFAULTS.clientMode,
    deviceFamily:
      readOptionalString(env.OPENCLAW_DEVICE_FAMILY) ??
      OPENCLAW_GATEWAY_CLIENT_DEFAULTS.deviceFamily,
    locale: readOptionalString(env.OPENCLAW_LOCALE) ?? OPENCLAW_GATEWAY_CLIENT_DEFAULTS.locale,
    userAgent:
      readOptionalString(env.OPENCLAW_USER_AGENT) ?? OPENCLAW_GATEWAY_CLIENT_DEFAULTS.userAgent,
    requestTimeoutMs: readOptionalInteger(
      env.OPENCLAW_REQUEST_TIMEOUT_MS,
      "OPENCLAW_REQUEST_TIMEOUT_MS"
    )
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

function readDeviceIdentityJwk(value: string | undefined): JsonWebKey {
  const rawValue = readOptionalString(value);
  if (!rawValue) {
    throw new Error("OPENCLAW_DEVICE_IDENTITY_JWK is required when OPENCLAW_GATEWAY_URL is set.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawValue);
  } catch (error) {
    throw new Error("OPENCLAW_DEVICE_IDENTITY_JWK must be a JSON Web Key object.");
  }

  if (!isRecord(parsed)) {
    throw new Error("OPENCLAW_DEVICE_IDENTITY_JWK must be a JSON Web Key object.");
  }

  if (parsed.kty !== "OKP" || parsed.crv !== "Ed25519") {
    throw new Error("OPENCLAW_DEVICE_IDENTITY_JWK must be an Ed25519 OKP JSON Web Key.");
  }

  if (typeof parsed.x !== "string" || parsed.x.trim() === "") {
    throw new Error("OPENCLAW_DEVICE_IDENTITY_JWK.x must be the raw public key in base64url form.");
  }

  if (typeof parsed.d !== "string" || parsed.d.trim() === "") {
    throw new Error("OPENCLAW_DEVICE_IDENTITY_JWK.d must be present so challenges can be signed.");
  }

  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
