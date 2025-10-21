#!/bin/bash
# Minimal 1x1 transparent PNG in base64
MINIMAL_PNG="iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

echo "$MINIMAL_PNG" | base64 -d > icon.png
echo "$MINIMAL_PNG" | base64 -d > adaptive-icon.png
echo "$MINIMAL_PNG" | base64 -d > splash-icon.png
echo "$MINIMAL_PNG" | base64 -d > favicon.png

ls -lah *.png
file *.png
