# Plans

Execution plans should be first-class repo artifacts when work is large enough that the agent should not rely on conversational memory alone.

## Core Rule

Use repo-local plans for work that spans multiple steps, multiple sessions, or multiple decisions.

Good candidates:

- architecture changes with tradeoffs
- migrations and cutovers
- multi-week delivery efforts
- work that requires progress tracking and decision logging
- any task where the next agent run should inherit more than a prompt summary

Do not create ceremony for tiny tasks.

## Plan Shape

A good execution plan should capture:

- target behavior or outcome
- scope boundaries
- ordered implementation steps
- key decisions and tradeoffs
- validation plan
- current status
- follow-up debt or cleanup if relevant

## Storage Pattern

The repo should eventually keep plans in a stable home, for example:

- `docs/plans/active/`
- `docs/plans/completed/`

Until that exists, keep major plan material in the nearest relevant leaf doc instead of letting it live only in chat.

## Promotion Rule

When a plan settles a durable architectural or product decision:

- move the durable decision to [decisions.md](decisions.md)
- move the durable operating rule to the nearest stable leaf
- leave the plan focused on execution history and progress

Plans should not become the only place where the system remembers how it works.
