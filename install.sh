#!/bin/bash
set -euo pipefail

REPO="https://github.com/salimabsi/raycast-workspace-launcher.git"
DIR="${WORKSPACE_LAUNCHER_DIR:-$HOME/.raycast-extensions/workspace-launcher}"

command -v node >/dev/null || { echo "Node.js 22+ is required: https://nodejs.org"; exit 1; }
[ -d /Applications/Raycast.app ] || { echo "Raycast is required: https://raycast.com"; exit 1; }

if [ -d "$DIR/.git" ]; then
  git -C "$DIR" pull --ff-only
else
  git clone --depth 1 "$REPO" "$DIR"
fi

cd "$DIR"
npm install --no-fund --no-audit

# `ray develop` is the only way to load a non-store extension; it keeps watching
# for changes, so stop it once Raycast has imported the build.
LOG=$(mktemp)
./node_modules/.bin/ray develop --non-interactive >"$LOG" 2>&1 &
PID=$!
for _ in $(seq 1 60); do
  grep -q "built extension successfully" "$LOG" && break
  sleep 1
done
sleep 2
kill "$PID" 2>/dev/null || true

if grep -q "built extension successfully" "$LOG"; then
  echo "Installed. Open Raycast and search for “Arrange Windows”."
else
  cat "$LOG"
  echo "Install failed."
  exit 1
fi
