import type { ChannelRoutingAssignment } from "../db/routing.js";
import type { NormalizedDiscordEvent } from "../discord/index.js";

export type ClassifiedMessageRole = "user" | "expert" | "system" | "unknown";
export type ClassifiedMessageType =
  | "user_message"
  | "expert_reply"
  | "expert_annotation"
  | "system_event"
  | "unknown_sender";

export type ClassifiedDiscordMessage = {
  event: NormalizedDiscordEvent;
  role: ClassifiedMessageRole;
  messageType: ClassifiedMessageType;
  routing: ChannelRoutingAssignment | null;
  shouldForwardToOpenClaw: boolean;
};

const EXPERT_ANNOTATION_TAGS = new Set([
  "#override",
  "#better_response",
  "#wrong_timing",
  "#good_intervention"
]);

export function classifyDiscordMessage(
  event: NormalizedDiscordEvent,
  routing: ChannelRoutingAssignment | null
): ClassifiedDiscordMessage {
  if (event.isBot || event.isSystem) {
    return classified(event, routing, "system", "system_event", false);
  }

  if (!routing) {
    return classified(event, null, "unknown", "unknown_sender", false);
  }

  if (event.authorId === routing.user.discordUserId) {
    return classified(event, routing, "user", "user_message", false);
  }

  if (event.authorId === routing.expert.discordUserId) {
    const messageType = hasExpertAnnotationTag(event.content)
      ? "expert_annotation"
      : "expert_reply";

    return classified(event, routing, "expert", messageType, false);
  }

  return classified(event, routing, "unknown", "unknown_sender", false);
}

export function hasExpertAnnotationTag(content: string): boolean {
  const firstToken = content.trim().split(/\s+/, 1)[0]?.toLowerCase();
  return EXPERT_ANNOTATION_TAGS.has(firstToken);
}

function classified(
  event: NormalizedDiscordEvent,
  routing: ChannelRoutingAssignment | null,
  role: ClassifiedMessageRole,
  messageType: ClassifiedMessageType,
  shouldForwardToOpenClaw: boolean
): ClassifiedDiscordMessage {
  return {
    event,
    role,
    messageType,
    routing,
    shouldForwardToOpenClaw
  };
}
