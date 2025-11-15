# 📁 Організація файлів проекту

**Важливо:** Файли в `/outputs` мають "flat" структуру з префіксами.  
Потрібно організувати їх у правильну структуру монорепо.

---

## 🗂️ Mapping: Flat → Monorepo Structure

### Root Files
```bash
# Ці файли залишаються в root:
package.json              → /forgeline/package.json
pnpm-workspace.yaml       → /forgeline/pnpm-workspace.yaml
turbo.json               → /forgeline/turbo.json
tsconfig.json            → /forgeline/tsconfig.json
docker-compose.yml       → /forgeline/docker-compose.yml
.env.example             → /forgeline/.env.example
.gitignore               → /forgeline/.gitignore
README.md                → /forgeline/README.md
```

### Apps: Web (Frontend)
```bash
# Prefix: apps-web-
apps-web-package.json                     → /forgeline/apps/web/package.json
apps-web-next.config.js                   → /forgeline/apps/web/next.config.js
apps-web-postcss.config.js                → /forgeline/apps/web/postcss.config.js
apps-web-tailwind.config.js               → /forgeline/apps/web/tailwind.config.js
apps-web-tsconfig.json                    → /forgeline/apps/web/tsconfig.json

# Pages (App Router)
apps-web-src-app-page.tsx                 → /forgeline/apps/web/src/app/page.tsx
apps-web-src-app-layout.tsx               → /forgeline/apps/web/src/app/layout.tsx
apps-web-src-app-globals.css              → /forgeline/apps/web/src/app/globals.css
apps-web-src-app-auth-login-page.tsx      → /forgeline/apps/web/src/app/auth/login/page.tsx
apps-web-src-app-auth-signup-page.tsx     → /forgeline/apps/web/src/app/auth/signup/page.tsx
apps-web-src-app-dashboard-page.tsx       → /forgeline/apps/web/src/app/dashboard/page.tsx
apps-web-src-app-dashboard-layout.tsx     → /forgeline/apps/web/src/app/dashboard/layout.tsx

# Components
apps-web-src-components-sidebar.tsx       → /forgeline/apps/web/src/components/sidebar.tsx
apps-web-src-components-icons.tsx         → /forgeline/apps/web/src/components/icons.tsx
apps-web-src-components-ui-button.tsx     → /forgeline/apps/web/src/components/ui/button.tsx
apps-web-src-components-ui-card.tsx       → /forgeline/apps/web/src/components/ui/card.tsx
apps-web-src-components-ui-input.tsx      → /forgeline/apps/web/src/components/ui/input.tsx
apps-web-src-components-ui-label.tsx      → /forgeline/apps/web/src/components/ui/label.tsx

# Lib
apps-web-src-lib-utils.ts                 → /forgeline/apps/web/src/lib/utils.ts
```

### Apps: API (Backend)
```bash
# Prefix: apps-api-
apps-api-package.json                     → /forgeline/apps/api/package.json
apps-api-nest-cli.json                    → /forgeline/apps/api/nest-cli.json
apps-api-tsconfig.json                    → /forgeline/apps/api/tsconfig.json

# Main
apps-api-src-main.ts                      → /forgeline/apps/api/src/main.ts
apps-api-src-app.module.ts                → /forgeline/apps/api/src/app.module.ts

# Auth Module
apps-api-src-auth-auth.module.ts          → /forgeline/apps/api/src/auth/auth.module.ts
apps-api-src-auth-auth.service.ts         → /forgeline/apps/api/src/auth/auth.service.ts
apps-api-src-auth-auth.controller.ts      → /forgeline/apps/api/src/auth/auth.controller.ts
apps-api-src-auth-dto-auth.dto.ts         → /forgeline/apps/api/src/auth/dto/auth.dto.ts
apps-api-src-auth-guards-jwt-auth.guard.ts → /forgeline/apps/api/src/auth/guards/jwt-auth.guard.ts
apps-api-src-auth-strategies-jwt.strategy.ts → /forgeline/apps/api/src/auth/strategies/jwt.strategy.ts
apps-api-src-auth-strategies-local.strategy.ts → /forgeline/apps/api/src/auth/strategies/local.strategy.ts

# Prisma Module
apps-api-src-prisma-prisma.module.ts      → /forgeline/apps/api/src/prisma/prisma.module.ts
apps-api-src-prisma-prisma.service.ts     → /forgeline/apps/api/src/prisma/prisma.service.ts
```

### Packages: Database
```bash
# Prefix: packages-db-
packages-db-package.json                  → /forgeline/packages/db/package.json
packages-db-schema.prisma                 → /forgeline/packages/db/schema.prisma
```

---

## 🛠️ Автоматизація (Bash Script)

Створи файл `organize-files.sh` у root проекту:

```bash
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
```

---

## ✋ Ручне копіювання (якщо preferen)

Якщо не хочеш використовувати script, копіюй вручну:

1. Створи структуру:
```bash
mkdir -p forgeline/{apps/{web/src/{app/{auth/{login,signup},dashboard},components/ui,lib},api/src/{auth/{dto,guards,strategies},prisma}},packages/db}
```

2. Копіюй файли один-за-одним згідно mapping вище

3. Видали префікси з назв файлів

---

## ⚠️ Важливо!

Після організації файлів:

1. **Перевір imports**  
   Всі `import` шляхи мають бути правильні

2. **Перевір .env**  
   Скопіюй `.env.example` → `.env`

3. **Install dependencies**  
   ```bash
   pnpm install
   ```

4. **Migrate database**  
   ```bash
   cd packages/db
   pnpm prisma migrate dev
   ```

5. **Run tests**  
   Згідно `V0.1_TESTING_GUIDE.md`

---

## 📝 Checklist

- [ ] Всі файли скопійовані у правильні папки
- [ ] Imports працюють
- [ ] .env створено
- [ ] pnpm install успішний
- [ ] Docker containers running
- [ ] Prisma migration успішна
- [ ] pnpm dev запускається
- [ ] Tests проходять

---

**Let's organize! 📁**
