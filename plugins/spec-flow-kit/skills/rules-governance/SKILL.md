---
name: rules-governance
description: Rules governance guidance for spec-flow-kit. Use whenever importing, syncing, reviewing, or applying `.spec-flow-kit/rules/*.md`, `rules.yaml`, `project-profile.yaml`, advisory gates, strict gates, or rule conflicts.
---

# Rules Governance

Use this skill to manage project rules safely in `spec-flow-kit`.

## Rule Sources

Rules may come from project documentation, repository conventions, coding standards, testing policies, security guidance, or user-authored `.spec-flow-kit/rules/*.md` files.

Rules should be indexed in `rules.yaml` and referenced from `project-profile.yaml` under `rules.files` when commands need to load them.

## Governance Principles

- User-authored rule files are source material. Do not overwrite or delete them without explicit user intent.
- Automatically discovered rules should start as `proposed` unless the user has clearly confirmed them.
- Rules should not become strict blockers automatically.
- Strict mode must be explicitly enabled by the user.
- Advisory mode should explain likely issues without blocking work.
- Rule conflicts should be reported with options, not silently resolved in a surprising way.

## Rule Metadata Expectations

A structured rule entry should identify:

- `id`: Stable rule ID.
- `title`: Human-readable title.
- `level`: `required`, `recommended`, or `informational`.
- `source`: Source file path.
- `scope`: `feature`, `project`, `team`, `organization`, or `plugin-default`.
- `appliesTo`: Stages such as requirements, design, plan, development, verification, audit, or delivery.
- `enforcement.mode`: `advisory` or `strict`.
- `status`: `proposed`, `active`, or `deprecated`.

## Sync Checklist

When syncing rules:

1. List rule files under `.spec-flow-kit/rules/`.
2. Compare them with `project-profile.yaml` `rules.files`.
3. Compare them with `rules.yaml` source entries.
4. Add missing still-existing rule files without removing valid user additions.
5. Report deleted, renamed, or ambiguous rule references.
6. Keep generated changes minimal and easy to review.

## Applying Rules

When a rule applies to a stage:

- Load only relevant rule files to avoid context bloat.
- Cite rule IDs in requirements, design, tasks, verification, or audit findings.
- If a rule blocks progress, state the specific rule, affected artifact, and required action.
- If a rule is advisory, phrase it as guidance and let the command orchestrator decide how to proceed.