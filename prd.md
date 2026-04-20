**Intentive Phase 3 OpenClaw Runtime PRD**

## Overview

Intentive Phase 3 moves runtime execution onto OpenClaw built-in channels. The
current user-facing runtime is OpenClaw built-in Discord. Future WhatsApp
support should use the same built-in-channel path unless that proves impossible.

This repository is the operator toolkit around that runtime. It applies
Braintrust-managed runtime bundles to active OpenClaw workspaces and records the
configuration needed for controlled rollout.

## Problem

The earlier custom relay made this repository responsible for Discord ingress,
SQLite routing, OpenClaw gateway proxying, and local observability evidence.
That architecture duplicated responsibilities that belong in OpenClaw and made
runtime rollout harder to reason about.

## Goal

Build the smallest operator surface that proves:

- every active OpenClaw workspace can receive the same resolved Braintrust
  runtime bundle version
- shared runtime file changes are applied with managed blocks
- allowlisted OpenClaw config changes are patched safely
- operators can verify the exact bundle version and changed targets

## Current Architecture

### Runtime Layer

- OpenClaw built-in Discord is the active channel runtime.
- OpenClaw owns channel ingress, conversation execution, and runtime state.
- Future WhatsApp should be implemented through OpenClaw built-in channels.

### Operator Layer

- `openclaw-workspaces.json` lists active OpenClaw workspaces and config path.
- `openclaw:apply` resolves a Braintrust runtime bundle by slug and version.
- Managed file sections update workspace files across the registry.
- Allowlisted config sections patch OpenClaw config.

### Braintrust Layer

- Braintrust stores runtime bundle content and version history.
- Operators can apply latest or pinned bundle versions.
- The resolved Braintrust version is printed for rollout evidence.

## Non-Goals

- custom Intentive Discord gateway ingress
- SQLite relay routing or session persistence
- Intentive-managed OpenClaw gateway proxying
- relay-specific smoke tests or seed workflows
- WhatsApp outside OpenClaw built-in channel support

## Success Criteria

- `npm test`, `npm run build`, and whitespace checks pass.
- `openclaw:apply` remains the central public command.
- Docs describe OpenClaw built-in Discord as the current runtime surface.
- Docs identify WhatsApp as a future OpenClaw built-in-channel path.
- Relay-era architecture is documented only as retired historical context.
