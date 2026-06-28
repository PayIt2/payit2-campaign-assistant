#!/usr/bin/env python3
"""Documentation index generator, frontmatter filler, and checker.

Governed by PLATFORM-STANDARDS section 14 and docs/documentation-policy.md.
Deterministic, no AI, no third-party dependencies.

Usage:
  docs_index.py generate [REPO_ROOT]   # write DOCS.md from in-scope markdown
  docs_index.py fill [REPO_ROOT]       # prepend minimal frontmatter where missing
  docs_index.py check [REPO_ROOT]      # advisory checks (always exit 0)
  docs_index.py check --strict [ROOT]  # checks, exit 1 on a finding (M4 enforcement)

Checks: membership (every in-scope doc is in DOCS.md and every entry resolves),
frontmatter validity (every in-scope doc has frontmatter with a valid type), and
within-repo INV-1 (no two documents claim the same canonical_for topic).

`fill` is the migration-phase-M2 helper: it proposes a type from the folder and
writes `type`/`doc_status`/`owner`/`title` frontmatter only where none exists. It
never sets `canonical_for` (so it cannot create a false INV-1 collision) and never
touches a file that already has frontmatter. Review the diff before committing.
"""
import os
import sys

EXCLUDE_DIRS = {
    ".git", ".github", "node_modules", ".next", "generated", "dist",
    "archive", "data", "blog",
}
INDEX_FILE = "DOCS.md"
VALID_TYPES = [
    "standard", "adr", "decision-log", "reference", "spec",
    "runbook", "worklist", "strategy", "historical",
]
TYPE_ORDER = VALID_TYPES + ["unclassified"]


def in_scope(root):
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in EXCLUDE_DIRS]
        for name in filenames:
            if name.endswith(".md"):
                full = os.path.join(dirpath, name)
                rel = os.path.relpath(full, root).replace(os.sep, "/")
                if rel == INDEX_FILE:
                    continue
                yield rel, full


def parse(path):
    """Return dict: has_fm, type, title, status, canonical_topics."""
    info = {"has_fm": False, "type": None, "title": None,
            "status": None, "canonical_topics": []}
    try:
        with open(path, "r", encoding="utf-8") as fh:
            lines = fh.read().splitlines()
    except OSError:
        return info
    if lines and lines[0].strip() == "---":
        info["has_fm"] = True
        in_canon = False
        for line in lines[1:]:
            if line.strip() == "---":
                break
            stripped = line.strip()
            if line.startswith("type:"):
                info["type"] = line.split(":", 1)[1].strip()
            elif line.startswith("title:"):
                info["title"] = line.split(":", 1)[1].strip().strip('"')
            elif line.startswith("doc_status:"):
                info["status"] = line.split(":", 1)[1].strip()
            elif line.startswith("canonical_for:"):
                in_canon = True
                # inline list form: canonical_for: [{topic: x}, ...]
                if "topic:" in line:
                    for chunk in line.split("topic:")[1:]:
                        info["canonical_topics"].append(
                            chunk.strip().strip("{}[], ").split(",")[0]
                            .split("}")[0].strip())
            elif in_canon and "topic:" in stripped:
                t = stripped.split("topic:", 1)[1].strip().strip("{}[], ")
                t = t.split(",")[0].split("}")[0].strip()
                if t:
                    info["canonical_topics"].append(t)
            elif in_canon and stripped and not stripped.startswith("-") \
                    and ":" in stripped and not stripped.startswith("{"):
                in_canon = False
    if not info["title"]:
        for line in lines:
            if line.startswith("# "):
                info["title"] = line[2:].strip()
                break
    return info


def infer_type(rel):
    base = os.path.basename(rel)
    if base in ("OPEN_ITEMS.md", "COMPLETED_ITEMS.md"):
        return "worklist"
    if base == "CLAUDE.md":
        return "standard"
    if "ceo-decisions-ledger" in base:
        return "decision-log"
    if base.startswith("ADR-"):
        return "adr"
    if "/runbooks/" in "/" + rel:
        return "runbook"
    if "/specs/" in "/" + rel:
        return "spec"
    if "/strategy/" in "/" + rel or "/research/" in "/" + rel:
        return "strategy"
    if "/architecture/" in "/" + rel:
        return "reference"
    return "reference"


