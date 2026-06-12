#!/usr/bin/env bash
# S.P.A.M.E.R Audio Normalization Pipeline
# Usage: bash scripts/audio-normalize.sh
# Requires: ffmpeg with libopus + aac + libmp3lame
# Idempotent: safe to re-run, picks the best available source extension.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$SCRIPT_DIR/.."
SOUNDS="$ROOT/apps/front-screen/public/sounds"
BACK_SOUNDS="$ROOT/apps/back-screen/public/sounds"
NAV_SOUNDS="$ROOT/sounds"

WORKDIR=$(mktemp -d /tmp/spamer_audio_XXXXXX)
trap 'rm -rf "$WORKDIR"' EXIT

_counter=0
tmp_file() { _counter=$((_counter + 1)); echo "$WORKDIR/tmp_${_counter}.$1"; }

TARGET_SHORT_RMS=-20
TARGET_LONG_LUFS=-16
TARGET_MUSIC_LUFS=-20
TARGET_TP=-1.5
SHORT_THRESHOLD=3.0

echo "=== S.P.A.M.E.R Audio Normalization ==="
echo "ffmpeg $(ffmpeg -version 2>&1 | head -1 | awk '{print $3}')"
echo ""

# ─── Helpers ──────────────────────────────────────────────────────────────────

get_duration() {
  ffprobe -v error -show_entries format=duration -of csv=p=0 "$1"
}

# Returns mean_volume in dBFS (e.g. -17.4). Falls back to 0 if undetectable.
get_mean_volume() {
  local raw
  # NF-1 = the numeric field before the trailing "dB" token
  raw=$(ffmpeg -hide_banner -nostats -i "$1" -af volumedetect -f null /dev/null 2>&1 \
    | grep mean_volume | awk '{print $(NF-1)}')
  [ -n "$raw" ] && echo "$raw" || echo "0"
}

# Short SFX: gain to target RMS + limiter → ogg + m4a
encode_sfx_short() {
  local input="$1" out_base="$2"
  local mean gain
  mean=$(get_mean_volume "$input")
  gain=$(awk "BEGIN {printf \"%.1f\", ${TARGET_SHORT_RMS} - (${mean})}")
  printf "  %-36s mean=%5sdB → gain %+.1fdB\n" "$(basename "$out_base")" "$mean" "$gain"
  local filter="volume=${gain}dB,alimiter=limit=0.891:level=false"
  local tmp_ogg tmp_m4a
  tmp_ogg=$(tmp_file ogg); tmp_m4a=$(tmp_file m4a)
  ffmpeg -y -hide_banner -loglevel warning -i "$input" -af "$filter" \
    -c:a libopus -b:a 96k "$tmp_ogg"
  ffmpeg -y -hide_banner -loglevel warning -i "$input" -af "$filter" \
    -c:a aac -b:a 128k -movflags +faststart "$tmp_m4a"
  mv "$tmp_ogg" "${out_base}.ogg"
  mv "$tmp_m4a" "${out_base}.m4a"
}

# Long SFX (> 3s): loudnorm → ogg + m4a
encode_sfx_long() {
  local input="$1" out_base="$2"
  printf "  %-36s loudnorm I=%s LUFS\n" "$(basename "$out_base")" "$TARGET_LONG_LUFS"
  local filter="loudnorm=I=${TARGET_LONG_LUFS}:TP=${TARGET_TP}:LRA=11"
  local tmp_ogg tmp_m4a
  tmp_ogg=$(tmp_file ogg); tmp_m4a=$(tmp_file m4a)
  ffmpeg -y -hide_banner -loglevel warning -i "$input" -af "$filter" \
    -c:a libopus -b:a 96k "$tmp_ogg"
  ffmpeg -y -hide_banner -loglevel warning -i "$input" -af "$filter" \
    -c:a aac -b:a 128k -movflags +faststart "$tmp_m4a"
  mv "$tmp_ogg" "${out_base}.ogg"
  mv "$tmp_m4a" "${out_base}.m4a"
}

