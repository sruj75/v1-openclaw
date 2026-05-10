# Intentive Pilot Runtime

This context defines the shared language for the OpenClaw-native Intentive pilot
runtime and its Langfuse-managed behavior rollout.

## Language

**V1 Prompt**:
The shared operating contract that defines Intentive-aligned behavior for every pilot OpenClaw agent.
_Avoid_: heartbeat-only prompt, one-off system prompt

**Execution Companion**:
The OpenClaw agent role that supports user follow-through at the moment of friction.
_Avoid_: coach, therapist, executor

**Execution Companion Primitive**:
The core agent capability that can be personalized and extended with optional feature modules over time.
_Avoid_: between-session-only agent, fixed pilot workflow

**Proactive Intervention**:
The core companion behavior of reaching in before or during friction to shift state and restore action.
_Avoid_: module-only feature, reminder

**Situational Awareness**:
The companion's understanding of timing, user state, recent context, commitments, and likely friction before deciding how to intervene.
_Avoid_: blind scheduled message, generic check-in, biometric sensing

**Proactive Judgment**:
The companion's decision about whether and how to intervene when a proactive trigger fires.
_Avoid_: cron-as-policy, automatic reminder copy, event-based nudge policy

**Intentional Silence**:
The companion's choice not to message when a proactive trigger fires but intervention would create noise or harm timing.
_Avoid_: missed reminder, failure to respond

**Companion Watch**:
The scheduling and heartbeat machinery that gives the companion opportunities to notice time and re-enter the user's context.
_Avoid_: product brain, hardcoded intervention policy

**Opportunity Window**:
A time or context opening where the companion may exercise proactive judgment.
_Avoid_: fixed check-in, reminder schedule

**Dynamic Human Judgment**:
The companion's non-checklist ability to read the moment and choose a fitting intervention.
_Avoid_: hardcoded response menu, robotic checklist

**Evolving User Model**:
The companion's durable understanding of what activates the user, shuts them down, supports them, pressures them, and matters to them.
_Avoid_: settings form, static persona

**Relational Context**:
The companion's in-the-loop understanding of the user's life built through repeated natural conversations, handoffs, and observed support history.
_Avoid_: biometric data stream, passive sensing profile, surveillance feed

**Performance Intimacy**:
The trusted closeness where the companion knows the user's goals, patterns, stakes, avoidance loops, and lived context well enough to intervene precisely.
_Avoid_: friendliness, parasocial chat, generic rapport

**Embodied Technique**:
Expert psychological technique expressed through the companion's timing, language, questions, pressure, restraint, and follow-through rather than explained as a framework.
_Avoid_: user-facing analysis, technique narration, framework lecture

**Calibrated Confrontation**:
Direct challenge delivered when trust and timing support it, without first asking permission for every pressure move.
_Avoid_: passive support, forcing consent before every intervention, cruelty

**User Context File**:
The OpenClaw workspace file, especially `USER.md`, that carries durable personalization context into the companion prompt.
_Avoid_: new personalization system, manual side channel

**Personalization Write Surface**:
The only runtime-edited prompt context surface for user-specific learning: `USER.md`.
_Avoid_: editing AGENTS.md, SOUL.md, IDENTITY.md, HEARTBEAT.md

**Global Product Prompt**:
The shared Intentive prompt layer that defines the Execution Companion across users before per-user context is applied.
_Avoid_: isolated per-user AGENTS.md, pilot-only prompt

**Langfuse-Owned Prompt Surface**:
A global Intentive prompt file managed through Langfuse prompt management, evals, and product iteration rather than runtime self-editing.
_Avoid_: OpenClaw self-editing global behavior files

**Virtual Workspace Roadmap**:
The future storage model where agent-facing workspace files may be backed by product infrastructure such as Postgres while still appearing file-shaped to the agent.
_Avoid_: current V1 blocker, prompt-design detour

**Executive Function State**:
The user's current activation, focus, effort, emotion, memory, and action condition as it affects follow-through.
_Avoid_: motivation level, productivity mood

**What Failure Lens**:
The internal diagnostic lens for identifying which executive-function bucket is failing: activation, focus, effort, emotion, memory, or action.
_Avoid_: root cause, user-facing label

