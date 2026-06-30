#!/usr/bin/env bash
set -euo pipefail

export VITE_ENVIRONMENT=${VITE_ENVIRONMENT:-production-browser}
CHROME_APP=${CHROME_APP:-Google Chrome}
FRONT_URL=${FRONT_URL:-http://localhost:3000}
BACK_URL=${BACK_URL:-http://localhost:3001}
DMD_URL=${DMD_URL:-http://localhost:3002}
BROWSER_RETRIES=${BROWSER_RETRIES:-3}
BROWSER_RETRY_DELAY=${BROWSER_RETRY_DELAY:-0.5}

PREVIEW_PIDS=()

cleanup() {
  for pid in "${PREVIEW_PIDS[@]+"${PREVIEW_PIDS[@]}"}"; do
    if kill -0 "${pid}" 2>/dev/null; then
      kill "${pid}" 2>/dev/null || true
      wait "${pid}" 2>/dev/null || true
    fi
  done
}

trap cleanup INT TERM EXIT

wait_for_url() {
  local url=$1
  local attempts=${2:-120}

  printf "Waiting for %s" "${url}"
  until curl --silent --fail --output /dev/null "${url}"; do
    attempts=$((attempts - 1))
    if [[ "${attempts}" -le 0 ]]; then
      printf "\nTimed out waiting for %s\n" "${url}" >&2
      return 1
    fi

    printf "."
    sleep 0.5
  done
  printf " ready\n"
}

open_app_window() {
  local url=$1
  open -na "${CHROME_APP}" --args --app="${url}"
}

open_and_arrange_with_retry() {
  local attempt=1

  printf "Opening Chrome windows\n"
  open_app_window "${FRONT_URL}"
  open_app_window "${BACK_URL}"
  open_app_window "${DMD_URL}"

  while [[ "${attempt}" -le "${BROWSER_RETRIES}" ]]; do
    printf "Arranging Chrome windows (attempt %s/%s)\n" "${attempt}" "${BROWSER_RETRIES}"

    if arrange_chrome_windows; then
      printf "Chrome windows ready\n"
      return 0
    fi

    if [[ "${attempt}" -lt "${BROWSER_RETRIES}" ]]; then
      printf "Warning: Chrome windows not ready yet, retrying arrangement in %ss\n" "${BROWSER_RETRY_DELAY}" >&2
      sleep "${BROWSER_RETRY_DELAY}"
    fi

    attempt=$((attempt + 1))
  done

  printf "Warning: Chrome automation failed after %s attempts. Preview servers remain running.\n" "${BROWSER_RETRIES}" >&2
  return 1
}

arrange_chrome_windows() {
  osascript <<'APPLESCRIPT'
tell application "Finder"
  set desktopBounds to bounds of window of desktop
end tell

set screenLeft to item 1 of desktopBounds
set screenTop to item 2 of desktopBounds
set screenRight to item 3 of desktopBounds
set screenBottom to item 4 of desktopBounds
set splitX to screenLeft + ((screenRight - screenLeft) div 2)

tell application "Google Chrome"
  set finalArrangedCount to 0
  repeat 75 times
    set arrangedCount to 0
    set frontWindowRef to missing value
    set backWindowRef to missing value
    set dmdWindowRef to missing value

    repeat with chromeWindow in windows
      try
        set currentUrl to URL of active tab of chromeWindow

        if currentUrl contains "localhost:3000" then
          set frontWindowRef to chromeWindow
        else if currentUrl contains "localhost:3001" then
          set backWindowRef to chromeWindow
        else if currentUrl contains "localhost:3002" then
          set dmdWindowRef to chromeWindow
        end if
      end try
    end repeat

    if frontWindowRef is not missing value and backWindowRef is not missing value and dmdWindowRef is not missing value then
      set bounds of frontWindowRef to {screenLeft, screenTop, splitX, screenBottom}

      set frontBounds to bounds of frontWindowRef
      set effectiveTop to item 2 of frontBounds
      set effectiveBottom to item 4 of frontBounds
      set effectiveHeight to effectiveBottom - effectiveTop
      set rightWindowHeight to effectiveHeight div 2
      set rightTopBottom to effectiveTop + rightWindowHeight

      set bounds of backWindowRef to {splitX, effectiveTop, screenRight, rightTopBottom}
      set bounds of dmdWindowRef to {splitX, rightTopBottom, screenRight, effectiveBottom}
      set arrangedCount to 3
    end if

    set finalArrangedCount to arrangedCount
    if arrangedCount >= 3 then exit repeat
    delay 0.2
  end repeat

  if finalArrangedCount < 3 then
    error "Unable to arrange all localhost windows"
  end if
end tell
APPLESCRIPT
}

start_preview() {
  local package_name=$1
  local port=$2

  pnpm --filter "${package_name}" exec vite preview --host 127.0.0.1 --port "${port}" --strictPort &
  PREVIEW_PIDS+=("$!")
}

if [[ -n "${VITE_ENVIRONMENT:-}" ]]; then
  printf "Building screens with shell VITE_ENVIRONMENT=%s\n" "${VITE_ENVIRONMENT}"
else
  printf "Building screens with Vite env files\n"
fi
pnpm build

start_preview "@frontend/front-screen" 3000
start_preview "@frontend/back-screen" 3001
start_preview "@frontend/dmd-screen" 3002

if ! wait_for_url "${FRONT_URL}" ||
  ! wait_for_url "${BACK_URL}" ||
  ! wait_for_url "${DMD_URL}"; then
  exit 1
fi

if ! open_and_arrange_with_retry; then
  :
fi

wait
