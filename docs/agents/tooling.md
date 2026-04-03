# Tooling

These tools fit the engineering-operating-system and software-design-philosophy direction for this repo when their tradeoffs match the subsystem being built.

Use them as defaults to consider, not as mandatory decorations.

## TypeScript And State

- [Effect](https://effect.website/): structured effect system for explicit workflows, errors, and concurrency where the added rigor pays for itself
- [TanStack Query](https://tanstack.com/query/latest): server-state synchronization, retries, caching, and invalidation
- [XState](https://stately.ai/docs/xstate): explicit state machines for flows that benefit from named transitions and visual clarity
- [Zustand](https://github.com/pmndrs/zustand): lightweight local client state when a heavier client-state abstraction is unnecessary
- [Zod](https://zod.dev/): runtime validation for trust boundaries and shared contracts
- [tRPC](https://github.com/trpc/trpc): end-to-end typed APIs when frontend and backend boundaries justify tight TypeScript integration
- [openapi-typescript](https://github.com/openapi-ts/openapi-typescript): generated TypeScript contracts from OpenAPI specs
- [Drizzle ORM](https://orm.drizzle.team/): typed relational persistence with explicit schema ownership

## React Native And UI

- [Tamagui](https://tamagui.dev/): consistent cross-platform UI primitives when design-system leverage matters
- [React Hook Form](https://react-hook-form.com/): form state and validation with low rerender pressure
- [FlashList](https://shopify.github.io/flash-list/): performant large-list rendering in React Native
- [react-native-mmkv](https://github.com/mrousavy/react-native-mmkv): fast local key-value storage for small client-side persistence needs

## Python And FastAPI

- [FastAPI dependencies](https://fastapi.tiangolo.com/tutorial/dependencies/): explicit request-scoped wiring for validation, auth, and shared route dependencies
- [SQLModel](https://sqlmodel.tiangolo.com/): typed SQLAlchemy/Pydantic-backed models where the API and persistence tradeoffs fit

## Architecture And Boundary Discipline

- [dependency-cruiser](https://github.com/sverweij/dependency-cruiser): JavaScript and TypeScript dependency graph enforcement
- [Tach](https://github.com/tach-org/tach): Python dependency-boundary enforcement

## Selection Rules

- choose the simplest tool that keeps the affected subsystem correct
- do not introduce a tool unless it hides real complexity or protects a real boundary
- prefer tools that make contracts, state transitions, or dependency direction more explicit
- avoid library sprawl that duplicates responsibility across overlapping tools

If a tool does not materially improve correctness, clarity, or maintainability for the current subsystem, do not add it.