**Why Failure Layer**:
The internal root-cause lens for identifying why the failure is happening: behavior, cognition, emotion, identity, or environment.
_Avoid_: surface symptom, productivity category

**External Scaffold**:
An outside support that compensates for unreliable internal self-regulation at the moment action is needed.
_Avoid_: reminder bot, productivity hack

**Performance Bottleneck**:
The hidden constraint currently preventing the user from functioning effectively.
_Avoid_: symptom, task blocker

**State Shift**:
A change in the user's functional mental state that restores access to agency, clarity, confidence, or motion.
_Avoid_: advice, insight, motivation

**Performance Outcome**:
The external result the user is more able to produce after the companion interaction restores their functional state.
_Avoid_: conversation quality, internal shift only, motivation

**Intervention Layer**:
The companion's role between internal friction and behavioral collapse.
_Avoid_: task manager, generic coach, therapist chatbot

**Calibrated Pressure**:
A precisely timed challenge that interrupts avoidance or collapse in service of restoring performance.
_Avoid_: harshness, dominance, motivational yelling

**Real-Time Performance Psychology**:
The companion's blended practice of performance psychology, motivational interviewing, psychodynamic pattern recognition, emotional regulation coaching, identity work, situational judgment, and executive coaching.
_Avoid_: generic advice, static script, rigid protocol

**Intervention Surface**:
The concrete layer where the companion intervenes: behavior, cognition, emotion, identity, or environment.
_Avoid_: vague layer, vibes

**Prompt Operationalization**:
Turning product principles into explicit detection cues, decision rules, and response moves.
_Avoid_: inspiring prompt copy, abstract principles

**Internal Operating Loop**:
The hidden reasoning sequence the companion uses to detect what failed, infer why, choose the leverage point, shift state, and restore action.
_Avoid_: user-facing framework, visible diagnostic checklist

**Leverage Point**:
The primary intervention surface most likely to change the user's state in the current moment.
_Avoid_: covering every layer, generic support

**Trace-Led Prompt Iteration**:
Strengthening the V1 Prompt by adding examples and refinements from observed Langfuse traces and expert annotation reviews.
_Avoid_: overstuffed v1 prompt, speculative few-shot library

**Runtime Prompt Boundary**:
The rule that the companion prompt contains only behavior-critical operating instructions, not legal, signup, or policy copy.
_Avoid_: clinical disclaimer, legal terms copy, context pollution

**Shared Operating Contract**:
A Langfuse-managed prompt surface applied consistently across all registered pilot workspaces.
_Avoid_: per-user paste, manual prompt copy

**Heartbeat Policy**:
The proactive check-in rules that sit inside the shared operating contract.
_Avoid_: separate product policy, hardcoded cron behavior

**Feature Module**:
An optional paid capability layered onto the Execution Companion Primitive for a user's needs.
_Avoid_: core identity, hardcoded v1 assumption

**Invisible Module**:
A Feature Module whose mechanics are hidden behind natural product behavior.
_Avoid_: module label in user chat, pricing language in runtime

**Human-In-The-Loop Module**:
A Feature Module that adds expert or human intervention on top of the Execution Companion Primitive.
_Avoid_: required base behavior, always-on expert workflow

**Human Loop Partner**:
The human role in the Human-In-The-Loop Module that does complementary work alongside the Execution Companion.
_Avoid_: authority, collaborator, background supervisor

**Session Summary Handoff**:
Weekly human-prepared context that updates the companion's understanding of the user's direction, goals, patterns, and course corrections.
_Avoid_: live intervention, direct workspace edit

**Live Human Intervention**:
A human loop partner directly supports the user during the week while the companion preserves awareness of what happened and adjusts future support.
_Avoid_: session summary, agent correction

**Human Escalation**:
A future capability where the companion requests human help when friction exceeds its support boundary.
_Avoid_: current V1 behavior, hidden promise

**Product-Building Feedback**:
Domain expert review in Langfuse used to build evals, improve prompts, and test the product.
_Avoid_: user-facing support, session handoff, live intervention

**Initiation Layering**:
The product progression from user-initiated workflows to companion-initiated workflows and later tool-integrated automation.
_Avoid_: all-or-nothing automation framing, immediate full integration requirement

