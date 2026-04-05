# References

External articles, official docs, and reference implementations are useful design inputs, but they are not the system of record until the durable lesson is made repo-local.

## Core Rule

When an external source repeatedly influences implementation decisions, pull the stable pattern into the repo.

Examples:

- tool or framework usage patterns
- architecture boundaries
- verification and observability expectations
- migration or deployment constraints
- agent-legibility heuristics that affect repo structure

## What To Keep Repo-Local

Promote the durable lesson, not the whole article:

- the rule
- when it applies
- how it changes this repo
- where the rule is enforced or verified

Do not turn the docs tree into a bookmark dump.

## Good Promotion Pattern

1. read the external source
2. extract the durable principle
3. map it onto the current repo and architecture
4. place it in the correct leaf doc
5. add a mechanical check later if the rule is important enough to enforce

## Sources And Drift

- prefer official docs and primary sources when possible
- keep the repo-local guidance shorter and more opinionated than the source material
- update the local rule when the repo changes, not only when the external source changes

The agent should not need to rediscover the same principle from the web every time.
