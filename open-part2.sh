#!/bin/bash
# Serve the Part 2 deck the same way Vercel does (from /public).
cd "$(dirname "$0")"
PORT="${PORT:-4173}"
echo "Part 2 slides: http://127.0.0.1:${PORT}/Leading-DevRel-at-Nimble.html"
echo "(or http://127.0.0.1:${PORT}/part2 after next dev)"
if command -v python3 >/dev/null 2>&1; then
  python3 -m http.server "$PORT" --directory public
else
  open public/Leading-DevRel-at-Nimble.html
fi
