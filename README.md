# Claude Code Plugin Marketplace

A curated Claude Code plugin marketplace for managing multiple plugins in a single repository.

## Status

This repository hosts a curated Claude Code plugin marketplace with one experimental MVP plugin: `spec-flow-kit`.

## Plugins

| Plugin | Category | Status | Description |
| --- | --- | --- | --- |
| `spec-flow-kit` | `development` | experimental MVP | Local spec-driven delivery governance for Claude Code with prompt-only workflow commands, MVP agents/skills, templates, schemas, traceability/evidence support, and optional advisory hooks. |

## Structure

```text
.claude-plugin/
└── marketplace.json      # Marketplace manifest
plugins/
├── README.md
└── spec-flow-kit/        # Experimental MVP plugin
docs/                     # Authoring and maintenance documentation
scripts/                  # Validation scripts
schemas/                  # Local schema/reference files
```

Additional plugins should live under `plugins/<plugin-name>/` and include their own `.claude-plugin/plugin.json` manifest.

## Local validation

Run repository convention checks:

```sh
npm run validate:marketplace
```

Run Claude Code's built-in plugin/marketplace validation:

```sh
npm run validate:claude
```

Strict validation should pass after adding real plugins:

```sh
npm run validate:claude:strict
```

Run both:

```sh
npm run validate
```

## Claude Code marketplace commands

Add this marketplace from a local path, GitHub repository, or URL:

```sh
claude plugin marketplace add <source> --scope user
```

Use `--scope project` for project-level registration or `--scope local` for local-only testing.

List configured marketplaces:

```sh
claude plugin marketplace list
```

Install the experimental MVP plugin for local testing:

```sh
claude plugin install spec-flow-kit
```

Current note: `spec-flow-kit` currently provides MVP prompt commands, MVP agents/skills, `.spec-flow-kit/` templates/schemas, traceability/evidence workflow support, and optional advisory hooks. MCP servers, strict gates, audit, delivery, and deployment workflows remain future work.

## How many plugins should one marketplace manage?

There is no hard limit. Prefer grouping plugins that share the same audience, governance, quality bar, and security boundary.

Practical guidance:

- Start with 3-5 plugins.
- Keep a curated marketplace around 10-30 plugins for normal maintenance.
- With good automation and clear categories, 30-80 plugins can still work.
- Above 80-100 plugins, strongly consider splitting by domain.

For this repository, the recommended path is to continue hardening `spec-flow-kit` as the first experimental plugin, then add more high-quality plugins once they have clear documentation and validation coverage.

## Documentation

- [Adding a plugin](docs/adding-a-plugin.md)
- [Plugin authoring guide](docs/plugin-authoring-guide.md)
- [Categories](docs/categories.md)
- [Release process](docs/release-process.md)

## License

MIT. See [LICENSE](LICENSE).
