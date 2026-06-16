# Contributing

Thanks for helping maintain this Claude Code plugin marketplace.

## Current phase

The repository is currently an initialized marketplace skeleton. Do not add placeholder plugins just to fill the marketplace. Add a plugin only when it has a real purpose, documentation, and validation coverage.

## Adding plugins

Follow `docs/adding-a-plugin.md`.

At a minimum, each plugin should include:

- `plugins/<plugin-name>/.claude-plugin/plugin.json`
- `plugins/<plugin-name>/README.md`
- At least one useful Claude Code component, such as commands, agents, skills, hooks, MCP configuration, output styles, LSP configuration, or channels.

## Naming

Use kebab-case names:

```text
code-review
git-workflow
project-scaffold
```

Avoid generic names such as `plugin1`, names with underscores, or names that differ only by punctuation.

## Validation

Before submitting changes, run:

```sh
npm run validate
```

If you change marketplace or plugin manifests, also run Claude Code's built-in validation directly:

```sh
claude plugin validate .
```

Strict validation currently warns because the skeleton has no plugins yet. Enable strict validation after adding the first real plugin:

```sh
claude plugin validate . --strict
```

## Security

Do not commit secrets or credentials:

- `.env` files
- API keys or tokens
- private keys
- generated credential files

Hooks and MCP integrations require extra review because they may run automatically or connect to external services. Document why they are needed and what permissions they require.
