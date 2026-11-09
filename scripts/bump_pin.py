#!/usr/bin/env python3
"""Sets the PayIt2 plugin's pin in a marketplace index.

Finds the entry by its source (repo and folder), not by its name, so the 2.0.0 rename from
payit2-campaign-assistant to payit2 renames the entry in the same step that moves the pin.
The entry's url is the full https URL (Claude Code clones owner/repo shorthand over SSH,
which fails for anyone without a GitHub SSH key); the shorthand is still recognised so an
index that predates that fix is found too.
"""
import json
import sys

REPO = "PayIt2/payit2-ai-plugin"
FOLDER = "plugin"


def repo_of(url: str) -> str:
    """Returns owner/repo for a GitHub https or ssh url, or owner/repo shorthand."""
    for prefix in ("https://github.com/", "git@github.com:"):
        if url.startswith(prefix):
            url = url[len(prefix):]
    return url.removesuffix(".git").strip("/")


def find_entry(plugins: list) -> dict | None:
    """Returns the plugin entry whose source is this repo's plugin/ folder, or None."""
    for plugin in plugins:
        source = plugin.get("source", {})
        if repo_of(source.get("url", "")) == REPO and source.get("path") == FOLDER:
            return plugin
    return None


def bump(path: str, name: str, sha: str) -> None:
    with open(path) as f:
        data = json.load(f)
    plugin = find_entry(data.get("plugins", []))
    if plugin is None:
        sys.exit(f"no {REPO} ({FOLDER}/) entry in {path}")
    plugin["name"] = name
    plugin["source"]["sha"] = sha
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit("usage: bump_pin.py <marketplace.json> <plugin name> <sha>")
    bump(sys.argv[1], sys.argv[2], sys.argv[3])
