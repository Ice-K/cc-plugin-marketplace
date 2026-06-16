---
name: traceability-evidence
description: Traceability and evidence guidance for spec-flow-kit. Use whenever updating or auditing `traceability.md`, `traceability.json`, `evidence.jsonl`, verification reports, or acceptance criteria evidence.
---

# Traceability and Evidence

Use this skill to keep `spec-flow-kit` evidence and traceability trustworthy.

## Traceability Chain

A complete feature should connect:

```text
Requirement -> Design decision -> Task -> Code/Test change -> Evidence -> Verification result
```

Traceability is incomplete when any link is missing, ambiguous, stale, or inconsistent between Markdown and JSON artifacts.

## Evidence Types

Use only the evidence types supported by the file protocol:

- `actual-command`: A real local command was run. Must include command, exit code, timestamp, and enough output summary to be useful.
- `external-ci`: CI or external automation result. Must include source, status, timestamp or run ID, and a reference when available.
- `user-confirmed`: The user explicitly confirmed a result. Record what was confirmed, by whom, and when.
- `manual-review`: A human or Claude-assisted manual review. It can support judgment but should not replace required command evidence.
- `claude-inferred`: Claude's reasoning from files or context. This is advisory and cannot be presented as actual command or CI evidence.

## Evidence Rules

- Never fabricate command output, CI results, timestamps, or user confirmation.
- Never promote `claude-inferred` evidence to `actual-command`.
- If a command fails, record the failure honestly and mark affected criteria as failed, partial, blocked, or pending.
- Do not store secrets, tokens, private keys, credentials, or sensitive raw output in evidence files.
- Prefer concise summaries over full logs unless full logs are safe and necessary.

## Traceability Consistency Checks

When updating or auditing traceability:

1. Confirm every requirement ID exists in `requirements.md`.
2. Confirm every design ID exists in `design.md` or `adr.md`.
3. Confirm every task ID exists in `tasks.md`.
4. Confirm evidence references real evidence records.
5. Confirm Markdown and JSON representations agree on status and links.
6. Mark gaps explicitly instead of silently omitting them.

## Verification Status Guidance

- `pass`: Evidence satisfies the criterion.
- `partial`: Some evidence exists, but coverage is incomplete.
- `blocked`: Required evidence or prerequisite is missing.
- `failed`: Evidence shows the criterion is not satisfied.
- `pending`: Work or evidence has not been evaluated yet.

Prefer conservative status when evidence is weak.