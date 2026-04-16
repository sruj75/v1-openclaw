import type { NormalizedDiscordEvent } from "../discord/index.js";

export type OpenClawGatewayReply = {
  status: "not_configured";
  message: string;
};

export type OpenClawGateway = {
  sendMessage(event: NormalizedDiscordEvent): Promise<OpenClawGatewayReply>;
};

export function createUnconfiguredOpenClawGateway(): OpenClawGateway {
  return {
    async sendMessage() {
      return {
        status: "not_configured",
        message: "OpenClaw gateway is not wired in this bootstrap slice."
      };
    }
  };
}
