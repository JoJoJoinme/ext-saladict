#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
RUNTIME_FILE="${SHARED_CHROME_TMUX_RUNTIME_FILE:-${REPO_ROOT}/dev/agent/.runtime/shared-chrome-tmux.json}"
SESSION_NAME="${SHARED_CHROME_TMUX_SESSION:-ext-saladict-shared-chrome}"

if command -v tmux >/dev/null 2>&1; then
  if tmux has-session -t "${SESSION_NAME}" 2>/dev/null; then
    tmux kill-session -t "${SESSION_NAME}" || true
    echo "Stopped tmux session ${SESSION_NAME}"
  fi
fi

rm -f "${RUNTIME_FILE}"
