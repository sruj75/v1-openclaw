# Product

Read this file when the task depends on understanding the founder view of `v1-openclaw`.

## Use This When

- Translating product vision into scoped work
- Clarifying target users or user problems
- Deciding whether a feature fits the current product direction

## Current State

This document is a living summary of the current founder thesis. It should reflect synthesized direction, not every brainstorm, note dump, or contradictory framing that appears during exploration.

## Product Thesis

Intentive is not primarily a planning tool, reminder app, or general AI companion. The core company thesis is:

- we help people convert intention into action under real-world friction
- we intervene at the point where execution breaks, especially around starting work and recovering from derailment
- the atomic value unit is: the user was about to stall, and Intentive caused action

Implementation consequence:

- if a proposed feature does not strengthen this atomic loop, it is probably not part of V1

## Who It Is For

The primary wedge user is adults with executive dysfunction, especially:

- ADHD-leaning knowledge workers
- founders and operators with execution chaos
- people who already know what they should do but repeatedly fail at the moment of action

Shared traits:

- they are capable of planning
- they often already use calendars, task tools, or notes
- the real failure is not lack of information
- the real failure is friction, overwhelm, avoidance, drift, and broken transitions

Working ICP sentence:

- Intentive is for people whose plans are usually good enough, but whose execution breaks at the moment of action.

## Core Problem

The product is built around this problem:

- users often know what to do
- existing tools store intentions but wait for the user to initiate
- the painful failure happens later, when a person cannot start, continue, switch, or recover

Sharper statement:

- Intentive solves failure to convert intention into action under friction.

Emotional pain framing:

- one bad transition, one avoided task, or one lost hour can collapse the whole day

## Initial Wedge

The recommended entry point is narrow:

- work-block activation
- derailment rescue during or right before important work

Core promise:

- Intentive helps you start the work you avoid and recover faster when you derail.

Alternative strong framing:

- when you stall on important work, Intentive gets you moving again

## Product Patterns

These are decision patterns, not just positioning ideas.

### Wedge Pattern

Choose:

- one user
- one moment of failure
- one desired behavior change
- one proof metric

Current pattern:

- user: adults with executive dysfunction, starting with ADHD-leaning knowledge workers and adjacent operators
- moment: planned work block start, with derailment rescue close behind
- behavior change: user starts or restarts important work
- proof metric: intervention leads to measurable task-start or rescue improvement

### Feature Fit Pattern

A feature belongs in V1 only if it clearly improves one of these:

- start-of-block activation
- derailment rescue
- lightweight learning about what intervention works

If it mainly improves one of these, defer it:

- broad companionship
- ambient intelligence
- general life management
- therapy-adjacent support
- infrastructure prestige without behavior proof

### Modality Pattern

Choose the lowest-friction modality that produces measurable behavior change.

Default rule:

- text-first is acceptable by default
- voice is an enhancement, not an assumption
- richer modality must earn its complexity by improving conversion or rescue outcomes

### Concierge Pattern

Manual work is allowed if it helps prove the atomic value unit faster.

Good uses of concierge effort:

- manually reviewing failed blocks
- tuning prompt tone and timing
- classifying why rescue failed
- faking intelligence behind the scenes to learn what actually works

Bad use of concierge effort:

- hiding the fact that the core loop does not cause action

### Expansion Pattern

Expand scope only after the narrow loop works repeatedly.

Order of expansion:

- prove block-start activation and rescue
- improve personalization and memory
- broaden across more moments in the day
- add premium human escalation only after the AI-only loop has real value

## MVP Shape

The MVP should prove one closed loop:

- the user has 1 to 3 important work blocks
- Intentive knows the block and intended outcome
- Intentive checks in at the right moment
- if the user does not start, Intentive rescues with a low-friction intervention
- the system logs what happened and learns what tends to work

Core inputs:

- today’s important work blocks
- time windows
- preferred check-in style
- simple memory of what interventions worked before

Optional early inputs:

- calendar
- task list

Core actions:

- pre-block prompt
- request for the first tiny step
- start confirmation
- rescue intervention if the user stalls
- block-close reflection
- lightweight learning for future interventions

Representative rescue interventions:

- shrink the task
- define the first click
- run a 10-minute sprint
- body-doubling style countdown
- emotional reset
- intentional reschedule instead of silent failure

Operational pattern:

- one user
- one workday
- one important block
- one rescue loop

That is the minimum unit that needs to work repeatedly before broader system claims are credible.

## Product Principles

- Sell outcome, not anthropomorphism.
- Optimize for behavior change, not “supportive vibes.”
- Reduce initiation burden; never become another task for the user.
- Own one painful loop before expanding into a broader cognitive system.
- Use ADHD as an early wedge if helpful, but do not trap the company in an “ADHD app” box.

Decision rule:

- when product choices conflict, prefer the option that improves reliable execution under friction over the option that makes the system sound more intelligent or more emotionally rich

## What To Avoid In V1

- broad life-companion framing
- full-day autonomous operating system claims
- therapy replacement positioning
- heavy human-in-the-loop dependency
- over-engineered context monitoring
- trying to solve every executive dysfunction domain at once
- default voice-first interaction unless it clearly improves conversion

## Positioning

Internal framing:

- proactive execution scaffold

External positioning:

- Intentive helps you start the work you avoid and recover faster when you derail.

Differentiation:

- not better planning
- not better reminders
- intervention at the point of failure

## What Makes This Bigger Over Time

The long-term company can expand beyond the first wedge:

- behavioral memory that learns timing, tone, and intervention style
- broader execution and recovery support across the day
- eventual human escalation or premium support layers

Potential moat:

- a growing intervention dataset tied to real behavioral outcomes

## Success Criteria

The product should be judged by behavior change, not novelty.

Key metrics:

- percent of planned work blocks started
- time from prompt to first action
- percent of derailments recovered
- end-of-day completion of top priorities
- reduced subjective overwhelm and drift

Measurement pattern:

- engagement metrics are necessary but not sufficient
- action-conversion metrics are stronger than sentiment
- behavior change is the real proof

Priority order:

- first measure whether interventions cause starts and rescues
- then measure whether days feel more successful overall