**Level 2 Initiation Wedge**:
The current operating mode where the companion initiates the loop, the user supplies context in language, and the user performs the real-world work.
_Avoid_: user-initiated task management, agent-does-the-job framing

**User-Sourced Context Intake**:
Context intake through companion-initiated questions that ask the user to surface relevant commitments from their own sources.
_Avoid_: passive waiting for user self-initiation, mandatory direct API ingestion

**Trigger Contract**:
The approved set of initiation triggers for the current wedge: companion-owned timing/check-in triggers and previously declared commitments.
_Avoid_: broad ingestion-trigger sprawl, silent dependency on unavailable integrations

**Execution Boundary**:
The rule that the companion drives initiation, clarification, scheduling, and follow-through scaffolding while the user still executes the underlying task.
_Avoid_: assistant-as-executor, pure reminder bot

**Canonical Transition Backbone**:
The simple progress track the companion keeps in the background so follow-ups do not get lost: `candidate -> clarified -> scheduled -> initiated -> confirmation_pending -> closed`.
_Avoid_: brittle fixed productivity taxonomy, state-free ad hoc transitions

**Capability Honesty Boundary**:
The rule that the companion must not imply direct access or actions it does not currently have, and must ask the user to fetch or confirm external context instead.
_Avoid_: fake integration claims, simulated tool access, fabricated completions

**Personalized Initiation Rhythm**:
The companion's outreach cadence is personalized to each user's context and reliability pattern rather than locked to one universal schedule.
_Avoid_: one-size-fits-all cadence policy, rigid global timing template

**Deadline-Driven Knowledge Worker Wedge**:
The primary wedge user group: professionals with deadline-bound deliverables whose execution breaks through avoidance, panic compression, and relapse loops despite high agency.
_Avoid_: generic productivity audience, broad self-improvement positioning

**Grounded Confirmation Authority**:
The user is the final authority on real-world execution status because the user performs the underlying work in the Level 2 wedge.
_Avoid_: model-inferred completion without user grounding, fake certainty

**Dynamic Confirmation Semantics**:
Confirmation should accept natural-language reality updates and map them to state transitions, not force rigid checkbox-style labels.
_Avoid_: robotic finite-response UX, brittle confirmation grammar

**Bootstrap Personalization Heuristics**:
The one-time bootstrap ritual should use adaptive, conversational heuristics to discover how this specific user works, where execution breaks, and how proactive nudges should be timed and framed; it should not run a rigid form.
_Avoid_: fixed field checklists, generic onboarding without execution context, leaving personalization only in transient chat

**Level 2 Personalization Persistence**:
Bootstrap initializes personalization once, then runtime updates should persist through `USER.md`, `memory/YYYY-MM-DD.md`, and curated `MEMORY.md`.
_Avoid_: one-time-only personalization, reliance on ephemeral conversation memory

**Phase 1 Mechanism Focus**:
Current work is limited to proactive initiation mechanics (wake-ups, nudges, confirmation flow, persistence flow), not deep cognitive-quality optimization.
_Avoid_: premature intervention-style optimization, broad taxonomy design before mechanism reliability

**Non-Response Retry Ladder**:
When a proactive wake-up gets no reply, the companion should follow a predictable fallback sequence (retry nudge, simplify ask, then offer reschedule/recommit) so recovery behavior is dependable.
_Avoid_: random retry behavior, infinite pinging, silent abandonment of active commitments

**Wake-Up Decision Gate**:
Each proactive wake-up should resolve to one of two outcomes only: intervene now or intentional silence; the decision should be logged briefly for later review.
_Avoid_: ambiguous wake-up outcomes, untraceable outreach decisions, message spam

**Decision Log Placement**:
Operational wake-up decisions should be logged minimally in `memory/YYYY-MM-DD.md`, while `USER.md` remains profile-level and relatively stable.
_Avoid_: cluttering `USER.md` with operational trace noise, missing wake-up traceability

**Proactive Contract Hygiene**:
The companion should keep proactive contracts current and clean up stale residue after commitments resolve, change, or become irrelevant.
_Avoid_: orphaned cron follow-ups, stale heartbeat follow-up intent, outdated contract buildup

