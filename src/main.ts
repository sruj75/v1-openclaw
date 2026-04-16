import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";

import { loadConfig, loadDiscordBotConfig } from "./config/index.js";
import { createInMemoryRelayStore } from "./db/index.js";
import { applyPhase1Schema } from "./db/seed.js";
import { openSqliteDatabase } from "./db/sqlite.js";
import { createDiscordBotAdapter, createSyntheticNormalizedEvent } from "./discord/index.js";
import { createUnconfiguredOpenClawGateway } from "./openclaw/index.js";
import { createIntentiveRelay } from "./relay/index.js";
import { processNormalizedDiscordEvent } from "./relay/discord.js";

declare const process: {
  argv: string[];
  env: Record<string, string | undefined>;
  exitCode?: number;
};

export async function runSyntheticEntrypoint() {
  const config = loadConfig(process.env);
  const relay = createIntentiveRelay({
    config,
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

export async function runDiscordBotEntrypoint() {
  const config = loadConfig(process.env);
  await mkdir(dirname(config.databasePath), { recursive: true });
  const database = openSqliteDatabase(config.databasePath);
  applyPhase1Schema(database);

  const discord = createDiscordBotAdapter(loadDiscordBotConfig(process.env));
  const openClaw = createUnconfiguredOpenClawGateway();

  await discord.connect({
    onMessage: async (event) => {
      await processNormalizedDiscordEvent(event, {
        database,
        openClaw,
        discord,
        discordSelfUserId: discord.getSelfUserId()
      });
    }
  });

  return {
    service: config.serviceName,
    databasePath: config.databasePath,
    discordGatewayConnected: true
  };
}

async function main() {
  const shouldRunSynthetic = process.argv.includes("--synthetic");
  const shouldRunDiscord = process.argv.includes("--discord");

  if (!shouldRunSynthetic) {
    if (!shouldRunDiscord) {
      console.log(
        "Intentive relay bootstrap is ready. Run with --synthetic for a test event or --discord for the bot adapter."
      );
      return;
    }

    console.log(JSON.stringify(await runDiscordBotEntrypoint(), null, 2));
    return;
  }

  console.log(JSON.stringify(await runSyntheticEntrypoint(), null, 2));
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
