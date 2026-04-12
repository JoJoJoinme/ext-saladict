#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
RUNTIME_FILE="${SHARED_CHROME_RUNTIME_FILE:-${REPO_ROOT}/dev/agent/.runtime/shared-chrome.json}"
PORT="${SHARED_CHROME_PORT:-9222}"

find_listener_pid() {
  local pid=""

  if command -v lsof >/dev/null 2>&1; then
    pid="$(lsof -tiTCP:${PORT} -sTCP:LISTEN 2>/dev/null | head -n 1 || true)"
  fi

  if [[ -z "${pid}" ]] && command -v ss >/dev/null 2>&1; then
    pid="$(ss -ltnp 2>/dev/null | sed -n "s/.*:${PORT} .*pid=\\([0-9][0-9]*\\).*/\\1/p" | head -n 1 || true)"
  fi

  printf '%s\n' "${pid}"
}

if [[ ! -f "${RUNTIME_FILE}" ]]; then
  echo "No runtime file found at ${RUNTIME_FILE}"
  exit 0
fi

LAUNCHER_PID="$(sed -n 's/.*"launcherPid":[[:space:]]*\([0-9][0-9]*\).*/\1/p' "${RUNTIME_FILE}" | head -n 1 || true)"
LISTENER_PID="$(find_listener_pid)"

if [[ -n "${LISTENER_PID}" ]] && kill -0 "${LISTENER_PID}" 2>/dev/null; then
  kill "${LISTENER_PID}" || true
  echo "Stopped shared Chrome listener pid ${LISTENER_PID}"
fi

if [[ -n "${LAUNCHER_PID}" ]] && kill -0 "${LAUNCHER_PID}" 2>/dev/null; then
  kill "${LAUNCHER_PID}" || true
  echo "Stopped shared Chrome launcher pid ${LAUNCHER_PID}"
fi

rm -f "${RUNTIME_FILE}"
