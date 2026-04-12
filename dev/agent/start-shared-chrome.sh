#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
RUNTIME_DIR="${REPO_ROOT}/dev/agent/.runtime"
XVFB_HELPER="${REPO_ROOT}/dev/agent/run-shared-chrome-under-xvfb.sh"
PROFILE_DIR="${SHARED_CHROME_PROFILE_DIR:-${RUNTIME_DIR}/chrome-profile}"
RUNTIME_FILE="${SHARED_CHROME_RUNTIME_FILE:-${RUNTIME_DIR}/shared-chrome.json}"
EXTENSION_PATH="${SHARED_CHROME_EXTENSION_PATH:-${REPO_ROOT}/dist/chrome-mv3}"
PORT="${SHARED_CHROME_PORT:-9222}"
HOST="${SHARED_CHROME_HOST:-127.0.0.1}"
PROXY_SERVER="${SHARED_CHROME_PROXY:-${BROWSER_PROXY:-${http_proxy:-${HTTP_PROXY:-http://127.0.0.1:7890}}}}"
PROXY_BYPASS="${SHARED_CHROME_PROXY_BYPASS:-127.0.0.1;localhost}"
START_URL="${SHARED_CHROME_START_URL:-about:blank}"
LOG_FILE="${SHARED_CHROME_LOG_FILE:-${RUNTIME_DIR}/shared-chrome.log}"
WAIT_TIMEOUT_SECS="${SHARED_CHROME_WAIT_TIMEOUT_SECS:-20}"
USE_XVFB="${SHARED_CHROME_USE_XVFB:-1}"
HEADLESS="${SHARED_CHROME_HEADLESS:-0}"

find_browser_path() {
  if [[ -n "${BROWSER_PATH:-}" && -x "${BROWSER_PATH}" ]]; then
    printf '%s\n' "${BROWSER_PATH}"
    return 0
  fi

  local candidates=(
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

  local playwright_root="${HOME:-/root}/.cache/ms-playwright"
  if [[ -d "${playwright_root}" ]]; then
    candidate="$(find "${playwright_root}" -type f \( -path '*/chrome-linux64/chrome' -o -path '*/chrome-linux/chrome' \) | sort -r | head -n 1 || true)"
    if [[ -n "${candidate}" && -x "${candidate}" ]]; then
      printf '%s\n' "${candidate}"
      return 0
    fi
  fi

  return 1
}

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

write_runtime_file() {
  local browser_path="$1"
  local launcher_pid="$2"
  local listener_pid="$3"
  mkdir -p "${RUNTIME_DIR}"
  cat > "${RUNTIME_FILE}" <<EOF
{
  "browserPath": "${browser_path}",
  "launcherPid": ${launcher_pid},
  "listenerPid": ${listener_pid:-0},
  "host": "${HOST}",
  "port": ${PORT},
  "browserUrl": "http://${HOST}:${PORT}",
  "profileDir": "${PROFILE_DIR}",
  "extensionPath": "${EXTENSION_PATH}",
  "proxyServer": "${PROXY_SERVER}",
  "proxyBypass": "${PROXY_BYPASS}",
  "logFile": "${LOG_FILE}"
}
EOF
}

print_runtime_summary() {
  cat <<EOF
Shared Chrome runtime is ready.

Browser URL:
  http://${HOST}:${PORT}

Profile:
  ${PROFILE_DIR}

Extension:
  ${EXTENSION_PATH}

Runtime registry:
  ${RUNTIME_FILE}

Suggested MCP launch pattern:
  npx -y chrome-devtools-mcp@latest --browser-url=http://${HOST}:${PORT}
EOF
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

mkdir -p "${RUNTIME_DIR}"

if [[ -f "${RUNTIME_FILE}" ]]; then
  if wait_for_browser; then
    print_runtime_summary
    exit 0
  fi
fi

if [[ "${DRY_RUN:-0}" == "1" ]]; then
  echo "Dry run only."
  echo "Browser path: ${BROWSER_PATH_RESOLVED}"
  echo "Browser URL: http://${HOST}:${PORT}"
  echo "Profile dir: ${PROFILE_DIR}"
  echo "Extension path: ${EXTENSION_PATH}"
  echo "Runtime file: ${RUNTIME_FILE}"
  exit 0
fi

mkdir -p "${PROFILE_DIR}"
touch "${LOG_FILE}"

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

if [[ "${HEADLESS}" != "1" ]] && [[ "${USE_XVFB}" == "1" ]] && [[ -x "${XVFB_HELPER}" ]] && command -v Xvfb >/dev/null 2>&1; then
  nohup "${XVFB_HELPER}" "${LOG_FILE}" "${chrome_cmd[@]}" >> "${LOG_FILE}" 2>&1 &
else
  nohup "${chrome_cmd[@]}" >> "${LOG_FILE}" 2>&1 &
fi

LAUNCHER_PID="$!"
sleep 1

if ! wait_for_browser; then
  echo "Shared Chrome failed to start. Check ${LOG_FILE}" >&2
  exit 1
fi

LISTENER_PID="$(find_listener_pid)"
write_runtime_file "${BROWSER_PATH_RESOLVED}" "${LAUNCHER_PID}" "${LISTENER_PID}"
print_runtime_summary
