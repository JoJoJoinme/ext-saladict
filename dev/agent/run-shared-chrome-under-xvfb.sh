#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 2 ]]; then
  echo "Usage: $0 <log-file> <browser> [args...]" >&2
  exit 1
fi

LOG_FILE="$1"
shift 1

find_display() {
  local n
  for n in $(seq 99 120); do
    if [[ ! -e "/tmp/.X${n}-lock" ]]; then
      printf ':%s\n' "${n}"
      return 0
    fi
  done

  return 1
}

cleanup() {
  if [[ -n "${BROWSER_PID:-}" ]] && kill -0 "${BROWSER_PID}" 2>/dev/null; then
    kill "${BROWSER_PID}" 2>/dev/null || true
    wait "${BROWSER_PID}" 2>/dev/null || true
  fi

  if [[ -n "${XVFB_PID:-}" ]] && kill -0 "${XVFB_PID}" 2>/dev/null; then
    kill "${XVFB_PID}" 2>/dev/null || true
    wait "${XVFB_PID}" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

DISPLAY_VALUE="$(find_display)" || {
  echo "Unable to find a free Xvfb display" >&2
  exit 1
}

Xvfb "${DISPLAY_VALUE}" -screen 0 1920x1080x24 >> "${LOG_FILE}" 2>&1 &
XVFB_PID="$!"
sleep 1

if ! kill -0 "${XVFB_PID}" 2>/dev/null; then
  echo "Xvfb failed to start on ${DISPLAY_VALUE}" >&2
  exit 1
fi

export DISPLAY="${DISPLAY_VALUE}"

"$@" >> "${LOG_FILE}" 2>&1 &
BROWSER_PID="$!"

if ! kill -0 "${BROWSER_PID}" 2>/dev/null; then
  echo "Chrome launcher exited immediately" >&2
  exit 1
fi

# Keep Xvfb alive until the launcher process is explicitly stopped.
# Chrome itself may daemonize and detach from the original launcher PID, so this
# helper must not treat launcher exit as browser death.
while true; do
  sleep 3600 &
  wait $! || true
done
