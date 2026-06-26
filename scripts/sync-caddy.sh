#!/usr/bin/env bash
# Idempotently merge deploy/Caddyfile into the host Caddyfile, then reload Caddy.
# Run on the VPS from the app directory (or via scripts/deploy.sh).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SNIPPET_FILE="${ROOT_DIR}/deploy/Caddyfile"
CADDYFILE="${CADDYFILE:-/etc/caddy/Caddyfile}"
MARKER_BEGIN="# BEGIN opendatacompare"
MARKER_END="# END opendatacompare"

if [[ ! -f "$SNIPPET_FILE" ]]; then
  echo "Missing snippet: $SNIPPET_FILE" >&2
  exit 1
fi

python3 - "$SNIPPET_FILE" "$CADDYFILE" "$MARKER_BEGIN" "$MARKER_END" <<'PY'
import pathlib
import re
import sys

snippet_path, caddy_path, begin, end = sys.argv[1:5]
snippet = pathlib.Path(snippet_path).read_text().strip() + "\n"
target = pathlib.Path(caddy_path)
text = target.read_text()
pattern = re.compile(
    rf"{re.escape(begin)}.*?{re.escape(end)}\n?",
    re.DOTALL,
)
legacy = re.compile(
    r"# opendatacompare\.com.*?\n\}\n",
    re.DOTALL,
)

if pattern.search(text):
    updated = pattern.sub(snippet, text)
elif legacy.search(text):
    updated = legacy.sub(snippet, text)
else:
    updated = text.rstrip() + "\n\n" + snippet

tmp = pathlib.Path("/tmp/opendatacompare-Caddyfile")
tmp.write_text(updated)
print(f"Wrote merged config to {tmp}")
PY

sudo cp /tmp/opendatacompare-Caddyfile "$CADDYFILE"
sudo caddy validate --config "$CADDYFILE"
sudo systemctl reload caddy
echo "Caddy reloaded."
