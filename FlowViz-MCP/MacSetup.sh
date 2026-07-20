#!/bin/bash

echo ""
echo "  ============================================"
echo "   FlowViz MCP Setup"
echo "  ============================================"
echo ""

# Check Node.js is installed
if ! command -v node &> /dev/null; then
    echo "  Node.js is not installed on this machine."
    echo "  Please download and install it from: https://nodejs.org"
    echo "  Choose the LTS version, then run this file again."
    echo ""
    read -p "  Press Enter to close..."
    exit 1
fi

echo "  Node.js found. Installing dependencies..."
echo ""

cd "$(dirname "$0")"
npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "  Something went wrong during installation."
    echo "  Please check the error messages above."
    echo ""
    read -p "  Press Enter to close..."
    exit 1
fi

echo ""
echo "  Starting setup wizard..."
echo ""

npm run setup

echo ""
read -p "  Press Enter to close..."
