#!/bin/bash

# Rename all files - remove prefixes

cd ~/Projects/SEO-AI-PLATFORM  # Змінюй на свій шлях!

# API files
cd apps/api
find . -name 'apps-api-*' -type f | while read file; do
    newname=$(echo "$file" | sed 's|apps-api-src-auth-||' | sed 's|apps-api-src-prisma-||' | sed 's|apps-api-src-||' | sed 's|apps-api-||')
    mv "$file" "$newname"
    echo "Renamed: $file → $newname"
done

# Web files
cd ../web
find . -name 'apps-web-*' -type f | while read file; do
    newname=$(echo "$file" | sed 's|apps-web-src-app-||' | sed 's|apps-web-src-components-ui-||' | sed 's|apps-web-src-components-||' | sed 's|apps-web-src-lib-||' | sed 's|apps-web-||')
    mv "$file" "$newname"
    echo "Renamed: $file → $newname"
done

# DB files
cd ../../packages/db
find . -name 'packages-db-*' -type f | while read file; do
    newname=$(echo "$file" | sed 's|packages-db-||')
    mv "$file" "$newname"
    echo "Renamed: $file → $newname"
done

echo "✅ Done! All files renamed."