# Ideation

## Current Status

- Stage: Phase 3 OpenClaw-native runtime rollout
- Runtime surface: OpenClaw built-in Discord
- Future channel path: OpenClaw built-in WhatsApp support, unless proven
  impossible
- Repo responsibility: operator tooling for Braintrust-managed runtime bundle
  rollout

## Product Direction

Intentive helps users get support at the moment their plans meet friction. The
runtime should stay close to ordinary conversation while letting experts improve
agent behavior through review and Braintrust-managed iteration.

Phase 3 removes the custom Intentive relay from the target architecture.
OpenClaw owns the channel runtime. This repo owns the small operator loop around
workspace registration, bundle application, and rollout evidence.

## Current Questions

- What runtime bundle content should Braintrust own globally?
- Which OpenClaw config keys are safe enough for allowlisted rollout?
- What evidence should operators capture after each bundle apply?
- What would prove that future WhatsApp support can stay on the OpenClaw
  built-in-channel path?
