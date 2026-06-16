#!/usr/bin/env node
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const marketplacePath = join(root, '.claude-plugin', 'marketplace.json');
const errors = [];

function readJson(path) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    errors.push(`${path} is not valid JSON: ${error.message}`);
    return null;
  }
}

function isKebabCase(value) {
  return /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/.test(value);
}

function validateMarketplace() {
  if (!existsSync(marketplacePath)) {
    errors.push('Missing .claude-plugin/marketplace.json');
    return;
  }

  const marketplace = readJson(marketplacePath);
  if (!marketplace) return;

  if (!marketplace.name || typeof marketplace.name !== 'string') {
    errors.push('marketplace.name is required');
  } else if (!isKebabCase(marketplace.name)) {
    errors.push('marketplace.name must be kebab-case');
  }

  if (!marketplace.description || typeof marketplace.description !== 'string') {
    errors.push('marketplace.description is required');
  }

  if (!Array.isArray(marketplace.plugins)) {
    errors.push('marketplace.plugins must be an array');
    return;
  }

  const seen = new Set();
  for (const [index, plugin] of marketplace.plugins.entries()) {
    const label = `plugins[${index}]`;
    if (!plugin || typeof plugin !== 'object' || Array.isArray(plugin)) {
      errors.push(`${label} must be an object`);
      continue;
    }

    if (!plugin.name || typeof plugin.name !== 'string') {
      errors.push(`${label}.name is required`);
    } else {
      if (!isKebabCase(plugin.name)) errors.push(`${label}.name must be kebab-case`);
      if (seen.has(plugin.name)) errors.push(`${label}.name duplicates "${plugin.name}"`);
      seen.add(plugin.name);
    }

    if (!plugin.description || typeof plugin.description !== 'string') {
      errors.push(`${label}.description is required`);
    }

    if (!plugin.source) {
      errors.push(`${label}.source is required`);
      continue;
    }

    if (typeof plugin.source === 'string' && plugin.source.startsWith('./')) {
      const sourcePath = resolve(root, plugin.source);
      if (!existsSync(sourcePath) || !statSync(sourcePath).isDirectory()) {
        errors.push(`${label}.source path does not exist: ${plugin.source}`);
        continue;
      }

      const pluginManifestPath = join(sourcePath, '.claude-plugin', 'plugin.json');
      if (!existsSync(pluginManifestPath)) {
        errors.push(`${label}.source missing .claude-plugin/plugin.json: ${plugin.source}`);
        continue;
      }

      const pluginManifest = readJson(pluginManifestPath);
      if (pluginManifest?.name && pluginManifest.name !== plugin.name) {
        errors.push(`${label}.name (${plugin.name}) does not match plugin manifest name (${pluginManifest.name})`);
      }
    }
  }
}

validateMarketplace();

if (errors.length > 0) {
  console.error(`Validation failed with ${errors.length} error(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('Marketplace skeleton is valid.');
