#!/usr/bin/env python3
"""Sets the Campaign Assistant's pin in a marketplace index.

Finds the entry by its source (repo and folder), not by its name, so the 2.0.0 rename from
payit2-campaign-assistant to payit2 renames the entry in the same step that moves the pin.
"""
import json
import sys

REPO = "PayIt2/payit2-campaign-assistant"
FOLDER = "plugin"


def bump(path: str, name: str, sha: str) -> None:
    with open(path) as f:
        data = json.load(f)
    for plugin in data.get("plugins", []):
        source = plugin.get("source", {})
        if source.get("url") == REPO and source.get("path") == FOLDER:
            plugin["name"] = name
            source["sha"] = sha
            break
    else:
        sys.exit(f"no {REPO} ({FOLDER}/) entry in {path}")
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
        f.write("\n")


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit("usage: bump_pin.py <marketplace.json> <plugin name> <sha>")
    bump(sys.argv[1], sys.argv[2], sys.argv[3])
