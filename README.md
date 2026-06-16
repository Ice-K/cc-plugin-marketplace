# Claude Code Plugin Marketplace

A curated Claude Code plugin marketplace for managing multiple plugins in a single repository.

## Status

This repository contains a Claude Code plugin marketplace skeleton with the first planned plugin directory.

## Plugins

| Plugin | Category | Status | Description |
| --- | --- | --- | --- |
| `spec-flow-kit` | `development` | planned | Specification-driven workflow helpers for Claude Code. Implementation will be added later. |

## Structure

```text
.claude-plugin/
└── marketplace.json      # Marketplace manifest
plugins/
├── README.md
└── spec-flow-kit/        # First planned plugin directory
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

Install a plugin after its implementation is ready:

```sh
claude plugin install spec-flow-kit
```

Current note: `spec-flow-kit` is registered as a planned plugin. Its concrete commands, skills, agents, hooks, and workflow implementation will be added later.

## How many plugins should one marketplace manage?

There is no hard limit. Prefer grouping plugins that share the same audience, governance, quality bar, and security boundary.

Practical guidance:

- Start with 3-5 plugins.
- Keep a curated marketplace around 10-30 plugins for normal maintenance.
- With good automation and clear categories, 30-80 plugins can still work.
- Above 80-100 plugins, strongly consider splitting by domain.

For this repository, the recommended path is to start empty, then add 3-10 high-quality plugins before growing further.

## Documentation

- [Adding a plugin](docs/adding-a-plugin.md)
- [Plugin authoring guide](docs/plugin-authoring-guide.md)
- [Categories](docs/categories.md)
- [Release process](docs/release-process.md)

## License

MIT. See [LICENSE](LICENSE).
