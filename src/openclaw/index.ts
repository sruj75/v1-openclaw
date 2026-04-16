export type OpenClawGatewayReply = {
  status: "ok" | "not_configured";
  message?: string;
  reply?: {
    content: string;
    runtimeMessageId?: string;
  };
  traceId?: string;
  providerResponseId?: string;
};

export type OpenClawGatewayRequest = {
  agentId: string;
  sessionKey: string;
  message: string;
  metadata: {
    discordMessageId: string;
    discordChannelId: string;
    userId: string;
    expertId: string;
    assignmentId: string;
  };
};

export type OpenClawGatewayClient = {
  sendUserMessage(request: OpenClawGatewayRequest): Promise<OpenClawGatewayReply>;
};

export function createUnconfiguredOpenClawGateway(): OpenClawGatewayClient {
  return {
    async sendUserMessage() {
      return {
        status: "not_configured",
        message: "OpenClaw gateway is not wired in this bootstrap slice."
      };
    }
  };
}