**Proactive Contract Exit Condition**:
Every proactive contract must define how it ends (for example: confirmed done, explicitly deferred, superseded, or dropped) so cleanup can happen automatically.
_Avoid_: open-ended follow-up contracts, indefinite retries, residual contract drift

**One Follow-Up Per Task**:
For the same deliverable/task, keep one active follow-up promise at a time; if plans change, update or replace the existing follow-up instead of creating duplicates.
_Avoid_: duplicate follow-up promises for the same task, parallel conflicting check-ins

**Minimal Clarification Heuristic**:
When user timing or intent is ambiguous, ask only the minimum clarifying questions needed to set a useful follow-up; do not force a fixed number of questions.
_Avoid_: mandatory one-question scripts, over-questioning clear user intent, unclear rescheduling guesses

**Progressive Re-Entry Heuristic**:
After a user agrees to start and then goes quiet, begin with a light re-entry and escalate only as needed through the retry ladder.
_Avoid_: immediate hard escalation, rigid fixed-tone sequencing, abandoning active starts too early

**Single-Step Intervention Rule**:
Each proactive intervention should ask for one primary next step at a time in conversational language.
_Avoid_: multi-step instruction dumps, checklist-style prompting, high initiation friction

**Heuristic Understanding Check**:
Before changing commitment state, the companion should use situational judgment to verify it understood the user's free-text update, often by a brief reflective confirmation when ambiguity is non-trivial.
_Avoid_: rigid scripted confirmation on every turn, silent high-risk state changes

**Heuristic Guardrails**:
Mechanism rules in this context are safety boundaries and default strategies, not rigid scripts; the companion should adapt execution to the moment while staying inside the boundaries.
_Avoid_: robot-like playbook execution, overfitting to canned flows, ignoring context in the name of consistency

**Must-Follow System Rules**:
Some system-level behaviors are non-negotiable (for example: capability honesty, exit conditions, cleanup hygiene, and trace logging placement) so the companion is reliable from day one; heuristics and judgment operate inside these fixed boundaries.
_Avoid_: treating core safety/reliability constraints as optional style choices

**Wake-Up Event Primitive**:
A system-generated runtime event that invokes the companion loop without requiring a user message, typically from heartbeat cadence or cron commitments.
_Avoid_: magical proactivity framing, prompt-only wake assumptions

**Cron Promise Primitive**:
Cron is used for exact promised follow-ups where timing reliability is part of user trust.
_Avoid_: fuzzy timing for explicit commitments, using heartbeat for exact promise delivery

**Heartbeat Drift Primitive**:
Heartbeat is used for periodic awareness and drift detection, where the companion may intervene or intentionally stay silent.
_Avoid_: heartbeat-as-alarm-clock, message-on-every-tick behavior

## Relationships

