# Changelog

All notable changes to this marketplace will be documented here.

This project uses two layers of versioning:

- Marketplace version: changes to `.claude-plugin/marketplace.json` and marketplace-level documentation.
- Plugin version: changes to an individual plugin's `.claude-plugin/plugin.json` and components.

## 0.1.0 - Unreleased

### Added

- Initialized Claude Code plugin marketplace structure and marketplace manifest.
- Added `spec-flow-kit` as the first experimental MVP plugin.
- Added `spec-flow-kit` prompt-only slash command flow for init, requirements, use, design, plan, development, verify, and status.
- Added `.spec-flow-kit/` templates and schemas for local state, gates, rules, traceability, evidence, and feature status.
- Added traceability and evidence workflow support for local spec-driven delivery governance.
- Added optional advisory hooks for stop-time status summaries and post-edit traceability reminders.
- Added MVP `spec-flow-kit` agents for requirements analysis, system design, and verification auditing.
- Added MVP `spec-flow-kit` skills for SDD core workflow, traceability/evidence, and rules governance.
- Added marketplace documentation and validation scaffolding.

### Changed

- Updated marketplace and plugin metadata to reflect current MVP maturity instead of planned-only skeleton status.
