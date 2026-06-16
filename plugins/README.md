# Plugins

This directory contains marketplace plugins.

## Current plugins

- `spec-flow-kit` — experimental MVP for local spec-driven delivery governance in Claude Code. Includes prompt-only slash commands, MVP agents/skills, templates, schemas, traceability/evidence workflow support, and optional advisory hooks; MCP servers, strict gates, audit, delivery, and deployment workflows remain future work.

Future plugins should use this layout:

```text
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json
├── README.md
└── ...plugin components...
```

Guidelines:

- Use kebab-case names, for example `code-review` or `git-workflow`.
- Keep each plugin self-contained under its own directory.
- Add the plugin to `../.claude-plugin/marketplace.json` only after its manifest and README exist.
- Run `npm run validate` before publishing or tagging.