# Auto-dispatch on duration. Accepts explicit source path.
encode_sfx() {
  local input="$1" out_base="$2"
  [ -f "$input" ] || { echo "  SKIP (not found): $input"; return; }
  local dur is_long
  dur=$(get_duration "$input")
  is_long=$(awk "BEGIN {print (${dur} > ${SHORT_THRESHOLD}) ? 1 : 0}")
  if [ "$is_long" = "1" ]; then
    encode_sfx_long "$input" "$out_base"
  else
    encode_sfx_short "$input" "$out_base"
  fi
}

# Find best existing source for a file (priority: original raw format, then m4a, then ogg)
best_src() {
  local base="$1"; shift  # base = full path without extension
  local ext
  for ext in "$@" m4a ogg; do
    [ -f "${base}.${ext}" ] && echo "${base}.${ext}" && return
  done
  echo ""
}

normalize_music() {
  local input="$1"
  [ -f "$input" ] || { echo "  SKIP: $input"; return; }
  printf "  %-36s loudnorm I=%s LUFS\n" "$(basename "$input")" "$TARGET_MUSIC_LUFS"
  local tmp; tmp=$(tmp_file mp3)
  ffmpeg -y -hide_banner -loglevel warning -i "$input" \
    -af "loudnorm=I=${TARGET_MUSIC_LUFS}:TP=${TARGET_TP}:LRA=11" \
    -c:a libmp3lame -q:a 2 "$tmp"
  mv "$tmp" "$input"
}

normalize_wav_inplace() {
  local input="$1" target="$2"
  [ -f "$input" ] || { echo "  SKIP: $input"; return; }
  local mean gain
  mean=$(get_mean_volume "$input")
  gain=$(awk "BEGIN {printf \"%.1f\", ${target} - (${mean})}")
  printf "  %-36s mean=%5sdB → gain %+.1fdB\n" "$(basename "$input")" "$mean" "$gain"
  local tmp; tmp=$(tmp_file wav)
  ffmpeg -y -hide_banner -loglevel warning -i "$input" \
    -af "volume=${gain}dB,alimiter=limit=0.891:level=false" \
    -c:a pcm_s16le "$tmp"
  mv "$tmp" "$input"
}

# ─── 1. Plunger: atempo 9.72× → ~1s then encode ──────────────────────────────
echo "[1/7] Plunger (atempo 9.72× → ~1s)"
plunger_src="$SOUNDS/plunger/launch.mp3"
if [ -f "$plunger_src" ]; then
  plunger_tmp=$(tmp_file wav)
  ffmpeg -y -hide_banner -loglevel warning -i "$plunger_src" \
    -af "atempo=2.0,atempo=2.0,atempo=2.43" "$plunger_tmp"
  encode_sfx_short "$plunger_tmp" "$SOUNDS/plunger/launch"
  rm -f "$plunger_src"
else
  # Already sped up; just re-normalize from existing m4a/ogg
  src=$(best_src "$SOUNDS/plunger/launch" m4a ogg)
  [ -n "$src" ] && encode_sfx_short "$src" "$SOUNDS/plunger/launch" \
    || echo "  SKIP plunger (no source found)"
fi
echo ""

# ─── 2. Bumpers ───────────────────────────────────────────────────────────────
echo "[2/7] Bumpers"
for i in 0 1 2; do
  src=$(best_src "$SOUNDS/bumpers/$i" m4a ogg)
  [ -n "$src" ] && encode_sfx_short "$src" "$SOUNDS/bumpers/$i" \
    || echo "  SKIP bumpers/$i"
done
echo ""

# ─── 3. Flipper joints ────────────────────────────────────────────────────────
echo "[3/7] Flipper joints"
for name in up down; do
  src=$(best_src "$SOUNDS/flipperJoints/$name" m4a ogg)
  [ -n "$src" ] && encode_sfx_short "$src" "$SOUNDS/flipperJoints/$name" \
    || echo "  SKIP flipperJoints/$name"
