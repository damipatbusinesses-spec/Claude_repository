#!/bin/sh
# Jedno polecenie: obraz → zdarzenia → dźwięk → miks i mastering → jak-dziala-ai.mp4
set -e
LIB=${LIB:-/root/lemo-opuscar}
HERE=$(cd "$(dirname "$0")" && pwd)
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "ustaw LIB na folder biblioteki Lemo-Opuscar"; exit 1; }
# ffmpeg 7+ jest wymagany; tutaj lokalna kopia ffmpeg 9 (z PyPI imageio-ffmpeg), jeśli systemowy jest starszy
[ -x "$HOME/.local/opt/ffmpeg9/bin/ffmpeg" ] && PATH="$HOME/.local/opt/ffmpeg9/bin:$PATH" && export PATH
cd "$LIB"
node core/render/events.mjs "$HERE"
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --out "$HERE/out/video.mp4"
"$LIB/.venv/bin/python" "$HERE/mix.py"
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/jak-dziala-ai.mp4" 24 0
"$LIB/.venv/bin/python" core/render/srt.py "$HERE/cues.json" "$HERE/subtitles_pl.srt"
node core/render/still.mjs "$HERE" 9.9 --out "$HERE/out/poster" >/dev/null
cp "$HERE/out/poster/t_9.9.jpg" "$HERE/poster.jpg"