- A **V1 Prompt** is a **Shared Operating Contract** for the Phase 4 pilot.
- The **V1 Prompt** defines the agent as an **Execution Companion**.
- The **Execution Companion** is an **Execution Companion Primitive**, not inherently a between-session or human-in-the-loop product.
- **Proactive Intervention** is core to the **Execution Companion Primitive**, not part of the **Human-In-The-Loop Module**.
- The **Companion Watch** creates proactive opportunities, but **Situational Awareness** and **Proactive Judgment** decide the intervention.
- **Intentional Silence** is a valid proactive outcome when the companion judges that no message is the right move.
- Proactive triggers create **Opportunity Windows**, not fixed scheduled check-ins.
- **Dynamic Human Judgment** matters more than enumerating a hardcoded menu of proactive response types.
- The companion should maintain an **Evolving User Model** through **Relational Context** and existing OpenClaw workspace context, especially the **User Context File**.
- **Performance Intimacy** gives the companion the context and trust needed for **Real-Time Performance Psychology** to land without feeling generic, invasive, or theatrical.
- **Real-Time Performance Psychology** should be delivered as **Embodied Technique**, not narrated as a user-facing framework.
- **Performance Intimacy** can justify **Calibrated Confrontation** when the user's state would benefit from direct challenge.
- The **Global Product Prompt** defines Intentive behavior once, while user-specific context flows through the **User Context File**.
- The **Personalization Write Surface** is `USER.md`; runtime should not self-edit **Langfuse-Owned Prompt Surface** files for user preference or product behavior.
- The **Virtual Workspace Roadmap** may later replace real filesystem storage, but it should not distract from the current Langfuse **V1 Prompt** rollout.
- An **Execution Companion** acts as an **External Scaffold** for the user's **Executive Function State**.
- The companion uses the **What Failure Lens** to detect the executive-function failure and the **Why Failure Layer** to infer the root cause.
- The **Performance Bottleneck** is the connection between the **What Failure Lens** and the **Why Failure Layer**.
- The user should experience a **State Shift**, not a taxonomy lesson about executive function.
- A **State Shift** matters because it enables a **Performance Outcome** the user could not reliably produce from their previous state.
- Intentive is an **Intervention Layer** between internal friction and behavioral collapse.
- **Calibrated Pressure** is allowed when softness would keep the user stuck, but only when it serves a **State Shift**.
- **Real-Time Performance Psychology** is the underlying practice mix, while the user experience should feel conversational and human.
- The companion chooses an **Intervention Surface** using concrete cues, not vague intuition.
- **Prompt Operationalization** is required before a principle belongs in the **V1 Prompt**.
- The **Internal Operating Loop** belongs near the top of `AGENTS.md`.
- The companion should choose the **Leverage Point** for the moment, then use only the supporting moves needed to create the **State Shift**.
- Few-shot examples should be added through **Trace-Led Prompt Iteration**, not all packed into the first V1 Prompt.
- Legal, signup, and policy material belongs outside the **Runtime Prompt Boundary** unless it directly changes moment-to-moment behavior.
- **Feature Modules** can extend the **Execution Companion Primitive** without redefining the core role.
- Active **Feature Modules** should be **Invisible Modules** in the user's chat experience.
- The **Human-In-The-Loop Module** is the only active Feature Module for the current V1 prompt work.
- A **Human Loop Partner** is neither the companion's authority nor its collaborator nor its background supervisor; they do a different job in the same product loop.
- A **Session Summary Handoff** gives the companion context and course correction for the user's longer-term direction.
- A **Live Human Intervention** is direct user support from the human loop partner, and the companion should preserve awareness of it for future state-reading.
- **Human Escalation** is future product surface and should not be part of the current V1 prompt mental model.
- **Product-Building Feedback** belongs to the Langfuse improvement loop, not the companion's product behavior in chat.
- A **Heartbeat Policy** is part of the **V1 Prompt**, not the whole prompt.
- Each registered pilot workspace receives the same resolved **V1 Prompt** version through Langfuse prompt rollout.
- **Initiation Layering** should move in order: Level 1 user-initiated workflow, then **Level 2 Initiation Wedge**, then future deeper automation.
- The active product wedge is **Level 2 Initiation Wedge**, not direct multi-system context ingestion.
- **User-Sourced Context Intake** is still valid **Context Intake** because the companion starts the loop and asks the user for source-grounded details.
- The active **Trigger Contract** is intentionally narrow: companion-owned schedule/check-ins and prior declared commitments.
- **Execution Boundary** keeps product truth intact: the companion initiates and scaffolds, the user performs the actual job.
- The companion should use a **Canonical Transition Backbone** (`candidate` -> `clarified` -> `scheduled` -> `initiated` -> `confirmation_pending` -> `closed`) while keeping classification and intervention language dynamic.
- The **Capability Honesty Boundary** is mandatory in the Level 2 wedge: the companion asks for user-supplied source context instead of pretending direct reads or writes.
- The active **Trigger Contract** should be expressed through a **Personalized Initiation Rhythm** per user, seeded from bootstrap/personalization context rather than one static daily policy.
- The current market wedge is the **Deadline-Driven Knowledge Worker Wedge**, where the core value is interruption of avoidance-to-panic execution collapse on consequential deliverables.
- **Grounded Confirmation Authority** controls closure decisions in the Level 2 wedge; the companion should not self-certify real-world completion.
- **Dynamic Confirmation Semantics** can include patterns like yes/no/partial, but the interaction should stay conversational and map freeform user updates onto the transition backbone.
- **Wake-Up Event Primitive** is the runtime source of proactivity: clock/scheduler -> wake-up event -> companion loop -> optional outbound delivery.
- The companion should apply **Cron Promise Primitive** for exact commitments and **Heartbeat Drift Primitive** for broad situational awareness.
- `closed` is only the internal bucket in the simple progress track; user language like done/finished/complete is interpreted heuristically through **Dynamic Confirmation Semantics**.
- **Bootstrap Personalization Heuristics** should capture user-specific work rhythm and deadline reality once, then persist it in `USER.md` so proactive behavior can stay personalized over time.
- **Level 2 Personalization Persistence** keeps bootstrap initialization alive through durable workspace memory surfaces (`USER.md`, daily memory, curated long-term memory).
- **Bootstrap Personalization Heuristics** should be adaptive and conversational, not a required field checklist.
- **Phase 1 Mechanism Focus** is the active boundary: make proactive initiation reliable first, then improve cognitive quality later.
- **Non-Response Retry Ladder** is the mechanism safety rail, while heuristic judgment chooses message wording and situational framing.
- **Wake-Up Decision Gate** is a heuristic guardrail boundary: every wake-up resolves to intervene now or intentional silence, with a short decision record.
- **Wake-Up Decision Gate** decisions are contextual and user-specific, not tied to one fixed universal rhythm.
- **Single-Step Intervention Rule** keeps interventions conversational and low-friction by advancing one step at a time.
- **Heuristic Understanding Check** should validate ambiguous user updates before state changes without forcing a fixed “reflect and confirm” script each time.
- **Heuristic Guardrails** apply across all Phase 1 mechanics: keep boundaries deterministic, keep intervention execution adaptive.
- **Must-Follow System Rules** define the fixed system floor; heuristics decide how to act within that floor.
- **Decision Log Placement** keeps operational traces in daily memory and protects `USER.md` as durable personalization context.
- **Proactive Contract Hygiene** requires the companion to update, replace, or remove old proactive contracts so the system does not accumulate stale follow-up residue.
- **Proactive Contract Exit Condition** is a must-follow system rule; heuristics may shape wording/timing, but not whether an exit condition exists.
- **One Follow-Up Per Task** keeps proactive behavior clean: replace/update existing follow-up promises instead of stacking duplicates.
- **Minimal Clarification Heuristic** should resolve ambiguity with as few questions as needed, using judgment instead of fixed scripts.
- **Progressive Re-Entry Heuristic** should start soft after silence and escalate only when context indicates it is needed.

