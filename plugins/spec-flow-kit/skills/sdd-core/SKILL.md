---
name: sdd-core
description: Core spec-driven delivery workflow guidance for spec-flow-kit. Use whenever working on `/sfk-requirements`, `/sfk-design`, `/sfk-plan`, feature status, gates, or the requirements-to-design-to-task flow.
---

# SDD Core

Use this skill to keep `spec-flow-kit` work aligned with the local spec-driven delivery flow.

## Workflow

1. Requirements define the user-visible change and acceptance criteria.
2. Design explains how the system should satisfy those requirements.
3. ADR records important decisions and tradeoffs.
4. Tasks break the design into implementable work.
5. Development implements scoped tasks and updates traceability.
6. Verification checks acceptance criteria against evidence.
7. Status reports the current stage, blockers, and next action.

## Core Rules

- Markdown artifacts are for people; JSON, JSONL, and YAML artifacts are for tools.
- Default human-facing artifacts to Chinese unless the feature already uses another language.
- Every requirement that affects implementation should have a stable ID.
- Every design decision that affects implementation should have a stable ID.
- Every task should reference requirements, design decisions, applicable rules, expected code changes, expected tests, and required evidence.
- Gate states should be explicit: `passed`, `blocked`, `failed`, or `waived` where supported by the file protocol.
- Do not advance a gate by guessing. If inputs are unclear, mark the gate blocked and list required actions.

## Minimal Artifact Expectations

### requirements.md

Include summary, goals, non-goals, user stories, functional requirements, non-functional requirements, acceptance criteria, edge cases, risks, assumptions, and open questions.

### design.md

Include architecture, components, interfaces, data/state changes, error handling, security considerations, rule impacts, and requirement mapping.

### adr.md

Record decisions, context, considered alternatives, chosen approach, consequences, and related requirement/design IDs.

### tasks.md

For each task, include task ID, description, requirement IDs, design IDs, rules, implementation notes, expected tests, and evidence needs.

## Readiness Heuristic

A stage is ready only when the next stage can proceed without inventing missing facts. If the next stage would need to guess, the current gate should remain blocked.