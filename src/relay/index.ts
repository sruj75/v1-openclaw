import type { RelayConfig } from "../config/index.js";
import type { RelayStore, StoredMessage } from "../db/index.js";
import type { NormalizedDiscordEvent } from "../discord/index.js";
import type { OpenClawGatewayReply } from "../openclaw/index.js";

export type RelayResult = {
  accepted: boolean;
  storedMessage: StoredMessage;
  openClaw: OpenClawGatewayReply;
};

export type IntentiveRelayDependencies = {
  config: RelayConfig;
  store: RelayStore;
  openClaw: {
    sendMessage(event: NormalizedDiscordEvent): Promise<OpenClawGatewayReply>;
  };
};

export function createIntentiveRelay(dependencies: IntentiveRelayDependencies) {
  return {
    async submitNormalizedEvent(event: NormalizedDiscordEvent): Promise<RelayResult> {
      const storedMessage = await dependencies.store.saveMessage(event);
      const openClaw = await dependencies.openClaw.sendMessage(event);

      return {
        accepted: true,
        storedMessage,
        openClaw
      };
    },

    getConfig() {
      return dependencies.config;
    }
  };
}
