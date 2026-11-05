#!/bin/bash
# Build the Claude plugin zip from the plugin/ folder.
# Output: payit2-campaign-assistant.zip in the repo root.
#
# Usage:
#   ./build-plugin.sh
#
# The plugin/ folder is the source of truth for uploadable content.
# Edit files in plugin/ directly, then run this script to rebuild the zip.

set -e

cd "$(dirname "$0")"

ZIP_NAME="payit2-campaign-assistant.zip"

# Remove old zip
rm -f "$ZIP_NAME"

# Build new zip from plugin/ contents (zip the inner files, not the plugin/ folder itself)
cd plugin
zip -r "../$ZIP_NAME" . -x "*.DS_Store" -x "__MACOSX/*"
cd ..

echo ""
echo "Built $ZIP_NAME ($(du -h "$ZIP_NAME" | cut -f1))"
echo "To try it in the Claude desktop app or claude.ai: Customize > Plugins > Add > Upload plugin"
