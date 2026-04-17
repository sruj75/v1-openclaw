import type { RelayConfig } from "../config/index.js";
import type { RelayStore, StoredMessage } from "../db/index.js";
import type { NormalizedDiscordEvent } from "../discord/index.js";
import type { OpenClawGatewayReply, OpenClawRequestMetadata } from "../openclaw/index.js";

export type RelayRuntimeReply = OpenClawGatewayReply;

export type RelayResult = {
  accepted: boolean;
  storedMessage: StoredMessage;
  openClaw: RelayRuntimeReply;
};

export type IntentiveRelayDependencies = {
  config: RelayConfig;
  store: RelayStore;
  openClaw: {
    sendUserMessage(input: {
      agentId: string;
      sessionKey: string;
      message: string;
      metadata: OpenClawRequestMetadata;
    }): Promise<RelayRuntimeReply>;
  };
};

export function createIntentiveRelay(dependencies: IntentiveRelayDependencies) {
  return {
    async submitNormalizedEvent(event: NormalizedDiscordEvent): Promise<RelayResult> {
      const storedMessage = await dependencies.store.saveMessage(event);
      const openClaw = await dependencies.openClaw.sendUserMessage({
        agentId: "synthetic-agent",
        sessionKey: "synthetic-session",
        message: event.content,
        metadata: {
          discordMessageId: event.id,
          discordChannelId: event.channelId,
          userId: event.authorId,
          expertId: "synthetic-expert",
          assignmentId: "synthetic-assignment"
        }
      });

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