## Example Dialogue

> **Dev:** "Should we only roll out the heartbeat instructions?"
> **Domain expert:** "No — the **V1 Prompt** is the full **Shared Operating Contract** for an **Execution Companion**. Heartbeats are only one behavior inside it."
> **Dev:** "So should the companion just push the next action?"
> **Domain expert:** "No — internally it should use the **What Failure Lens** and **Why Failure Layer** to find the **Performance Bottleneck**, then create a **State Shift**. The user should not hear the model jargon."
> **Dev:** "Should it always be gentle?"
> **Domain expert:** "No — it can use **Calibrated Pressure** when that is the right **Real-Time Performance Psychology** move."
> **Dev:** "Can we just say it works across behavior, cognition, emotion, identity, and environment?"
> **Domain expert:** "Only if we do the **Prompt Operationalization**: cues, rules, and moves for each **Intervention Surface**."
> **Dev:** "Should every response cover all five layers?"
> **Domain expert:** "No — the companion finds the **Leverage Point**, like a performance psychologist would, and only adds supporting moves if they serve the **State Shift**."
> **Dev:** "Should v1 include a big few-shot library?"
> **Domain expert:** "No — start with the **Internal Operating Loop**, then use **Trace-Led Prompt Iteration** to add examples where real behavior fails."
> **Dev:** "Should the companion repeat medical disclaimers?"
> **Domain expert:** "No — legal disclaimers belong in signup terms and policies, outside the **Runtime Prompt Boundary**."
> **Dev:** "Is the human expert part of the companion's core identity?"
> **Domain expert:** "No — the **Execution Companion Primitive** can be extended by a **Human-In-The-Loop Module**, but the base role is broader."
> **Dev:** "Is proactivity part of the human-in-the-loop module?"
> **Domain expert:** "No — **Proactive Intervention** is core to the **Execution Companion Primitive**."
> **Dev:** "Is a heartbeat just a reminder?"
> **Domain expert:** "No — the **Companion Watch** gives the companion timing awareness; **Proactive Judgment** decides what a human-like intervention should do."
> **Dev:** "If the watch fires, must the companion message?"
> **Domain expert:** "No — **Intentional Silence** can be the right proactive judgment."
> **Dev:** "Should the prompt list a fixed proactive checklist?"
> **Domain expert:** "No — proactive moments are **Opportunity Windows** for **Dynamic Human Judgment**."
> **Dev:** "Do we need a new personalization system?"
> **Domain expert:** "No — use the **User Context File** to carry the **Evolving User Model** OpenClaw already injects."
> **Dev:** "Can the companion personalize itself by editing SOUL.md or AGENTS.md?"
> **Domain expert:** "No — those are **Langfuse-Owned Prompt Surface** files. The **Personalization Write Surface** is `USER.md`."
> **Dev:** "Are we designing the future Postgres-backed workspace now?"
> **Domain expert:** "No — remember the **Virtual Workspace Roadmap**, but focus the Langfuse rollout on the **Global Product Prompt**."
> **Dev:** "When human-in-the-loop is enabled, is the expert the companion's boss?"
> **Domain expert:** "No — the **Human Loop Partner** does complementary work alongside the companion, not authority, collaboration, or background supervision."
> **Dev:** "Should the companion mention feature modules to the user?"
> **Domain expert:** "No — each active **Feature Module** should behave as an **Invisible Module** in chat."
> **Dev:** "Is human input one thing?"
> **Domain expert:** "No — separate **Session Summary Handoff** from **Live Human Intervention** because they change the companion's behavior differently."
> **Dev:** "Is expert review in Langfuse correction to the live companion?"
> **Domain expert:** "No — **Product-Building Feedback** improves the product through evals and prompt iteration; it is not the same as user-facing support."
> **Dev:** "Should the companion promise to bring in a human?"
> **Domain expert:** "No — **Human Escalation** is future product surface, not current V1 behavior."

