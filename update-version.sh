#!/bin/bash

# Update asset version numbers for cache busting
# This script updates ?v= parameters in HTML files with current timestamp

TIMESTAMP=$(date +%s)

echo "Updating asset versions to: $TIMESTAMP"

# Update index.html
sed -i "s/\(style\.css?v=\)[0-9]*/\1$TIMESTAMP/" index.html
sed -i "s/\(app\.js?v=\)[0-9]*/\1$TIMESTAMP/" index.html

# Update travel-guide.html
sed -i "s/\(travel-guide\.css?v=\)[0-9]*/\1$TIMESTAMP/" travel-guide.html
sed -i "s/\(travel-guide\.js?v=\)[0-9]*/\1$TIMESTAMP/" travel-guide.html

echo "✓ Version numbers updated in HTML files"
