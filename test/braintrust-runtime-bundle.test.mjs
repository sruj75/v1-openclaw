import assert from "node:assert/strict";
import test from "node:test";

import { fetchBraintrustRuntimeBundle } from "../dist/openclaw/braintrust-bundle.js";

test("fetches the latest Braintrust runtime bundle by slug", async () => {
  const calls = [];
  const bundle = await fetchBraintrustRuntimeBundle(
    {
      slug: "intentive-runtime-bundle",
      latest: true,
      env: {
        BRAINTRUST_API_KEY: "test-api-key"
      }
    },
    {
      client: {
        async fetchLatestBundle(request) {
          calls.push(request);
          return {
            slug: "intentive-runtime-bundle",
            versionId: "version-latest-1",
            content: {
              runtime: "mock-runtime"
            }
          };
        }
      }
    }
  );

  assert.deepEqual(calls, [
    {
      apiKey: "test-api-key",
      slug: "intentive-runtime-bundle"
    }
  ]);
  assert.deepEqual(bundle, {
    slug: "intentive-runtime-bundle",
    resolvedVersionId: "version-latest-1",
    content: {
      runtime: "mock-runtime"
    }
  });
});

test("fetches a pinned Braintrust runtime bundle version by slug", async () => {
  const calls = [];
  const bundle = await fetchBraintrustRuntimeBundle(
    {
      slug: "intentive-runtime-bundle",
      braintrustVersion: "version-pinned-7",
      env: {
        BRAINTRUST_API_KEY: "test-api-key"
      }
    },
    {
      client: {
        async fetchVersionedBundle(request) {
          calls.push(request);
          return {
            slug: "intentive-runtime-bundle",
            versionId: "version-pinned-7",
            content: {
              runtime: "mock-pinned-runtime"
            }
          };
        }
      }
    }
  );

  assert.deepEqual(calls, [
    {
      apiKey: "test-api-key",
      slug: "intentive-runtime-bundle",
      versionId: "version-pinned-7"
    }
  ]);
  assert.deepEqual(bundle, {
    slug: "intentive-runtime-bundle",
    resolvedVersionId: "version-pinned-7",
    content: {
      runtime: "mock-pinned-runtime"
    }
  });
});

test("fails explicitly when Braintrust fetch inputs or responses are invalid", async () => {
  await assert.rejects(
    fetchBraintrustRuntimeBundle(
      {
        slug: "intentive-runtime-bundle",
        latest: true,
        env: {}
      },
      {
        client: {}
      }
    ),
    /Braintrust API key is required/
  );

  await assert.rejects(
    fetchBraintrustRuntimeBundle(
      {
        slug: " ",
        latest: true,
        env: {
          BRAINTRUST_API_KEY: "test-api-key"
        }
      },
      {
        client: {}
      }
    ),
    /Braintrust bundle slug is required/
  );

  await assert.rejects(
    fetchBraintrustRuntimeBundle(
      {
        slug: "intentive-runtime-bundle",
        braintrustVersion: " ",
        env: {
          BRAINTRUST_API_KEY: "test-api-key"
        }
      },
      {
        client: {}
      }
    ),
    /Braintrust bundle version ID is required/
  );

  await assert.rejects(
    fetchBraintrustRuntimeBundle(
      {
        slug: "intentive-runtime-bundle",
        latest: true,
        env: {
          BRAINTRUST_API_KEY: "test-api-key"
        }
      },
      {
        client: {
          async fetchLatestBundle() {
            return {
              slug: "intentive-runtime-bundle",
              versionId: "version-latest-1"
            };
          }
        }
      }
    ),
    /Braintrust bundle content is required/
  );
});
