#!/usr/bin/env python3
"""
Generate agents.yml by scanning all agent markdown files in the project.
This script directly reads frontmatter from each agent .md file,
providing more accurate data than parsing AGENTS_LIST.md.
"""
import os
import re
import yaml

# Agent directories
AGENT_DIRS = [
    'engineering',
    'design',
    'game-development',
    'marketing',
    'paid-media',
    'product',
    'project-management',
    'sales',
    'specialized',
    'spatial-computing',
    'support',
    'testing',
]

# Category metadata
CATEGORY_MAP = {
    'engineering': {'name': 'Engineering', 'color': '#3b82f6', 'emoji': '⚙️'},
    'design': {'name': 'Design', 'color': '#ec4899', 'emoji': '🎨'},
    'game-development': {'name': 'Game Development', 'color': '#8b5cf6', 'emoji': '🎮'},
    'marketing': {'name': 'Marketing', 'color': '#f59e0b', 'emoji': '📢'},
    'paid-media': {'name': 'Paid Media', 'color': '#ef4444', 'emoji': '💰'},
    'product': {'name': 'Product', 'color': '#06b6d4', 'emoji': '📦'},
    'project-management': {'name': 'Project Management', 'color': '#84cc16', 'emoji': '📋'},
    'sales': {'name': 'Sales', 'color': '#14b8a6', 'emoji': '💼'},
    'specialized': {'name': 'Specialized', 'color': '#6366f1', 'emoji': '🔧'},
    'spatial-computing': {'name': 'Spatial Computing', 'color': '#f97316', 'emoji': '🌐'},
    'support': {'name': 'Support', 'color': '#22c55e', 'emoji': '🎧'},
    'testing': {'name': 'Testing', 'color': '#a855f7', 'emoji': '🧪'},
}

BASEURL = '/agency-agents'


def slugify(name):
    """Convert name to URL-friendly slug."""
    slug = name.lower()
    slug = slug.replace(' & ', '-').replace('&', '').replace(' ', '-')
    slug = re.sub(r'[^\w\-]', '', slug)
    while '--' in slug:
        slug = slug.replace('--', '-')
    return slug.strip('-')


def parse_frontmatter(file_path):
    """Parse YAML frontmatter from a markdown file."""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Check for frontmatter delimiters
    if not content.startswith('---'):
        return None

    # Extract frontmatter between first and second ---
    parts = content.split('---', 2)
    if len(parts) < 3:
        return None

    frontmatter_text = parts[1].strip()

    # Skip if empty
    if not frontmatter_text:
        return None

    try:
        data = yaml.safe_load(frontmatter_text)
        return data if isinstance(data, dict) else None
    except yaml.YAMLError as e:
        print(f"YAML error in {file_path}: {e}")
        return None


def get_category_from_path(file_path):
    """Extract category from file path."""
    parts = file_path.split(os.sep)
    if parts[0] in CATEGORY_MAP:
        return parts[0]
    return 'specialized'  # default


def generate_url(category, file_name):
    """Generate URL for the agent page."""
    return f"{BASEURL}/{category}/{file_name}.html"


def find_md_files_in_dir(directory):
    """Recursively find all .md files in directory, return full paths."""
    md_files = []
    for root, dirs, files in os.walk(directory):
        for f in files:
            if f.endswith('.md'):
                # Return relative path from the base agent directory
                rel_path = os.path.relpath(os.path.join(root, f), directory)
                md_files.append(rel_path)
    return md_files


def scan_agents():
    """Scan all agent directories and extract agent data."""
    agents = []

    for dir_name in AGENT_DIRS:
        if not os.path.isdir(dir_name):
            continue

        # Find all .md files recursively (including subdirectories)
        md_files = find_md_files_in_dir(dir_name)

        for md_file in md_files:
            file_path = os.path.join(dir_name, md_file)
            frontmatter = parse_frontmatter(file_path)

            if not frontmatter:
                continue

            name = frontmatter.get('name')
            if not name:
                continue

            # Get category
            category = get_category_from_path(file_path)
            cat_info = CATEGORY_MAP.get(category, {'name': 'Unknown', 'color': '#6b7280', 'emoji': '🤖'})

            # Build agent data
            agent = {
                'name': name,
                'description_en': frontmatter.get('description', ''),
                'description_zh': frontmatter.get('description_zh', ''),
                'category': category,
                'category_name': cat_info['name'],
                'color': frontmatter.get('color', cat_info['color']),
                'emoji': frontmatter.get('emoji', cat_info['emoji']),
                'vibe': frontmatter.get('vibe', ''),
                'url': generate_url(category, md_file[:-3]),
            }

            agents.append(agent)

    # Sort by name
    agents.sort(key=lambda x: x['name'])

    return agents


def main():
    """Main entry point."""
    agents = scan_agents()

    print(f"# Generated {len(agents)} agents")
    print(yaml.dump(agents, allow_unicode=True, default_flow_style=False, sort_keys=False))


if __name__ == '__main__':
    main()
