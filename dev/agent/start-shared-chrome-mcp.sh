#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
BROWSER_URL="${SHARED_CHROME_BROWSER_URL:-http://127.0.0.1:9222}"
START_TMUX_SCRIPT="${REPO_ROOT}/dev/agent/start-shared-chrome-tmux.sh"

if [[ ! -x "${START_TMUX_SCRIPT}" ]]; then
  echo "Missing shared Chrome tmux launcher: ${START_TMUX_SCRIPT}" >&2
  exit 1
fi

"${START_TMUX_SCRIPT}" >/dev/null

exec npx -y chrome-devtools-mcp@latest \
  --browser-url="${BROWSER_URL}"
