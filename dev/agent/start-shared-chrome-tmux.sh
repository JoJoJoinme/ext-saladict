#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
RUNTIME_DIR="${REPO_ROOT}/dev/agent/.runtime"
RUNTIME_FILE="${SHARED_CHROME_TMUX_RUNTIME_FILE:-${RUNTIME_DIR}/shared-chrome-tmux.json}"
PANE_LOG_FILE="${SHARED_CHROME_TMUX_LOG_FILE:-${RUNTIME_DIR}/shared-chrome-tmux-pane.log}"
SESSION_NAME="${SHARED_CHROME_TMUX_SESSION:-ext-saladict-shared-chrome}"
WINDOW_NAME="${SHARED_CHROME_TMUX_WINDOW:-browser}"
HOST="${SHARED_CHROME_HOST:-127.0.0.1}"
PORT="${SHARED_CHROME_PORT:-9222}"
WAIT_TIMEOUT_SECS="${SHARED_CHROME_WAIT_TIMEOUT_SECS:-20}"
STABLE_RECHECK_SECS="${SHARED_CHROME_STABLE_RECHECK_SECS:-2}"
HEADLESS="${SHARED_CHROME_HEADLESS:-1}"
FOREGROUND_SCRIPT="${REPO_ROOT}/dev/agent/run-shared-chrome-foreground.sh"

cleanup_stale_profile_lock() {
  local profile_dir="${REPO_ROOT}/dev/agent/.runtime/chrome-profile-foreground"
  local lock_names=("SingletonLock" "SingletonSocket" "SingletonCookie")

  local name
  for name in "${lock_names[@]}"; do
    local target="${profile_dir}/${name}"
    if [[ -e "${target}" ]]; then
      rm -rf "${target}" 2>/dev/null || true
    fi
  done
}

write_runtime_file() {
  local pane_id="$1"
  mkdir -p "${RUNTIME_DIR}"
  cat > "${RUNTIME_FILE}" <<EOF
{
  "sessionName": "${SESSION_NAME}",
  "windowName": "${WINDOW_NAME}",
  "paneId": "${pane_id}",
  "host": "${HOST}",
  "port": ${PORT},
  "browserUrl": "http://${HOST}:${PORT}",
  "mode": $(if [[ "${HEADLESS}" == "1" ]]; then echo "\"headless\""; else echo "\"headful\""; fi),
  "foregroundScript": "${FOREGROUND_SCRIPT}"
}
EOF
}

wait_for_browser() {
  local version_url="http://${HOST}:${PORT}/json/version"
  local waited=0

  while (( waited < WAIT_TIMEOUT_SECS )); do
    if curl -fsS "${version_url}" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    waited=$((waited + 1))
  done

  return 1
}

if ! command -v tmux >/dev/null 2>&1; then
  echo "tmux is not installed" >&2
  exit 1
fi

if [[ ! -x "${FOREGROUND_SCRIPT}" ]]; then
  echo "Foreground browser script is missing or not executable: ${FOREGROUND_SCRIPT}" >&2
  exit 1
fi

if tmux has-session -t "${SESSION_NAME}" 2>/dev/null; then
  if wait_for_browser; then
    pane_id="$(tmux list-panes -t "${SESSION_NAME}:${WINDOW_NAME}" -F '#{pane_id}' 2>/dev/null | head -n 1 || true)"
    write_runtime_file "${pane_id}"
    echo "Reusing existing tmux session ${SESSION_NAME}"
    echo "Browser URL: http://${HOST}:${PORT}"
    exit 0
  fi

  tmux kill-session -t "${SESSION_NAME}" || true
fi

mkdir -p "${RUNTIME_DIR}"
touch "${PANE_LOG_FILE}"
cleanup_stale_profile_lock

tmux new-session -d -s "${SESSION_NAME}" -n "${WINDOW_NAME}" "cd '${REPO_ROOT}' && SHARED_CHROME_HEADLESS='${HEADLESS}' '${FOREGROUND_SCRIPT}'"
tmux set-window-option -t "${SESSION_NAME}:${WINDOW_NAME}" remain-on-exit on >/dev/null
pane_id="$(tmux list-panes -t "${SESSION_NAME}:${WINDOW_NAME}" -F '#{pane_id}' | head -n 1)"
tmux pipe-pane -o -t "${pane_id}" "cat >> '${PANE_LOG_FILE}'"

if ! wait_for_browser; then
  echo "Shared Chrome tmux session started, but DevTools endpoint was not reachable in time." >&2
  echo "Inspect with: tmux capture-pane -pt ${SESSION_NAME}:${WINDOW_NAME}" >&2
  exit 1
fi

sleep "${STABLE_RECHECK_SECS}"

if ! tmux has-session -t "${SESSION_NAME}" 2>/dev/null || ! wait_for_browser; then
  echo "Shared Chrome tmux session did not remain stable after startup." >&2
  echo "Inspect with: tmux capture-pane -pt ${SESSION_NAME}:${WINDOW_NAME}" >&2
  echo "Pane log: ${PANE_LOG_FILE}" >&2
  exit 1
fi

write_runtime_file "${pane_id}"

cat <<EOF
Shared Chrome tmux session is ready.

Session:
  ${SESSION_NAME}

Pane:
  ${pane_id}

Browser URL:
  http://${HOST}:${PORT}

Runtime registry:
  ${RUNTIME_FILE}
EOF
