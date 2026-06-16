# Adding a Plugin

This marketplace is designed for one repository to manage multiple Claude Code plugins.

## 1. Choose a name

Use kebab-case:

```text
plugins/<plugin-name>/
```

The plugin name should match all of these places:

- Directory name: `plugins/<plugin-name>`
- Plugin manifest: `plugins/<plugin-name>/.claude-plugin/plugin.json`
- Marketplace entry: `.claude-plugin/marketplace.json`

## 2. Create the plugin directory

A typical plugin layout is:

```text
plugins/<plugin-name>/
├── .claude-plugin/
│   └── plugin.json
├── README.md
└── ...components...
```

Use `claude plugin init --help` to inspect the scaffold options available in your installed Claude Code version.

## 3. Add useful components

A plugin should include at least one real component, such as:

- commands
- agents
- skills
- hooks
- MCP configuration
- LSP configuration
- output styles
- channels

Do not add empty component folders just for appearance.

## 4. Write the plugin README

Include:

- What the plugin does
- What components it provides
- Setup requirements
- Permission or security notes
- Example usage
- Maintenance status

## 5. Register the plugin in the marketplace

Add an entry to `.claude-plugin/marketplace.json`:

```json
{
  "name": "plugin-name",
  "description": "Short user-facing description.",
  "category": "development",
  "source": "./plugins/plugin-name"
}
```

## 6. Validate

Run:

```sh
npm run validate
claude plugin validate plugins/<plugin-name> --strict
```

## 7. Update documentation

Update:

- Root `README.md` plugin list
- `CHANGELOG.md`
- Any relevant docs under `docs/`

## 8. Tag releases when ready

After a plugin is ready for release, use Claude Code's tag helper from the plugin path or repository root:

```sh
claude plugin tag plugins/<plugin-name> --dry-run
```

Create and push tags only when explicitly ready to publish.
