import type { NormalizedDiscordEvent } from "../discord/index.js";

export type StoredMessage = {
  id: string;
  event: NormalizedDiscordEvent;
  createdAt: string;
};

export type RelayStore = {
  saveMessage(event: NormalizedDiscordEvent): Promise<StoredMessage>;
  listMessages(): Promise<StoredMessage[]>;
};

export function createInMemoryRelayStore(): RelayStore {
  const messages: StoredMessage[] = [];

  return {
    async saveMessage(event) {
      const storedMessage = {
        id: `msg_${messages.length + 1}`,
        event,
        createdAt: new Date().toISOString()
      };

      messages.push(storedMessage);
      return storedMessage;
    },

    async listMessages() {
      return [...messages];
    }
  };
}
