#!/bin/bash

# Proma Icon Generation Script
# Generates all required icon formats from icon.svg
# Requires: rsvg-convert, iconutil (macOS), ImageMagick (convert)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🎨 Generating Proma icons..."

# Check required tools
if ! command -v rsvg-convert &> /dev/null; then
    echo "❌ rsvg-convert not found. Install with: brew install librsvg"
    exit 1
fi

if ! command -v convert &> /dev/null; then
    echo "❌ ImageMagick not found. Install with: brew install imagemagick"
    exit 1
fi

if ! command -v iconutil &> /dev/null; then
    echo "⚠️  iconutil not found (macOS only). Skipping .icns generation"
fi

# 1. Generate icon.png (1024x1024) from SVG
echo "📦 Generating icon.png (1024x1024)..."
rsvg-convert -w 1024 -h 1024 icon.svg -o icon.png

# 2. Generate menubar icons (high resolution for Retina displays)
echo "📦 Generating menubar icons..."

# Generate at smaller size for better menubar fit
# 22x22 for @2x Retina (displays as 11x11 points) - matches standard menubar icon size
MENUBAR_SIZE=22
MENUBAR_SVG="proma-logos/menubar-icon-template.svg"

if [ ! -f "$MENUBAR_SVG" ]; then
  echo "⚠️  Menubar template not found, skipping menubar icon generation"
else
  # Generate white version from template (transparent bg + white stripes with rounded edges)
  # macOS Template Image mode will auto-invert for light/dark menubar
  rsvg-convert -w $MENUBAR_SIZE -h $MENUBAR_SIZE "$MENUBAR_SVG" -o proma-logos/proma_logo_white.png

  # For non-macOS or fallback, also create a black version
  # by converting the white version
  magick proma-logos/proma_logo_white.png \
    -negate \
    proma-logos/proma_logo_black.png

  echo "✅ Menubar icons generated:"
  echo "   - proma-logos/proma_logo_white.png (${MENUBAR_SIZE}x${MENUBAR_SIZE} @2x)"
  echo "   - proma-logos/proma_logo_black.png (${MENUBAR_SIZE}x${MENUBAR_SIZE} @2x)"
fi

# 3. Generate .icns (macOS app icon)
if command -v iconutil &> /dev/null; then
    echo "📦 Generating icon.icns..."

    # Create iconset directory
    mkdir -p icon.iconset

    # Generate all required sizes for macOS
    # Standard resolutions
    sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png      > /dev/null 2>&1
    sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png   > /dev/null 2>&1
    sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png      > /dev/null 2>&1
    sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png   > /dev/null 2>&1
    sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png    > /dev/null 2>&1
    sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png > /dev/null 2>&1
    sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png    > /dev/null 2>&1
    sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png > /dev/null 2>&1
    sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png    > /dev/null 2>&1
    sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png > /dev/null 2>&1

    # Convert to .icns
    iconutil -c icns icon.iconset -o icon.icns

    # Clean up
    rm -rf icon.iconset

    echo "✅ icon.icns generated"
else
    echo "⚠️  Skipping .icns generation (iconutil not available)"
fi

# 4. Generate .ico (Windows app icon)
echo "📦 Generating icon.ico..."
convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico
echo "✅ icon.ico generated"

echo ""
echo "✅ All icons generated successfully!"
echo ""
echo "Generated files:"
echo "  - icon.png (1024x1024) - Linux & macOS Dock"
echo "  - icon.icns - macOS app icon"
echo "  - icon.ico - Windows app icon"
echo "  - proma-logos/proma_logo_white.png - Menubar (dark theme)"
echo "  - proma-logos/proma_logo_black.png - Menubar (light theme)"
