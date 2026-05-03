import assert from "node:assert/strict";
import test from "node:test";

import { createLangfuseRuntimeBundleClient, fetchRuntimeBundle } from "../dist/openclaw/runtime-bundle.js";

test("fetches Langfuse runtime prompts by production label, latest label, and pinned version", async () => {
  const calls = [];

  const labelBundle = await fetchRuntimeBundle(
    {
      promptName: "intentive-runtime-bundle",
      langfuseLabel: "production",
      env: {
        LANGFUSE_PUBLIC_KEY: "test-public-key",
        LANGFUSE_SECRET_KEY: "test-secret-key"
      }
    },
    {
      client: {
        async fetchPromptByLabel(request) {
          calls.push(request);
          return {
            name: "intentive-runtime-bundle",
            version: 3,
            prompt: "## File: AGENTS.md\n\nProduction guidance."
          };
        }
      }
    }
  );

  const latestBundle = await fetchRuntimeBundle(
    {
      promptName: "intentive-runtime-bundle",
      latest: true,
      env: {
        LANGFUSE_PUBLIC_KEY: "test-public-key",
        LANGFUSE_SECRET_KEY: "test-secret-key"
      }
    },
    {
      client: {
        async fetchPromptByLabel(request) {
          calls.push(request);
          return {
            name: "intentive-runtime-bundle",
            version: 4,
            prompt: "## File: AGENTS.md\n\nLatest guidance."
          };
        }
      }
    }
  );

  const pinnedBundle = await fetchRuntimeBundle(
    {
      promptName: "intentive-runtime-bundle",
      langfuseVersion: "7",
      env: {
        LANGFUSE_PUBLIC_KEY: "test-public-key",
        LANGFUSE_SECRET_KEY: "test-secret-key"
      }
    },
    {
      client: {
        async fetchPromptByVersion(request) {
          calls.push(request);
          return {
            name: "intentive-runtime-bundle",
            version: 7,
            prompt: "## File: AGENTS.md\n\nPinned guidance."
          };
        }
      }
    }
  );

  assert.deepEqual(calls, [
    {
      publicKey: "test-public-key",
      secretKey: "test-secret-key",
      promptName: "intentive-runtime-bundle",
      label: "production"
    },
    {
      publicKey: "test-public-key",
      secretKey: "test-secret-key",
      promptName: "intentive-runtime-bundle",
      label: "latest"
    },
    {
      publicKey: "test-public-key",
      secretKey: "test-secret-key",
      promptName: "intentive-runtime-bundle",
      version: "7"
    }
  ]);
  assert.deepEqual(labelBundle, {
    slug: "intentive-runtime-bundle",
    resolvedVersionId: "3",
    content: "## File: AGENTS.md\n\nProduction guidance."
  });
  assert.deepEqual(latestBundle, {
    slug: "intentive-runtime-bundle",
    resolvedVersionId: "4",
    content: "## File: AGENTS.md\n\nLatest guidance."
  });
  assert.deepEqual(pinnedBundle, {
    slug: "intentive-runtime-bundle",
    resolvedVersionId: "7",
    content: "## File: AGENTS.md\n\nPinned guidance."
  });
});

