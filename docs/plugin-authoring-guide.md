# Plugin Authoring Guide

This guide defines repository conventions for plugins added to this marketplace.

## Marketplace philosophy

The marketplace should stay curated. A plugin belongs here when it shares this repository's audience, quality bar, security expectations, and maintenance process.

## Plugin structure

Use this baseline:

```text
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json
├── README.md
└── ...components...
```

Keep each plugin self-contained so it can be validated, reviewed, or moved independently.

## Manifest

Each plugin must have:

```text
plugins/<plugin-name>/.claude-plugin/plugin.json
```

The manifest should include at least:

- `name`
- `description`
- `author` when appropriate

Use the current Claude Code CLI validation as the source of truth:

```sh
claude plugin validate plugins/<plugin-name> --strict
```

## Commands

Commands intended for distribution should:

- Work across macOS, Linux, and Windows where possible.
- Detect optional dependencies instead of assuming them.
- Explain missing requirements clearly.
- Avoid destructive actions unless explicitly requested by the user.

## Agents

Agents should have focused responsibilities. Prefer one clear role over a broad, ambiguous assistant.

Good examples:

- `reviewer`
- `architect`
- `test-writer`
- `security-auditor`

## Skills

Skills should use progressive disclosure: put the trigger and overview in `SKILL.md`, and keep large references in separate files when needed.

A skill directory should include:

```text
skills/<skill-name>/SKILL.md
```

## Hooks and MCP

Hooks and MCP integrations require extra care:

- Document what they do.
- Document when they run.
- Document required permissions or credentials.
- Prefer least privilege.
- Avoid enabling high-risk behavior by default.

## Secrets

Never commit:

- `.env` files
- API keys or tokens
- private keys
- generated credentials

Use documentation placeholders instead.

## Plugin lifecycle

Use clear status labels in plugin READMEs:

- `experimental`
- `beta`
- `stable`
- `deprecated`

Do not present experimental plugins as stable.
