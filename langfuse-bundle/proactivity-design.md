# Proactivity Design Notes

These notes isolate the technical design discussion for Intentive proactivity
inside the Langfuse bundle workspace. They are not the final prompt. They are
the working map for deciding what belongs in the prompt, what belongs in
OpenClaw config, and what should stay operator-owned during the pilot.

## Current Frame

Intentive proactivity should feel like the progression from strangers to best
friends: early interventions are cautious and context-seeking; later
interventions become more precise because the companion has built relational
context, trust, and an evolving user model.

The repo glossary already names the important boundary:

- **Companion Watch** is the scheduler and heartbeat machinery.
- **Opportunity Window** is the moment created by a trigger.
- **Proactive Judgment** is the companion deciding whether and how to intervene.
- **Intentional Silence** is a valid outcome when messaging would be noise.

The technical design should preserve that boundary. Cron and heartbeat create
opportunities. They should not become product policy.

The design center is not "send fewer messages." The design center is whether
the companion can check in, intervene, keep the user on track, or help the user
recover when they derail. Silence matters only as restraint against generic or
mistimed output.

## External Source Insights

Anthropic's multi-agent research writeup is useful here even though Intentive is
not primarily a research system:

- Prompt iteration needs the exact prompts and tool surfaces under observation,
  then real failure modes become obvious.
- Agents need explicit boundaries, output expectations, and effort budgets or
  they overdo simple tasks and under-specify complex ones.
- Good prompts encode human heuristics rather than rigid scripts.
- Start with small representative eval cases because early prompt changes can
  have large visible effects.
- Long-running agents need memory, compression, checkpoints, and observability
  because small failures compound across turns.

OpenClaw's official docs shape the mechanism boundary:

- Heartbeat is a periodic main-session turn. It has full session context by
  default, can silently acknowledge with `HEARTBEAT_OK`, and does not create
  background task records.
- Heartbeat is not a minute-by-minute loop. Treat `30m` as the aggressive end
  of the normal product cadence, with `1h` or `2h` often being more realistic.
- Cron is the gateway scheduler for exact timing, one-shot wakeups, recurring
  jobs, isolated runs, delivery, and task records.
- `HEARTBEAT.md` should stay small because it may be included repeatedly.
- `agents.defaults.heartbeat.prompt` is configurable and sent verbatim.
- OpenClaw config is schema-validated, and automation fields such as `cron` and
  `agent.heartbeat` hot-apply without normal downtime.

Sources:

- https://www.anthropic.com/engineering/multi-agent-research-system
- https://docs.openclaw.ai/automation
- https://docs.openclaw.ai/gateway/heartbeat
- https://docs.openclaw.ai/automation/cron-jobs
- https://docs.openclaw.ai/gateway/configuration

## Proposed Technical Boundary

Use three layers:

1. **Operator-owned OpenClaw config**

   Holds cadence, active hours, channel delivery, routing, secrets, per-user
   bindings, and exact cron definitions. This is operational infrastructure,
   not product psychology.

2. **Langfuse-owned proactive prompt**

   Holds the companion's proactive judgment policy: when to stay silent, when to
   reach in, how to read the moment, how to avoid generic reminders, and how to
   evolve from cautious early support to precise later support.

3. **User workspace context**

   Holds durable personalization in `USER.md`: what activates the user, what
   shuts them down, which interventions have worked, what current goals matter,
   and what the human loop partner has handed off.

## Decision Tree

### 1. What Should Trigger Opportunity Windows?

Options:

- Heartbeat-only: approximate periodic openings with main-session context,
  usually every 30 minutes to 2 hours rather than continuously.
- Cron-only: exact scheduled jobs with explicit task records.
- Hybrid: heartbeat for regular relational awareness, cron for exact events or
  one-shot wakeups.

Recommended answer: hybrid, but with heartbeat as the default product feeling.
Cron should be reserved for exact commitments such as "wake me before this" or
"run the weekly review at this time." In plain technical terms:

- heartbeat gives the agent repeated chances to re-enter the current session
  context and decide whether to speak;
- cron runs something at an exact time or on an exact recurring schedule;
- the prompt decides whether the agent's output should be silence, a short
  message, a direct push, or a deeper intervention.

The "best friend" analogy should not mean magic ambient awareness or constant
presence. It means that when the system gets a scheduled opportunity, the agent
has enough repeated context in `USER.md`, session history, and handoffs to judge
whether the user needs a check-in, an intervention, a recovery move, or no
message.

### 2. What Does Langfuse Own?

Options:

- Only the words in `HEARTBEAT.md`.
- The full proactive judgment policy inside the runtime bundle.
- Config and prompt together, including cadence and routing.

Recommended answer: Langfuse owns the full proactive judgment policy, but not
cadence/routing/secrets. The bundle may patch only the heartbeat prompt for now,
while operator config controls when and where that prompt gets invoked.

### 3. How Does The Companion Mature From Stranger To Best Friend?

Options:

- Time-based stages.
- User-model-based stages.
- Founder/expert-controlled stages.

Recommended answer: user-model-based stages. The companion should become more
precise only when `USER.md` contains enough evidence about the user's patterns,
pressure tolerance, goals, and prior successful interventions. Time alone should
not grant intimacy.

### 4. What Is The Default Silence Policy?

Options:

- Always send something on proactive triggers.
- Send only when the companion has a specific state-shifting reason.
- Ask the user to configure frequency preferences up front.

Recommended answer: send only when there is a specific state-shifting reason.
Silence is product quality when the alternative is generic notification noise.

This is not the primary success metric for proactivity. The primary success
metric is whether interventions keep the user on track or recover them when
they derail. Silence is just one guardrail that prevents the companion from
becoming a generic reminder bot.

## First Design Question

Should the default pilot posture be **heartbeat-first hybrid**: regular
OpenClaw heartbeats create ordinary opportunity windows, while cron is reserved
for exact one-shot commitments and weekly rituals?

My recommendation is yes. It gives us the best-friend analogy technically:
heartbeat provides recurring context re-entry, and cron provides exact scheduled
execution only when the user, operator, or product loop has created a real
commitment.
