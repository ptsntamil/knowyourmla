#!/bin/bash
set -e

# Configuration
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend"
PACKAGE_DIR="$PROJECT_ROOT/infra/package"

echo "🚀 Preparing Lambda package in $PACKAGE_DIR..."

# 1. Clean previous build
rm -rf "$PACKAGE_DIR"
mkdir -p "$PACKAGE_DIR"

# 2. Copy source code
echo "📦 Copying source code..."
cp -r "$BACKEND_DIR/app" "$PACKAGE_DIR/"
cp "$BACKEND_DIR/main.py" "$PACKAGE_DIR/"
cp "$BACKEND_DIR/requirements-lambda.txt" "$PACKAGE_DIR/"

# 3. Install dependencies for Linux x86_64
echo "📥 Installing Linux-compatible dependencies..."
"$BACKEND_DIR/venv/bin/pip" install \
    --platform manylinux2014_x86_64 \
    --target "$PACKAGE_DIR" \
    --python-version 3.13 \
    --only-binary=:all: \
    -r "$PACKAGE_DIR/requirements-lambda.txt"

# 4. Cleanup unnecessary files to keep zip small
echo "🧹 Cleaning up package..."
find "$PACKAGE_DIR" -type d -name "__pycache__" -exec rm -rf {} +
rm -rf "$PACKAGE_DIR/*.dist-info"
rm -rf "$PACKAGE_DIR/bin"

echo "✅ Package ready in $PACKAGE_DIR"
