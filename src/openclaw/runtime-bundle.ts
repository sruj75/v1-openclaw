export type RuntimeBundle = {
  slug: string;
  resolvedVersionId: string;
  content: unknown;
};

export type RuntimeBundleFetchOptions = {
  promptName: string;
  latest?: boolean;
  langfuseLabel?: string;
  langfuseVersion?: string;
  env?: Record<string, string | undefined>;
};

export type RuntimeBundleClient = {
  fetchPromptByLabel?(request: LangfusePromptByLabelRequest): Promise<LangfusePromptResponse>;
  fetchPromptByVersion?(request: LangfusePromptByVersionRequest): Promise<LangfusePromptResponse>;
};

export type LangfusePromptByLabelRequest = LangfusePromptClientRequest & {
  label: string;
};

export type LangfusePromptByVersionRequest = LangfusePromptClientRequest & {
  version: string;
};

export type LangfusePromptClientRequest = {
  publicKey: string;
  secretKey: string;
  promptName: string;
};

export type LangfusePromptResponse = {
  name?: unknown;
  version?: unknown;
  prompt?: unknown;
};

export type RuntimeBundleDependencies = {
  client: RuntimeBundleClient;
};

const langfuseFetchTimeoutMs = 30_000;
const defaultLangfuseBaseUrl = "https://us.cloud.langfuse.com";

export async function fetchRuntimeBundle(
  options: RuntimeBundleFetchOptions,
  dependencies: RuntimeBundleDependencies
): Promise<RuntimeBundle> {
  const promptName = requireNonEmptyString(options.promptName, "Langfuse prompt name");
  const env = options.env ?? process.env;
  const publicKey = requireNonEmptyString(env.LANGFUSE_PUBLIC_KEY, "Langfuse public key");
  const secretKey = requireNonEmptyString(env.LANGFUSE_SECRET_KEY, "Langfuse secret key");
  const version = normalizeOptionalString(options.langfuseVersion, "Langfuse prompt version");

  if (countSelectors(options) !== 1) {
    throw new Error("Langfuse prompt fetch requires exactly one selector.");
  }

  if (version !== undefined) {
    if (dependencies.client.fetchPromptByVersion === undefined) {
      throw new Error("Langfuse client cannot fetch pinned prompt versions.");
    }

    const response = await dependencies.client.fetchPromptByVersion({
      publicKey,
      secretKey,
      promptName,
      version
    });

    return normalizeRuntimeBundle(response, promptName);
  }

  const label = normalizeRuntimeBundleLabel(options);
  if (dependencies.client.fetchPromptByLabel === undefined) {
    throw new Error("Langfuse client cannot fetch prompt labels.");
  }

  const response = await dependencies.client.fetchPromptByLabel({
    publicKey,
    secretKey,
    promptName,
    label
  });

  return normalizeRuntimeBundle(response, promptName);
}

export function createLangfuseRuntimeBundleClient(env: Record<string, string | undefined>): RuntimeBundleClient {
  return {
    async fetchPromptByLabel(request) {
      return fetchLangfusePrompt({
        env,
        promptName: request.promptName,
        publicKey: request.publicKey,
        secretKey: request.secretKey,
        label: request.label
      });
    },
    async fetchPromptByVersion(request) {
      return fetchLangfusePrompt({
        env,
        promptName: request.promptName,
        publicKey: request.publicKey,
        secretKey: request.secretKey,
        version: request.version
      });
    }
  };
}

function normalizeRuntimeBundleLabel(options: RuntimeBundleFetchOptions): string {
  if (options.latest === true) {
    return "latest";
  }

  return normalizeOptionalString(options.langfuseLabel, "Langfuse prompt label") ?? failMissingSelector();
}

async function fetchLangfusePrompt(options: {
  env: Record<string, string | undefined>;
  promptName: string;
  publicKey: string;
  secretKey: string;
  label?: string;
  version?: string;
}): Promise<LangfusePromptResponse> {
  const apiBase = (options.env.LANGFUSE_BASE_URL ?? defaultLangfuseBaseUrl).replace(/\/$/, "");
  const url = new URL(`${apiBase}/api/public/v2/prompts/${encodeURIComponent(options.promptName)}`);

  if (options.version !== undefined) {
    url.searchParams.set("version", options.version);
  } else {
    url.searchParams.set("label", options.label ?? "production");
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers: {
        Authorization: `Basic ${btoa(`${options.publicKey}:${options.secretKey}`)}`
      },
      signal: AbortSignal.timeout(langfuseFetchTimeoutMs)
    });
  } catch (error) {
    if (isAbortTimeoutError(error)) {
      throw new Error(`Langfuse prompt fetch timed out after ${langfuseFetchTimeoutMs}ms.`);
    }

    throw error;
  }

  if (!response.ok) {
    throw new Error(`Langfuse prompt fetch failed with HTTP ${response.status}.`);
  }

  return readObject(await response.json());
}

function normalizeRuntimeBundle(response: LangfusePromptResponse, expectedPromptName: string): RuntimeBundle {
  if (response === null || typeof response !== "object") {
    throw new Error("Langfuse prompt response must be an object.");
  }

  const version = readVersion(response.version);
  const content = requireNonEmptyString(response.prompt, "Langfuse prompt content");

  return {
    slug: typeof response.name === "string" && response.name.trim() !== "" ? response.name : expectedPromptName,
    resolvedVersionId: version,
    content
  };
}

function readVersion(value: unknown): string {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error("Langfuse prompt version is required.");
  }

  return String(value);
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function normalizeOptionalString(value: unknown, label: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return requireNonEmptyString(value, label);
}

function readObject(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function failMissingSelector(): never {
  throw new Error("Langfuse prompt fetch requires --langfuse-label, --latest, or --langfuse-version <number>.");
}

function countSelectors(options: RuntimeBundleFetchOptions): number {
  return [
    options.latest === true,
    options.langfuseLabel !== undefined,
    options.langfuseVersion !== undefined
  ].filter(Boolean).length;
}

function isAbortTimeoutError(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.name === "AbortError" || error.name === "TimeoutError")
  );
}
