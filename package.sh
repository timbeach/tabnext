#!/bin/sh
# Build the Chrome Web Store upload zip: just the files the extension needs.
set -e
cd "$(dirname "$0")"
version=$(sed -n 's/.*"version": "\([^"]*\)".*/\1/p' manifest.json)
out="tabnext-$version.zip"
rm -f "$out"
zip -q "$out" manifest.json background.js icons/16.png icons/48.png icons/128.png
echo "$out"
