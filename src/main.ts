import { loadConfig } from "./config/index.js";
import { createInMemoryRelayStore } from "./db/index.js";
import { createSyntheticNormalizedEvent } from "./discord/index.js";
import { createUnconfiguredOpenClawGateway } from "./openclaw/index.js";
import { createIntentiveRelay } from "./relay/index.js";

declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  exitCode?: number;
};

export async function runSyntheticEntrypoint() {
  const relay = createIntentiveRelay({
    config: loadConfig(process.env),
    store: createInMemoryRelayStore(),
    openClaw: createUnconfiguredOpenClawGateway()
  });

  const result = await relay.submitNormalizedEvent(createSyntheticNormalizedEvent());

  return {
    service: relay.getConfig().serviceName,
    eventAccepted: result.accepted,
    storedMessageId: result.storedMessage.id,
    openClawStatus: result.openClaw.status
  };
}

async function main() {
  const shouldRunSynthetic = process.argv.includes("--synthetic");

  if (!shouldRunSynthetic) {
    console.log("Intentive relay bootstrap is ready. Run with --synthetic to submit a test event.");
    return;
  }

  console.log(JSON.stringify(await runSyntheticEntrypoint(), null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