test("fails explicitly when Langfuse fetch inputs or responses are invalid", async () => {
  await assert.rejects(
    fetchRuntimeBundle(
      {
        promptName: "intentive-runtime-bundle",
        langfuseLabel: "production",
        env: {}
      },
      {
        client: {}
      }
    ),
    /Langfuse public key is required/
  );

  await assert.rejects(
    fetchRuntimeBundle(
      {
        promptName: " ",
        langfuseLabel: "production",
        env: {
          LANGFUSE_PUBLIC_KEY: "test-public-key",
          LANGFUSE_SECRET_KEY: "test-secret-key"
        }
      },
      {
        client: {}
      }
    ),
    /Langfuse prompt name is required/
  );

  await assert.rejects(
    fetchRuntimeBundle(
      {
        promptName: "intentive-runtime-bundle",
        langfuseLabel: " ",
        env: {
          LANGFUSE_PUBLIC_KEY: "test-public-key",
          LANGFUSE_SECRET_KEY: "test-secret-key"
        }
      },
      {
        client: {}
      }
    ),
    /Langfuse prompt label is required/
  );

  await assert.rejects(
    fetchRuntimeBundle(
      {
        promptName: "intentive-runtime-bundle",
        langfuseVersion: " ",
        env: {
          LANGFUSE_PUBLIC_KEY: "test-public-key",
          LANGFUSE_SECRET_KEY: "test-secret-key"
        }
      },
      {
        client: {}
      }
    ),
    /Langfuse prompt version is required/
  );

  await assert.rejects(
    fetchRuntimeBundle(
      {
        promptName: "intentive-runtime-bundle",
        langfuseLabel: "production",
        latest: true,
        env: {
          LANGFUSE_PUBLIC_KEY: "test-public-key",
          LANGFUSE_SECRET_KEY: "test-secret-key"
        }
      },
      {
        client: {}
      }
    ),
    /Langfuse prompt fetch requires exactly one selector/
  );

  await assert.rejects(
    fetchRuntimeBundle(
      {
        promptName: "intentive-runtime-bundle",
        langfuseLabel: "production",
        env: {
          LANGFUSE_PUBLIC_KEY: "test-public-key",
          LANGFUSE_SECRET_KEY: "test-secret-key"
        }
      },
      {
        client: {
          async fetchPromptByLabel() {
            return {
              name: "intentive-runtime-bundle",
              version: 1,
              prompt: " "
            };
          }
        }
      }
    ),
    /Langfuse prompt content is required/
  );

  await assert.rejects(
    fetchRuntimeBundle(
      {
        promptName: "intentive-runtime-bundle",
        langfuseLabel: "production",
        env: {
          LANGFUSE_PUBLIC_KEY: "test-public-key",
          LANGFUSE_SECRET_KEY: "test-secret-key"
        }
      },
      {
        client: {
          async fetchPromptByLabel() {
            return {
              name: "intentive-runtime-bundle",
              version: "not-a-number",
              prompt: "## File: AGENTS.md"
            };
          }
        }
      }
    ),
    /Langfuse prompt version is required/
  );
});

test("Langfuse REST client fetches prompts with Basic Auth, selectors, base URL, and timeout handling", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];

  globalThis.fetch = async (input, init) => {
    calls.push({
      url: String(input),
      authorization: init?.headers?.Authorization,
      signal: init?.signal
    });

    return new Response(
      JSON.stringify({
        name: "folder/prompt one",
        version: 11,
        prompt: "## Config: openclaw\n\n{}"
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      }
    );
  };

  try {
    const client = createLangfuseRuntimeBundleClient({
      LANGFUSE_BASE_URL: "https://example.langfuse.test/",
      LANGFUSE_PUBLIC_KEY: "public-1",
      LANGFUSE_SECRET_KEY: "secret-1"
    });

    assert.deepEqual(
      await client.fetchPromptByLabel({
        publicKey: "public-1",
        secretKey: "secret-1",
        promptName: "folder/prompt one",
        label: "production"
      }),
      {
        name: "folder/prompt one",
        version: 11,
        prompt: "## Config: openclaw\n\n{}"
      }
    );
    await client.fetchPromptByVersion({
      publicKey: "public-1",
      secretKey: "secret-1",
      promptName: "folder/prompt one",
      version: "12"
    });

    assert.equal(calls[0].url, "https://example.langfuse.test/api/public/v2/prompts/folder%2Fprompt%20one?label=production");
    assert.equal(calls[1].url, "https://example.langfuse.test/api/public/v2/prompts/folder%2Fprompt%20one?version=12");
    assert.equal(calls[0].authorization, `Basic ${Buffer.from("public-1:secret-1").toString("base64")}`);
    assert.ok(calls[0].signal instanceof AbortSignal);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Langfuse REST client defaults to US Cloud and reports non-200 and timeout failures", async () => {
  const originalFetch = globalThis.fetch;

  globalThis.fetch = async () => new Response("missing", { status: 404 });

  try {
    const client = createLangfuseRuntimeBundleClient({});

    await assert.rejects(
      client.fetchPromptByLabel({
        publicKey: "public-1",
        secretKey: "secret-1",
        promptName: "intentive-runtime-bundle",
        label: "production"
      }),
      /Langfuse prompt fetch failed with HTTP 404/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }

  globalThis.fetch = async (input) => {
    assert.equal(
      String(input),
      "https://us.cloud.langfuse.com/api/public/v2/prompts/intentive-runtime-bundle?label=production"
    );
    const error = new Error("expired");
    error.name = "TimeoutError";
    throw error;
  };

  try {
    const client = createLangfuseRuntimeBundleClient({});

    await assert.rejects(
      client.fetchPromptByLabel({
        publicKey: "public-1",
        secretKey: "secret-1",
        promptName: "intentive-runtime-bundle",
        label: "production"
      }),
      /Langfuse prompt fetch timed out after 30000ms/
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
