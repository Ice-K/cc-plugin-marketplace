# Release Process

This repository uses two layers of releases: marketplace releases and plugin releases.

## Marketplace releases

A marketplace release covers changes to:

- `.claude-plugin/marketplace.json`
- Root documentation
- Repository validation and governance files

Examples:

- Adding or removing a plugin entry
- Updating marketplace metadata
- Changing categories or contribution policy

## Plugin releases

A plugin release covers changes inside one plugin directory:

```text
plugins/<plugin-name>/
```

Examples:

- Adding a command, agent, skill, hook, MCP configuration, output style, LSP configuration, or channel
- Changing plugin behavior
- Updating plugin documentation
- Deprecating or renaming a component

## Validation before release

Run the full local validation suite:

```sh
npm run validate
```

This includes:

- marketplace manifest checks;
- `spec-flow-kit` structural checks for commands, agents, skills, hooks, schemas, templates, and MCP configuration;
- `spec-flow-kit` MCP state server smoke tests;
- `spec-flow-kit` hook smoke tests;
- Claude Code marketplace validation.

Strict Claude validation should also pass before releasing:

```sh
npm run validate:claude:strict
```

When releasing a specific plugin, also run:

```sh
claude plugin validate plugins/<plugin-name> --strict
```

## Tagging

Claude Code provides a tag helper:

```sh
claude plugin tag [path]
```

Preview before creating a tag:

```sh
claude plugin tag plugins/<plugin-name> --dry-run
```

Do not create or push tags unless the release is intentional.

## Continuous integration

The repository includes `.github/workflows/validate.yml`.

CI runs on pushes to `main`, pull requests, and manual dispatch. It always runs repository-owned checks and smoke tests:

```sh
npm run validate:marketplace
npm run validate:spec-flow-kit
npm run smoke:spec-flow-kit:mcp
npm run smoke:spec-flow-kit:hooks
```

If the runner has the Claude CLI installed, CI also runs:

```sh
npm run validate:claude:strict
```

If the Claude CLI is unavailable, that step is skipped with an explanatory message; local release validation should still run strict Claude validation before publishing or tagging.
