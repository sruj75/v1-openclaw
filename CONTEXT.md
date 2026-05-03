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
_Avoid_: blind scheduled message, generic check-in

**Proactive Judgment**:
The companion's decision about whether and how to intervene when a proactive trigger fires.
_Avoid_: cron-as-policy, automatic reminder copy

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

## Relationships

- A **V1 Prompt** is a **Shared Operating Contract** for the Phase 4 pilot.
- The **V1 Prompt** defines the agent as an **Execution Companion**.
- The **Execution Companion** is an **Execution Companion Primitive**, not inherently a between-session or human-in-the-loop product.
- **Proactive Intervention** is core to the **Execution Companion Primitive**, not part of the **Human-In-The-Loop Module**.
- The **Companion Watch** creates proactive opportunities, but **Situational Awareness** and **Proactive Judgment** decide the intervention.
- **Intentional Silence** is a valid proactive outcome when the companion judges that no message is the right move.
- Proactive triggers create **Opportunity Windows**, not fixed scheduled check-ins.
- **Dynamic Human Judgment** matters more than enumerating a hardcoded menu of proactive response types.
- The companion should maintain an **Evolving User Model** through existing OpenClaw workspace context, especially the **User Context File**.
- The **Global Product Prompt** defines Intentive behavior once, while user-specific context flows through the **User Context File**.
- The **Personalization Write Surface** is `USER.md`; runtime should not self-edit **Langfuse-Owned Prompt Surface** files for user preference or product behavior.
- The **Virtual Workspace Roadmap** may later replace real filesystem storage, but it should not distract from the current #46 prompt rollout.
- An **Execution Companion** acts as an **External Scaffold** for the user's **Executive Function State**.
- The companion uses the **What Failure Lens** to detect the executive-function failure and the **Why Failure Layer** to infer the root cause.
- The **Performance Bottleneck** is the connection between the **What Failure Lens** and the **Why Failure Layer**.
- The user should experience a **State Shift**, not a taxonomy lesson about executive function.
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

## Example Dialogue

> **Dev:** "Should #46 only roll out the heartbeat instructions?"
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
> **Domain expert:** "No — remember the **Virtual Workspace Roadmap**, but focus #46 on the **Global Product Prompt**."
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
- Proactive behavior should not become a hardcoded checklist; v1 uses **Opportunity Windows** and **Dynamic Human Judgment**.
- "between-session" overfits the pilot and human expert workflow — resolved: **Execution Companion Primitive** is the core product capability, and human-in-the-loop is the only active **Feature Module** for current V1 prompt work.
- Executive-function terms are internal product language, not user-facing response language.