done
echo ""

# ─── 4. Ball ──────────────────────────────────────────────────────────────────
echo "[4/7] Ball"
src=$(best_src "$SOUNDS/ball/new" wav m4a ogg); encode_sfx "$src" "$SOUNDS/ball/new"
rm -f "$SOUNDS/ball/new.wav"
src=$(best_src "$SOUNDS/ball/lost1" mp3 m4a ogg); encode_sfx "$src" "$SOUNDS/ball/lost1"
rm -f "$SOUNDS/ball/lost1.mp3"
src=$(best_src "$SOUNDS/ball/lost2" mp3 m4a ogg); encode_sfx "$src" "$SOUNDS/ball/lost2"
rm -f "$SOUNDS/ball/lost2.mp3"
src=$(best_src "$SOUNDS/ball/ramp_rolling" m4a ogg); encode_sfx "$src" "$SOUNDS/ball/ramp_rolling"
echo ""

# ─── 5. Portal, slingshots, targets, multiball, score, ball_savers ────────────
echo "[5/7] Portal / slingshots / targets / multiball / score / ball_savers"
for name in enter1 enter2 exit1 exit2; do
  src=$(best_src "$SOUNDS/portal/$name" mp3 m4a ogg)
  encode_sfx "$src" "$SOUNDS/portal/$name"
  rm -f "$SOUNDS/portal/$name.mp3"
done
for name in hit1 hit2; do
  src=$(best_src "$SOUNDS/slingshots/$name" m4a ogg)
  encode_sfx "$src" "$SOUNDS/slingshots/$name"
  src=$(best_src "$SOUNDS/targets/$name" m4a ogg)
  encode_sfx "$src" "$SOUNDS/targets/$name"
done
src=$(best_src "$SOUNDS/multiball/multiball" m4a ogg)
encode_sfx "$src" "$SOUNDS/multiball/multiball"
for i in 0 1 2 3 4 5 6 7 8 9; do
  src=$(best_src "$SOUNDS/multiball/hit$i" m4a ogg)
  encode_sfx "$src" "$SOUNDS/multiball/hit$i"
done
src=$(best_src "$SOUNDS/score/game_over" m4a ogg)
encode_sfx "$src" "$SOUNDS/score/game_over"
src=$(best_src "$SOUNDS/ball_savers/up" wav m4a ogg)
encode_sfx "$src" "$SOUNDS/ball_savers/up"
rm -f "$SOUNDS/ball_savers/up.wav" "$SOUNDS/ball_savers/fallback_up.m4a"
echo ""

# ─── 6. Music ─────────────────────────────────────────────────────────────────
echo "[6/7] Music (loudnorm I=${TARGET_MUSIC_LUFS})"
for f in "$SOUNDS/music/"*.mp3; do
  normalize_music "$f"
done
echo ""

# ─── 7. Navigation (back-screen) ──────────────────────────────────────────────
echo "[7/7] Navigation sounds → back-screen"
if [ -d "$NAV_SOUNDS" ]; then
  normalize_wav_inplace "$NAV_SOUNDS/navigation_forward.wav"  "$TARGET_SHORT_RMS"
  normalize_wav_inplace "$NAV_SOUNDS/navigation_backward.wav" "$TARGET_SHORT_RMS"
  cp "$NAV_SOUNDS/navigation_forward.wav"  "$BACK_SOUNDS/navigation_forward.wav"
  cp "$NAV_SOUNDS/navigation_backward.wav" "$BACK_SOUNDS/navigation_backward.wav"
  rm -rf "$NAV_SOUNDS"
  echo "  moved to apps/back-screen/public/sounds/, removed root sounds/"
else
  echo "  already moved (root sounds/ does not exist)"
fi
rm -f "$BACK_SOUNDS/menu_forward.wav" "$BACK_SOUNDS/menu_backward.wav"
echo ""

echo "=== Done. Run: pnpm --filter front-screen build && pnpm --filter back-screen build ==="
