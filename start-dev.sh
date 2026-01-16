#!/bin/bash
# Start Next.js dev server and show the port

cd "$(dirname "$0")"

echo "Starting Next.js development server..."
echo ""

# Try to find node/npm
if command -v npm &> /dev/null; then
    NPM_CMD="npm"
elif [ -f "/usr/local/bin/npm" ]; then
    NPM_CMD="/usr/local/bin/npm"
elif [ -f "/opt/homebrew/bin/npm" ]; then
    NPM_CMD="/opt/homebrew/bin/npm"
else
    echo "ERROR: npm not found. Please install Node.js first."
    exit 1
fi

# Start server on port 3000 (Next.js default)
echo "Server will start on: http://localhost:3000"
echo ""
echo "If port 3000 is busy, the server will automatically use the next available port."
echo "Watch the output below for the actual port number."
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "----------------------------------------"
echo ""

$NPM_CMD run dev
