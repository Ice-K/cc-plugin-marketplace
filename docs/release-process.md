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

Run:

```sh
npm run validate
claude plugin validate . --strict
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

## Future CI

A future GitHub Actions workflow should run:

```sh
npm run validate
claude plugin validate .
```

After at least one real plugin is added, CI can switch to strict validation:

```sh
claude plugin validate . --strict
```

CI remains a future enhancement for marketplace release automation.
