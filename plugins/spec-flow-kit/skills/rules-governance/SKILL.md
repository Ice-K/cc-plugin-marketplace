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
- Plugin built-in template rules may default to `level: required`, `status: active`, and `enforcement.mode: strict`.
- Automatically discovered rule candidates should start as `level: recommended`, `status: proposed`, and `enforcement.mode: advisory` unless the user has clearly confirmed stricter behavior.
- User-authored or user-confirmed rules may be `required` / `recommended` / `informational` and `strict` / `advisory` according to user intent.
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

## Runtime Rule Loading Protocol

Commands that apply rules should use `rules.yaml` as the primary runtime index. `project-profile.yaml` `rules.files` is a discovery and sync list, not the main runtime authority.

For a stage such as `design`, `plan`, `development`, `verification`, `audit`, `delivery`, or `deploy`:

1. Read `.spec-flow-kit/rules.yaml`.
2. Select rules where `status: active` and `appliesTo` includes the current stage.
3. Sort or group selected rules by `priority`, then by `level`, then by `enforcement.mode`.
4. Treat `required` as 强制, `recommended` as 推荐, and `informational` as 参考.
5. Extract `source` from selected rules.
6. Normalize source paths to project-relative form.
7. Deduplicate normalized sources before reading rule body files.
8. Read each unique source file at most once.
9. Report missing source files as rule-loading gaps.
10. Include a rule-loading summary in the command output.

Loading strategy:

- `required + strict + active + appliesTo current stage`: read full rule body.
- `recommended + active`: read summary or relevant sections; if the file was already read for a required rule, do not read it again.
- `informational + active`: list ID and title by default; read body only when directly relevant.

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