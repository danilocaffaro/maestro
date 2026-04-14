#!/bin/bash
# Maestro Deploy Setup Script for Oracle Cloud Free Tier ARM VM
# Run this on the Oracle VM to set up the environment

set -e

echo "=== Maestro Deploy Setup ==="

# 1. Install Node.js 22 LTS
if ! command -v node &> /dev/null; then
    echo "Installing Node.js 22..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
    nvm install 22
    nvm use 22
fi
echo "Node: $(node --version)"

# 2. Install Claude Code CLI
if ! command -v claude &> /dev/null; then
    echo "Installing Claude Code CLI..."
    npm install -g @anthropic-ai/claude-code
fi
echo "Claude: $(claude --version)"

# 3. Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# 4. Install Cloudflared
if ! command -v cloudflared &> /dev/null; then
    echo "Installing cloudflared..."
    ARCH=$(uname -m)
    if [ "$ARCH" = "aarch64" ]; then
        curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-arm64 -o /usr/local/bin/cloudflared
    else
        curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
    fi
    chmod +x /usr/local/bin/cloudflared
fi

# 5. Create directories
mkdir -p ~/.maestro
mkdir -p ~/maestro

echo ""
echo "=== Setup complete ==="
echo "Next steps:"
echo "  1. Copy the built app to ~/maestro/"
echo "  2. Run: cd ~/maestro && pm2 start ecosystem.config.js"
echo "  3. Setup Cloudflare tunnel: cloudflared tunnel login"
echo "  4. Run: ./deploy/tunnel-setup.sh"
