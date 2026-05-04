# Use heartbeat-first proactivity with cron reserved for exact scheduled commitments

Intentive proactivity should be designed as a heartbeat-first hybrid: OpenClaw heartbeat creates regular context re-entry opportunities for the Execution Companion, while OpenClaw cron is reserved for exact one-shot commitments, scheduled rituals, and isolated background work. This keeps scheduling as infrastructure and keeps proactive judgment in the Langfuse-owned prompt, so the product behavior can focus on timely check-ins, intervention, derailment recovery, and trace-led prompt iteration instead of hardcoded reminder policy.

**Considered Options**

- Heartbeat-only: simplest, but weak for exact commitments.
- Cron-only: precise, but pushes the product toward rigid scheduled reminders.
- Heartbeat-first hybrid: preserves context-aware companion behavior while keeping exact scheduling available when the user or operator creates a real commitment.

**Consequences**

OpenClaw cron must be configured before exact proactive commitments can run. Heartbeat should not be treated as continuous minute-by-minute monitoring; the normal product cadence should assume roughly 30 minutes to 2 hours between context re-entry opportunities. The Langfuse bundle should continue to own proactive judgment language, while operator-owned OpenClaw config owns cadence, delivery, routing, secrets, and cron definitions.
