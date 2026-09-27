#!/usr/bin/env bash
# Dừng tunnel và app production đang chạy nền.
cd "$(dirname "$0")/.."
for f in deploy/tunnel.pid deploy/app.pid; do [ -f "$f" ] && kill "$(cat "$f")" 2>/dev/null && rm -f "$f"; done
echo "Đã dừng."
