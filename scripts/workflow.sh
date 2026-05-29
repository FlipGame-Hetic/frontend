#!/usr/bin/env bash
set -euo pipefail

CHROME_APP=${CHROME_APP:-Google Chrome}
FRONT_URL=${FRONT_URL:-http://localhost:3000}
BACK_URL=${BACK_URL:-http://localhost:3001}
DMD_URL=${DMD_URL:-http://localhost:3002}

DEV_PID=""

cleanup() {
  if [[ -n "${DEV_PID}" ]] && kill -0 "${DEV_PID}" 2>/dev/null; then
    kill "${DEV_PID}" 2>/dev/null || true
    wait "${DEV_PID}" 2>/dev/null || true
  fi
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
set splitY to screenTop + ((screenBottom - screenTop) div 2)

tell application "Google Chrome"
  repeat 30 times
    set arrangedCount to 0

    repeat with chromeWindow in windows
      try
        set currentUrl to URL of active tab of chromeWindow

        if currentUrl contains "localhost:3000" then
          set bounds of chromeWindow to {screenLeft, screenTop, splitX, screenBottom}
          set arrangedCount to arrangedCount + 1
        else if currentUrl contains "localhost:3001" then
          set bounds of chromeWindow to {splitX, screenTop, screenRight, splitY}
          set arrangedCount to arrangedCount + 1
        else if currentUrl contains "localhost:3002" then
          set bounds of chromeWindow to {splitX, splitY, screenRight, screenBottom}
          set arrangedCount to arrangedCount + 1
        end if
      end try
    end repeat

    if arrangedCount >= 3 then exit repeat
    delay 0.2
  end repeat
end tell
APPLESCRIPT
}

pnpm dev &
DEV_PID=$!

if ! wait_for_url "${FRONT_URL}" ||
  ! wait_for_url "${BACK_URL}" ||
  ! wait_for_url "${DMD_URL}"; then
  exit 1
fi

open_app_window "${FRONT_URL}" &&
  open_app_window "${BACK_URL}" &&
  open_app_window "${DMD_URL}" &&
  arrange_chrome_windows

wait "${DEV_PID}"
