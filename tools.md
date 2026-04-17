Tooling
These tools fit the engineering-operating-system and software-design-philosophy direction for this repo when their tradeoffs match the subsystem being built.
Use them as defaults to consider, not as mandatory decorations.
TypeScript And State
Effect: structured effect system for explicit workflows, errors, and concurrency where the added rigor pays for itself
TanStack Query: server-state synchronization, retries, caching, and invalidation
XState: explicit state machines for flows that benefit from named transitions and visual clarity
Zustand: lightweight local client state when a heavier client-state abstraction is unnecessary
Zod: runtime validation for trust boundaries and shared contracts
tRPC: end-to-end typed APIs when frontend and backend boundaries justify tight TypeScript integration
openapi-typescript: generated TypeScript contracts from OpenAPI specs
Drizzle ORM: typed relational persistence with explicit schema ownership
React Native And UI
Tamagui: consistent cross-platform UI primitives when design-system leverage matters
React Hook Form: form state and validation with low rerender pressure
FlashList: performant large-list rendering in React Native
react-native-mmkv: fast local key-value storage for small client-side persistence needs
Architecture And Boundary Discipline
dependency-cruiser: JavaScript and TypeScript dependency graph enforcement
Selection Rules
choose the simplest tool that keeps the affected subsystem correct
do not introduce a tool unless it hides real complexity or protects a real boundary
prefer tools that make contracts, state transitions, or dependency direction more explicit
avoid library sprawl that duplicates responsibility across overlapping tools
If a tool does not materially improve correctness, clarity, or maintainability for the current subsystem, do not add it.
