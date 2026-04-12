#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
PROFILE_DIR="${SHARED_CHROME_PROFILE_DIR:-${REPO_ROOT}/dev/agent/.runtime/chrome-profile-foreground}"
EXTENSION_PATH="${SHARED_CHROME_EXTENSION_PATH:-${REPO_ROOT}/dist/chrome-mv3}"
PORT="${SHARED_CHROME_PORT:-9222}"
HOST="${SHARED_CHROME_HOST:-127.0.0.1}"
PROXY_SERVER="${SHARED_CHROME_PROXY:-${BROWSER_PROXY:-${http_proxy:-${HTTP_PROXY:-http://127.0.0.1:7890}}}}"
PROXY_BYPASS="${SHARED_CHROME_PROXY_BYPASS:-127.0.0.1;localhost}"
START_URL="${SHARED_CHROME_START_URL:-about:blank}"
HEADLESS="${SHARED_CHROME_HEADLESS:-1}"

find_browser_path() {
  if [[ -n "${BROWSER_PATH:-}" && -x "${BROWSER_PATH}" ]]; then
    printf '%s\n' "${BROWSER_PATH}"
    return 0
  fi

  local candidates=(
    "/root/.cache/ms-playwright/chromium-1208/chrome-linux64/chrome"
    "/usr/bin/google-chrome"
    "/usr/bin/google-chrome-stable"
    "/usr/bin/chromium-browser"
    "/usr/bin/chromium"
  )

  local candidate
  for candidate in "${candidates[@]}"; do
    if [[ -x "${candidate}" ]]; then
      printf '%s\n' "${candidate}"
      return 0
    fi
  done

  return 1
}

if [[ ! -f "${EXTENSION_PATH}/manifest.json" ]]; then
  echo "Extension build not found at ${EXTENSION_PATH}" >&2
  echo "Run: npm run build" >&2
  exit 1
fi

BROWSER_PATH_RESOLVED="$(find_browser_path)" || {
  echo "Could not find a Chrome/Chromium binary." >&2
  exit 1
}

mkdir -p "${PROFILE_DIR}"

chrome_cmd=(
  "${BROWSER_PATH_RESOLVED}"
  "--remote-debugging-address=${HOST}"
  "--remote-debugging-port=${PORT}"
  "--user-data-dir=${PROFILE_DIR}"
  "--disable-extensions-except=${EXTENSION_PATH}"
  "--load-extension=${EXTENSION_PATH}"
  "--proxy-server=${PROXY_SERVER}"
  "--proxy-bypass-list=${PROXY_BYPASS}"
  "--no-first-run"
  "--no-default-browser-check"
  "--disable-background-timer-throttling"
  "--disable-backgrounding-occluded-windows"
  "--disable-renderer-backgrounding"
  "--disable-dev-shm-usage"
  "--disable-gpu"
  "--no-sandbox"
  "${START_URL}"
)

if [[ "${HEADLESS}" == "1" ]]; then
  chrome_cmd=(
    "${BROWSER_PATH_RESOLVED}"
    "--headless=new"
    "--remote-debugging-address=${HOST}"
    "--remote-debugging-port=${PORT}"
    "--user-data-dir=${PROFILE_DIR}"
    "--disable-extensions-except=${EXTENSION_PATH}"
    "--load-extension=${EXTENSION_PATH}"
    "--proxy-server=${PROXY_SERVER}"
    "--proxy-bypass-list=${PROXY_BYPASS}"
    "--no-first-run"
    "--no-default-browser-check"
    "--disable-background-timer-throttling"
    "--disable-backgrounding-occluded-windows"
    "--disable-renderer-backgrounding"
    "--disable-dev-shm-usage"
    "--disable-gpu"
    "--no-sandbox"
    "${START_URL}"
  )
fi

cat <<EOF
Launching shared Chrome in foreground.

Browser URL:
  http://${HOST}:${PORT}

Profile:
  ${PROFILE_DIR}

Extension:
  ${EXTENSION_PATH}

Mode:
  $(if [[ "${HEADLESS}" == "1" ]]; then echo headless; else echo headful; fi)

Run this in a dedicated tmux pane/session if you want it to stay available.
EOF

exec "${chrome_cmd[@]}"
