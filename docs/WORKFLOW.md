# Agent Sync Workflow

This document describes the workflow for synchronizing new agents to the website.

## Overview

```
AGENTS_LIST.md (optional)  →  scripts/scan_agents.py  →  _data/agents.yml  →  Jekyll Build  →  docs/
      ↓                            ↓                            ↓                    ↓
   手动维护                   自动扫描 md 文件              数据源              构建输出
```

## Quick Start

```bash
# One-command sync all agents
python3 scripts/scan_agents.py > _data/agents.yml && bundle exec jekyll build
```

## Workflow Steps

### Step 1: Scan Agent Files

The `scripts/scan_agents.py` script automatically:

1. **Scans** all agent directories: `engineering/`, `design/`, `game-development/`, `marketing/`, `paid-media/`, `product/`, `project-management/`, `sales/`, `specialized/`, `spatial-computing/`, `support/`, `testing/`
2. **Recursively** finds all `.md` files (including subdirectories like `game-development/godot/`, `game-development/unity/`)
3. **Extracts** frontmatter from each file: `name`, `description`, `color`, `emoji`, `vibe`
4. **Generates** YAML data for Jekyll

### Step 2: Generate agents.yml

```bash
python3 scripts/scan_agents.py > _data/agents.yml
```

This generates `_data/agents.yml` with all 147+ agents.

### Step 3: Build Website

```bash
bundle exec jekyll build
```

Output goes to `docs/` directory (configured in `_config.yml`).

### Step 4: Verify

Check generated pages:
```bash
ls docs/specialized/*.html | wc -l
```

## Detecting New Agents

### Option A: Compare with Previous Run

```bash
# Before adding new agents
python3 scripts/scan_agents.py | grep "^- name:" | wc -l
# Output: 147

# After adding new agents
python3 scripts/scan_agents.py | grep "^- name:" | wc -l
# Output: 150 (if 3 new agents added)
```

### Option B: Check for Missing Frontmatter

```bash
# Find agents without required frontmatter
./scripts/lint-agents.sh
```

### Option C: Full Diff

```bash
# Save current agents list
python3 scripts/scan_agents.py > /tmp/agents_before.yml

# ... add new agents ...

# Compare
diff <(grep "^- name:" /tmp/agents_before.yml) <(python3 scripts/scan_agents.py | grep "^- name:")
```

## CI/CD Integration

Add to `.github/workflows/sync-agents.yml`:

```yaml
name: Sync Agents

on:
  push:
    branches:
      - main
    paths:
      - '**.md'
  workflow_dispatch:

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Set up Ruby
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: '3.2'
          bundler-cache: true
      - name: Generate agents.yml
        run: python3 scripts/scan_agents.py > _data/agents.yml
      - name: Build site
        run: bundle exec jekyll build
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: docs
```

## Local Development

### Install Dependencies

```bash
# Install Ruby gems
bundle install
```

### Start Local Server

```bash
# Start Jekyll with live reload
bundle exec jekyll serve --livereload

# Or shorter alias
bundle exec jekyll s -l
```

The site will be available at: **http://localhost:4000/agency-agents/**

### Options

```bash
# Specify port
bundle exec jekyll serve --port 8080

# Disable live reload (faster)
bundle exec jekyll serve --no-livereload

# Watch for changes (default)
bundle exec jekyll serve --watch
```

### Troubleshooting

#### Port Already in Use

```bash
# Find and kill process using port 4000
lsof -i :4000
kill -9 <PID>
```

#### Build Errors

```bash
# Clean cache and rebuild
rm -rf .jekyll-cache
bundle exec jekyll clean
bundle exec jekyll build
```

## Troubleshooting

### YAML Parsing Error

If you get `mapping values are not allowed here`, check for unquoted colons in frontmatter:

```yaml
# Bad
description: Default perspective: Luhmann

# Good
description: "Default perspective: Luhmann"
```

### Missing Agents

Ensure all agent files have valid frontmatter:

```yaml
---
name: Agent Name
description: Agent description
color: blue
emoji: 🤖
---
```

### Lint Check

Before committing, run:

```bash
./scripts/lint-agents.sh
```

This validates:
- ✅ Frontmatter exists with `name`, `description`, `color`
- ⚠️ Recommended sections: `Identity`, `Core Mission`, `Critical Rules`
- ⚠️ Content length > 50 words