def cmd_fill(root):
    filled = 0
    for rel, full in in_scope(root):
        info = parse(full)
        if info["has_fm"]:
            continue
        ftype = infer_type(rel)
        title = (info["title"] or os.path.basename(rel)).replace('"', "'")
        fm = ["---", f'title: "{title}"', f"type: {ftype}",
              "doc_status: active", "owner: claude-maintained"]
        if ftype == "adr":
            fm.append("adr_status: accepted")
        fm += ["---", ""]
        try:
            with open(full, "r", encoding="utf-8") as fh:
                body = fh.read()
            with open(full, "w", encoding="utf-8") as fh:
                fh.write("\n".join(fm) + body)
            filled += 1
        except OSError as e:
            print(f"  skip {rel}: {e}")
    print(f"filled frontmatter on {filled} file(s)")
    return 0


def collect(root):
    rows = []
    for rel, full in in_scope(root):
        info = parse(full)
        # Foreign frontmatter (no `type:`) = a Claude plugin/agent/skill/command
        # manifest, not a policy document. Out of scope for indexing and checks.
        if info["has_fm"] and not info["type"]:
            continue
        rows.append({
            "path": rel, "type": info["type"] or "unclassified",
            "title": info["title"] or os.path.basename(rel),
            "status": info["status"] or "",
            "has_fm": info["has_fm"],
            "canonical_topics": info["canonical_topics"],
        })
    rows.sort(key=lambda r: r["path"])
    return rows


def render(rows):
    out = ["# Documentation Index (DOCS.md)", "",
           "Generated by `scripts/docs_index.py`. Do not edit by hand.",
           "Governed by PLATFORM-STANDARDS section 14 and "
           "`docs/documentation-policy.md`.", "",
           f"Total in-scope documents: {len(rows)}", ""]
    by_type = {}
    for r in rows:
        by_type.setdefault(r["type"], []).append(r)
    for t in TYPE_ORDER + sorted(k for k in by_type if k not in TYPE_ORDER):
        if t not in by_type:
            continue
        out.append(f"## {t} ({len(by_type[t])})")
        out.append("")
        for r in by_type[t]:
            status = f" [{r['status']}]" if r["status"] else ""
            out.append(f"- [`{r['path']}`]({r['path']}): {r['title']}{status}")
        out.append("")
    return "\n".join(out).rstrip() + "\n"


def cmd_generate(root):
    content = render(collect(root))
    with open(os.path.join(root, INDEX_FILE), "w", encoding="utf-8") as fh:
        fh.write(content)
    print(f"wrote {INDEX_FILE}")
    return 0


def cmd_check(root, strict):
    rows = collect(root)
    findings = []
    # membership
    try:
        with open(os.path.join(root, INDEX_FILE), "r", encoding="utf-8") as fh:
            index_text = fh.read()
    except OSError:
        findings.append(f"{INDEX_FILE} is missing")
        index_text = ""
    for r in rows:
        if f"]({r['path']})" not in index_text:
            findings.append(f"not indexed: {r['path']}")
    for line in index_text.splitlines():
        if line.startswith("- [`"):
            try:
                p = line.split("](", 1)[1].split(")", 1)[0]
            except IndexError:
                continue
            if not os.path.exists(os.path.join(root, p)):
                findings.append(f"index entry does not resolve: {p}")
    # frontmatter validity
    for r in rows:
        if not r["has_fm"]:
            findings.append(f"missing frontmatter: {r['path']}")
        elif r["type"] not in VALID_TYPES:
            findings.append(f"invalid type '{r['type']}': {r['path']}")
    # INV-1 within repo
    topic_owners = {}
    for r in rows:
        for t in r["canonical_topics"]:
            topic_owners.setdefault(t, []).append(r["path"])
    for t, owners in topic_owners.items():
        if len(owners) > 1:
            findings.append(f"INV-1 collision: topic '{t}' claimed by "
                            + ", ".join(owners))
    if findings:
        print("Documentation findings:")
        for f in findings:
            print(f"  - {f}")
        if strict:
            return 1
        print("(advisory; not failing the build)")
    else:
        print("documentation checks OK")
    return 0


def main(argv):
    if len(argv) < 2 or argv[1] not in ("generate", "fill", "check"):
        print(__doc__)
        return 2
    args = argv[2:]
    strict = "--strict" in args
    args = [a for a in args if a != "--strict"]
    root = os.path.abspath(args[0] if args else ".")
    if argv[1] == "generate":
        return cmd_generate(root)
    if argv[1] == "fill":
        return cmd_fill(root)
    return cmd_check(root, strict)


if __name__ == "__main__":
    sys.exit(main(sys.argv))
