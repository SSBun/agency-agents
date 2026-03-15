#!/usr/bin/env bash
#
# Sync all agents and build the website
#
# Usage: ./scripts/sync.sh [--skip-build]
#
# This script:
#   1. Scans all agent .md files
#   2. Generates _data/agents.yml
#   3. Runs lint checks
#   4. Builds Jekyll site to docs/

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$REPO_ROOT"

SKIP_BUILD=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--skip-build]"
            exit 1
            ;;
    esac
done

echo "=========================================="
echo "Agent Sync Workflow"
echo "=========================================="
echo ""

# Step 1: Count existing agents
echo "Step 1: Scanning agent files..."
python3 scripts/scan_agents.py > _data/agents.yml
AGENT_COUNT=$(grep -c "^- name:" _data/agents.yml)
echo "  ✓ Generated agents.yml with $AGENT_COUNT agents"
echo ""

# Step 2: Lint agents
echo "Step 2: Running lint checks..."
if ./scripts/lint-agents.sh; then
    echo "  ✓ Lint passed"
else
    echo "  ✗ Lint failed - please fix errors above"
    exit 1
fi
echo ""

# Step 3: Build site
if [[ "$SKIP_BUILD" == "false" ]]; then
    echo "Step 3: Building Jekyll site..."
    bundle exec jekyll build
    echo "  ✓ Built to docs/"
else
    echo "Step 3: Skipped (--skip-build)"
fi
echo ""

echo "=========================================="
echo "Done! $AGENT_COUNT agents synced to docs/"
echo "=========================================="
