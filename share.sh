#!/bin/bash

# Kill any existing cloudflared tunnels to prevent port conflicts
pkill -f cloudflared

echo "Starting Backend Tunnel (Django on port 8000)..."
cloudflared tunnel --url http://localhost:8000 > backend_tunnel.log 2>&1 &

echo "Starting Frontend Tunnel (Vite on port 5173)..."
cloudflared tunnel --url http://localhost:5173 > frontend_tunnel.log 2>&1 &

echo "Waiting for Cloudflare to assign URLs..."

BACKEND_URL=""
FRONTEND_URL=""

while [ -z "$BACKEND_URL" ] || [ -z "$FRONTEND_URL" ]; do
    sleep 1
    if [ -z "$BACKEND_URL" ]; then
        BACKEND_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' backend_tunnel.log | head -n 1)
    fi
    if [ -z "$FRONTEND_URL" ]; then
        FRONTEND_URL=$(grep -o 'https://[a-zA-Z0-9-]*\.trycloudflare\.com' frontend_tunnel.log | head -n 1)
    fi
done

echo "================================================="
echo "✅ Backend API is live at: $BACKEND_URL"
echo "✅ Frontend is live at: $FRONTEND_URL"
echo "================================================="

echo "Updating frontend code to point to the new backend API..."
sed -i.bak "s|const API_BASE = '.*';|const API_BASE = '$BACKEND_URL/api';|g" tryon_frontend/src/api.js

echo "Done! The frontend will automatically reload."
echo ""
echo "📱 Share this link with your client or open it on your phone:"
echo "$FRONTEND_URL"
echo ""
echo "Press Ctrl+C to stop sharing."

# Wait indefinitely so the background tunnels stay alive until the user kills the script
wait

