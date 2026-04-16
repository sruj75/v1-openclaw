export type DiscordSenderRole = "user" | "expert" | "agent" | "system";

export type NormalizedDiscordEvent = {
  id: string;
  channelId: string;
  authorId: string;
  authorRole: DiscordSenderRole;
  content: string;
  occurredAt: string;
};

export function createSyntheticNormalizedEvent(
  overrides: Partial<NormalizedDiscordEvent> = {}
): NormalizedDiscordEvent {
  return {
    id: overrides.id ?? "synthetic-discord-message-1",
    channelId: overrides.channelId ?? "discord-channel-private-1",
    authorId: overrides.authorId ?? "discord-user-1",
    authorRole: overrides.authorRole ?? "user",
    content: overrides.content ?? "I am stuck starting the next task.",
    occurredAt: overrides.occurredAt ?? new Date(0).toISOString()
  };
}
