#!/bin/bash
# Cloudflare Tunnel setup for Maestro
# Run after: cloudflared tunnel login

set -e

TUNNEL_NAME="maestro"
HOSTNAME="maestro.melhor.dev"

echo "=== Cloudflare Tunnel Setup ==="

# Create tunnel
cloudflared tunnel create $TUNNEL_NAME 2>/dev/null || echo "Tunnel already exists"

# Get tunnel ID
TUNNEL_ID=$(cloudflared tunnel list | grep $TUNNEL_NAME | awk '{print $1}')
echo "Tunnel ID: $TUNNEL_ID"

# Create config
mkdir -p ~/.cloudflared
cat > ~/.cloudflared/config.yml << EOF
tunnel: $TUNNEL_ID
credentials-file: $HOME/.cloudflared/$TUNNEL_ID.json

ingress:
  - hostname: $HOSTNAME
    service: http://localhost:3000
  - service: http_status:404
EOF

echo "Config written to ~/.cloudflared/config.yml"

# Route DNS
cloudflared tunnel route dns $TUNNEL_NAME $HOSTNAME 2>/dev/null || echo "DNS route already exists"

echo ""
echo "=== Tunnel ready ==="
echo "Start with: cloudflared tunnel run $TUNNEL_NAME"
echo "Or install as service: cloudflared service install"