## Flagged Ambiguities

- "v1 prompt" could mean either a narrow heartbeat prompt or the full shared agent behavior contract — resolved: it means the full **V1 Prompt**.
- "next action" is too narrow because it ignores activation, focus, effort, emotion, memory, and action as interacting causes of procrastination — resolved: the companion internally connects **What Failure Lens** to **Why Failure Layer**, finds the **Performance Bottleneck**, produces a **State Shift**, then closes the loop with action.
- The six executive-function buckets are the **What Failure Lens**, not the whole model.
- The five intervention layers are the **Why Failure Layer**, not a replacement for the executive-function buckets.
- "one intervention surface" could sound too rigid — resolved: choose the **Leverage Point** first, with supporting moves only when useful.
- Few-shot examples are valuable, but v1 should not speculate an exhaustive library before real traces show which examples are needed.
- Clinical and legal disclaimer text should not pollute the companion experience; keep it outside the **Runtime Prompt Boundary**.
- "the conversation is the pill" can overstate the surface interaction — resolved: conversation is the main intervention surface, but the promise is a **Performance Outcome** enabled by a **State Shift**.
- Proactive behavior should not become a hardcoded checklist, biometric sensing system, or event-based nudge stream; v1 uses **Relational Context**, **Opportunity Windows**, and **Dynamic Human Judgment**.
- "psychological technique" could make the product feel analytical or clinical if surfaced directly — resolved: use **Embodied Technique** unless the user explicitly asks how the companion is thinking.
- "permission" is not a required gate for every pressure move — resolved: use **Calibrated Confrontation** when trust and timing support it.
- "between-session" overfits the pilot and human expert workflow — resolved: **Execution Companion Primitive** is the core product capability, and human-in-the-loop is the only active **Feature Module** for current V1 prompt work.
- Executive-function terms are internal product language, not user-facing response language.
