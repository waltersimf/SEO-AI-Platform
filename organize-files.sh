#!/bin/bash

# Forgeline - Організація файлів з flat structure
# Usage: bash organize-files.sh

set -e

OUTPUTS_DIR="/mnt/user-data/outputs"
PROJECT_DIR="/path/to/forgeline"  # ЗМІНИ НА СВІЙ ШЛЯХ!

echo "🚀 Починаю організацію файлів..."

# Create directory structure
mkdir -p $PROJECT_DIR/{apps/{web/{src/{app/{auth/{login,signup},dashboard},components/ui,lib}},api/{src/{auth/{dto,guards,strategies},prisma}}},packages/db}

# Root files
cp $OUTPUTS_DIR/package.json $PROJECT_DIR/
cp $OUTPUTS_DIR/pnpm-workspace.yaml $PROJECT_DIR/
cp $OUTPUTS_DIR/turbo.json $PROJECT_DIR/
cp $OUTPUTS_DIR/tsconfig.json $PROJECT_DIR/
cp $OUTPUTS_DIR/docker-compose.yml $PROJECT_DIR/
cp $OUTPUTS_DIR/.env.example $PROJECT_DIR/
cp $OUTPUTS_DIR/.gitignore $PROJECT_DIR/
cp $OUTPUTS_DIR/README.md $PROJECT_DIR/

# Web app
cp $OUTPUTS_DIR/apps-web-package.json $PROJECT_DIR/apps/web/package.json
cp $OUTPUTS_DIR/apps-web-next.config.js $PROJECT_DIR/apps/web/next.config.js
cp $OUTPUTS_DIR/apps-web-postcss.config.js $PROJECT_DIR/apps/web/postcss.config.js
cp $OUTPUTS_DIR/apps-web-tailwind.config.js $PROJECT_DIR/apps/web/tailwind.config.js
cp $OUTPUTS_DIR/apps-web-tsconfig.json $PROJECT_DIR/apps/web/tsconfig.json

# Web pages
cp $OUTPUTS_DIR/apps-web-src-app-page.tsx $PROJECT_DIR/apps/web/src/app/page.tsx
cp $OUTPUTS_DIR/apps-web-src-app-layout.tsx $PROJECT_DIR/apps/web/src/app/layout.tsx
cp $OUTPUTS_DIR/apps-web-src-app-globals.css $PROJECT_DIR/apps/web/src/app/globals.css
cp $OUTPUTS_DIR/apps-web-src-app-auth-login-page.tsx $PROJECT_DIR/apps/web/src/app/auth/login/page.tsx
cp $OUTPUTS_DIR/apps-web-src-app-auth-signup-page.tsx $PROJECT_DIR/apps/web/src/app/auth/signup/page.tsx
cp $OUTPUTS_DIR/apps-web-src-app-dashboard-page.tsx $PROJECT_DIR/apps/web/src/app/dashboard/page.tsx
cp $OUTPUTS_DIR/apps-web-src-app-dashboard-layout.tsx $PROJECT_DIR/apps/web/src/app/dashboard/layout.tsx

# Web components
cp $OUTPUTS_DIR/apps-web-src-components-sidebar.tsx $PROJECT_DIR/apps/web/src/components/sidebar.tsx
cp $OUTPUTS_DIR/apps-web-src-components-icons.tsx $PROJECT_DIR/apps/web/src/components/icons.tsx
cp $OUTPUTS_DIR/apps-web-src-components-ui-button.tsx $PROJECT_DIR/apps/web/src/components/ui/button.tsx
cp $OUTPUTS_DIR/apps-web-src-components-ui-card.tsx $PROJECT_DIR/apps/web/src/components/ui/card.tsx
cp $OUTPUTS_DIR/apps-web-src-components-ui-input.tsx $PROJECT_DIR/apps/web/src/components/ui/input.tsx
cp $OUTPUTS_DIR/apps-web-src-components-ui-label.tsx $PROJECT_DIR/apps/web/src/components/ui/label.tsx

# Web lib
cp $OUTPUTS_DIR/apps-web-src-lib-utils.ts $PROJECT_DIR/apps/web/src/lib/utils.ts

# API app
cp $OUTPUTS_DIR/apps-api-package.json $PROJECT_DIR/apps/api/package.json
cp $OUTPUTS_DIR/apps-api-nest-cli.json $PROJECT_DIR/apps/api/nest-cli.json
cp $OUTPUTS_DIR/apps-api-tsconfig.json $PROJECT_DIR/apps/api/tsconfig.json
cp $OUTPUTS_DIR/apps-api-src-main.ts $PROJECT_DIR/apps/api/src/main.ts
cp $OUTPUTS_DIR/apps-api-src-app.module.ts $PROJECT_DIR/apps/api/src/app.module.ts

# API auth
cp $OUTPUTS_DIR/apps-api-src-auth-auth.module.ts $PROJECT_DIR/apps/api/src/auth/auth.module.ts
cp $OUTPUTS_DIR/apps-api-src-auth-auth.service.ts $PROJECT_DIR/apps/api/src/auth/auth.service.ts
cp $OUTPUTS_DIR/apps-api-src-auth-auth.controller.ts $PROJECT_DIR/apps/api/src/auth/auth.controller.ts
cp $OUTPUTS_DIR/apps-api-src-auth-dto-auth.dto.ts $PROJECT_DIR/apps/api/src/auth/dto/auth.dto.ts
cp $OUTPUTS_DIR/apps-api-src-auth-guards-jwt-auth.guard.ts $PROJECT_DIR/apps/api/src/auth/guards/jwt-auth.guard.ts
cp $OUTPUTS_DIR/apps-api-src-auth-strategies-jwt.strategy.ts $PROJECT_DIR/apps/api/src/auth/strategies/jwt.strategy.ts
cp $OUTPUTS_DIR/apps-api-src-auth-strategies-local.strategy.ts $PROJECT_DIR/apps/api/src/auth/strategies/local.strategy.ts

# API prisma
cp $OUTPUTS_DIR/apps-api-src-prisma-prisma.module.ts $PROJECT_DIR/apps/api/src/prisma/prisma.module.ts
cp $OUTPUTS_DIR/apps-api-src-prisma-prisma.service.ts $PROJECT_DIR/apps/api/src/prisma/prisma.service.ts

# Packages
cp $OUTPUTS_DIR/packages-db-package.json $PROJECT_DIR/packages/db/package.json
cp $OUTPUTS_DIR/packages-db-schema.prisma $PROJECT_DIR/packages/db/schema.prisma

echo "✅ Файли організовані!"
echo "📁 Структура створена в: $PROJECT_DIR"
echo ""
echo "Наступні кроки:"
echo "1. cd $PROJECT_DIR"
echo "2. pnpm install"
echo "3. docker-compose up -d"
echo "4. cd packages/db && pnpm prisma migrate dev"
echo "5. cd ../.. && pnpm dev"