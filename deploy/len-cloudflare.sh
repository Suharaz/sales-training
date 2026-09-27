#!/usr/bin/env bash
# Tạo link công khai tạm (quick tunnel Cloudflare) trỏ vào app local cổng 3020.
# Dùng: ./deploy/len-cloudflare.sh  → in link https://xxx.trycloudflare.com ; log ở deploy/*.log ; dừng: ./deploy/dung.sh
set -euo pipefail
cd "$(dirname "$0")/.."
PORT=3020
mkdir -p deploy
if ! command -v cloudflared >/dev/null; then echo "Thiếu cloudflared: brew install cloudflared"; exit 1; fi
if ! curl -sf "http://localhost:$PORT/api/suc-khoe" >/dev/null 2>&1; then
  echo "▶ Khởi động app production ở cổng $PORT…"
  [ -d .next ] || pnpm build
  nohup pnpm start > deploy/app.log 2>&1 &
  echo $! > deploy/app.pid
  for i in $(seq 1 40); do curl -sf "http://localhost:$PORT/api/suc-khoe" >/dev/null 2>&1 && break; sleep 1; done
fi
if [ -f deploy/tunnel.pid ] && kill -0 "$(cat deploy/tunnel.pid)" 2>/dev/null; then kill "$(cat deploy/tunnel.pid)" || true; fi
nohup cloudflared tunnel --url "http://localhost:$PORT" --no-autoupdate > deploy/tunnel.log 2>&1 &
echo $! > deploy/tunnel.pid
for i in $(seq 1 30); do
  URL=$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' deploy/tunnel.log | head -1 || true)
  [ -n "$URL" ] && break; sleep 1
done
if [ -z "${URL:-}" ]; then echo "Không lấy được link tunnel, xem deploy/tunnel.log"; exit 1; fi
echo "$URL" > deploy/tunnel-url.txt
echo "✅ Link công khai: $URL"
