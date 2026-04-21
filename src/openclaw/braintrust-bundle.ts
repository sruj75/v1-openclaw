export type BraintrustRuntimeBundle = {
  slug: string;
  resolvedVersionId: string;
  content: unknown;
};

export type BraintrustRuntimeBundleFetchOptions = {
  slug: string;
  latest?: boolean;
  braintrustVersion?: string;
  env?: Record<string, string | undefined>;
};

export type BraintrustBundleClient = {
  fetchLatestBundle?(request: BraintrustBundleClientRequest): Promise<BraintrustBundleClientResponse>;
  fetchVersionedBundle?(
    request: BraintrustVersionedBundleClientRequest
  ): Promise<BraintrustBundleClientResponse>;
};

export type BraintrustBundleClientRequest = {
  apiKey: string;
  slug: string;
};

export type BraintrustVersionedBundleClientRequest = BraintrustBundleClientRequest & {
  versionId: string;
};

export type BraintrustBundleClientResponse = {
  slug?: unknown;
  versionId?: unknown;
  content?: unknown;
};

export type BraintrustRuntimeBundleDependencies = {
  client: BraintrustBundleClient;
};

export async function fetchBraintrustRuntimeBundle(
  options: BraintrustRuntimeBundleFetchOptions,
  dependencies: BraintrustRuntimeBundleDependencies
): Promise<BraintrustRuntimeBundle> {
  const slug = requireNonEmptyString(options.slug, "Braintrust bundle slug");
  const apiKey = requireNonEmptyString(
    (options.env ?? process.env).BRAINTRUST_API_KEY,
    "Braintrust API key"
  );

  const versionId = normalizeBraintrustVersion(options.braintrustVersion);

  if (versionId !== undefined) {
    if (dependencies.client.fetchVersionedBundle === undefined) {
      throw new Error("Braintrust client cannot fetch pinned bundle versions.");
    }

    const response = await dependencies.client.fetchVersionedBundle({
      apiKey,
      slug,
      versionId
    });

    return normalizeBraintrustRuntimeBundle(response, slug);
  }

  if (options.latest !== true) {
    throw new Error("Braintrust bundle fetch requires --latest or --braintrust-version <version-id>.");
  }

  if (dependencies.client.fetchLatestBundle === undefined) {
    throw new Error("Braintrust client cannot fetch the latest bundle.");
  }

  const response = await dependencies.client.fetchLatestBundle({
    apiKey,
    slug
  });

  return normalizeBraintrustRuntimeBundle(response, slug);
}

function normalizeBraintrustRuntimeBundle(
  response: BraintrustBundleClientResponse,
  expectedSlug: string
): BraintrustRuntimeBundle {
  if (response === null || typeof response !== "object") {
    throw new Error("Braintrust bundle response must be an object.");
  }

  const versionId = requireNonEmptyString(response.versionId, "Braintrust bundle version ID");

  if (!Object.hasOwn(response, "content") || response.content === undefined) {
    throw new Error("Braintrust bundle content is required.");
  }

  return {
    slug: typeof response.slug === "string" && response.slug.trim() !== "" ? response.slug : expectedSlug,
    resolvedVersionId: versionId,
    content: response.content
  };
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(`${label} is required.`);
  }

  return value.trim();
}

function normalizeBraintrustVersion(value: unknown): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Braintrust bundle version ID is required.");
  }

  return value.trim();
}
