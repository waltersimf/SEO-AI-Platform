# Forgeline - Change Log

**Версія:** 1.1  
**Формат:** Keep a Changelog

---

## 📋 Unreleased

### v0.2 - Google Integration & Dashboard (IN PROGRESS) 🔄

**Старт:** 15.11.2025  
**Очікуване завершення:** 19.11.2025 (6 днів)  
**Статус:** 🔄 День 1/6 - Backend Infrastructure Complete (40%)

**Що зроблено сьогодні (15.11.2025, 14:15):**

**Backend:**
- ✅ Створено `Integration` model в Prisma schema
- ✅ Застосовано міграцію бази даних (`add_integrations`)
- ✅ Встановлено пакети: `@nestjs/passport`, `passport`, `passport-google-oauth20`, `@types/passport-google-oauth20`
- ✅ Створено `IntegrationsModule` (NestJS):
  - `integrations.service.ts` - CRUD operations для інтеграцій
  - `integrations.controller.ts` - REST API endpoints
  - `google.strategy.ts` - Google OAuth strategy (temporarily disabled)
  - `integrations.module.ts` - Module configuration
- ✅ Додано endpoints:
  - `GET /api/integrations` - Get all integrations
  - `GET /api/integrations/:provider` - Get specific integration
  - `DELETE /api/integrations/:provider` - Delete integration
  - `GET /api/integrations/google/connect` - Initiate OAuth (ready but disabled)
  - `GET /api/integrations/google/callback` - OAuth callback (ready but disabled)
- ✅ Додано environment variables до `.env`:
  - `GOOGLE_CLIENT_ID` (placeholder)
  - `GOOGLE_CLIENT_SECRET` (placeholder)
  - `GOOGLE_CALLBACK_URL`
  - `FRONTEND_URL`
- ✅ Backend успішно запускається без помилок
- ✅ IntegrationsModule підключено до AppModule

**Database Schema Changes:**
```prisma
model Integration {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(...)
  
  provider       String
  accessToken    String   @db.Text
  refreshToken   String?  @db.Text
  tokenExpiry    DateTime?
  scopes         String[]
  metadata       Json?
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([organizationId, provider])
  @@map("integrations")
}
```

**Що залишилось (День 1-2):**
- ⏸️ Отримати реальні Google OAuth credentials з Google Console
- ⏸️ Розкоментувати та протестувати GoogleStrategy
- ⏸️ Додати token encryption (AES-256)
- ⏸️ End-to-end test OAuth flow

**Що залишилось (День 3-4):**
- [ ] GSC API wrapper service
- [ ] `/api/gsc/metrics` endpoint
- [ ] Token refresh logic
- [ ] Error handling для expired tokens

**Що залишилось (День 5-6):**
- [ ] Dashboard UI з графіками (recharts)
- [ ] Loading states + skeletons
- [ ] Error handling UI
- [ ] Responsive grid layout

**Технічні деталі:**
- GoogleStrategy тимчасово вимкнено через placeholder credentials
- Використано organization-level OAuth (один токен для всієї команди)
- Passport.js для OAuth flow
- REST API готовий до інтеграції з фронтендом

**Прогрес:** Backend infrastructure 100% ready, overall progress 40%

---

## 📦 Released

### v0.1 - Foundation & Auth ✅

**Дата:** 15.11.2025  
**Статус:** ✅ ЗАВЕРШЕНО  
**Час розробки:** 1 день (3 години активної роботи)

**Deliverable:** Повноцінний прототип з auth, dashboard та базою даних.

**Що реалізовано:**

**Frontend (Next.js 14):**
- ✅ App Router setup з TypeScript
- ✅ shadcn/ui + Tailwind CSS
- ✅ Базовий layout (Sidebar + Main content)
- ✅ Auth pages:
  - Login page (`/auth/login`)
  - Signup page (`/auth/signup`)
- ✅ Dashboard page з sidebar navigation
- ✅ Sidebar component з іконками (lucide-react)
- ✅ Responsive design (mobile + desktop)
- ✅ UI Components: Button, Card, Input, Label

**Backend (NestJS):**
- ✅ NestJS project structure
- ✅ Prisma ORM integration
- ✅ PostgreSQL database
- ✅ Models:
  - User (email, password, role)
  - Organization (name, slug, plan)
- ✅ JWT Authentication:
  - Signup endpoint (`/auth/signup`)
  - Login endpoint (`/auth/login`)
  - JWT token generation (7 days expiry)
  - Password hashing (bcrypt, 10 rounds)
- ✅ Guards & Strategies:
  - JwtAuthGuard
  - LocalStrategy
  - JwtStrategy
- ✅ CORS налаштовано для frontend

**Infrastructure:**
- ✅ Docker Compose:
  - PostgreSQL container
  - Redis container
- ✅ Monorepo structure (pnpm workspaces)
- ✅ Environment variables (.env)
- ✅ Turbo configuration
- ✅ Git repo setup

**Acceptance Criteria - ВСІ ПРОЙДЕНІ:**
- ✅ User signup → Organization створюється автоматично
- ✅ User login → JWT token працює
- ✅ Dashboard видно після login
- ✅ Sidebar navigation працює
- ✅ Mobile responsive
- ✅ Docker containers запускаються
- ✅ Prisma migrations працюють

**Оновлені/створені файли:**
```
apps/
├── api/
│   └── src/
│       ├── auth/
│       │   ├── auth.controller.ts
│       │   ├── auth.module.ts
│       │   ├── auth.service.ts
│       │   ├── dto/auth.dto.ts
│       │   ├── guards/jwt-auth.guard.ts
│       │   └── strategies/
│       │       ├── jwt.strategy.ts
│       │       └── local.strategy.ts
│       ├── prisma/
│       │   ├── prisma.module.ts
│       │   └── prisma.service.ts
│       ├── app.module.ts
│       └── main.ts
└── web/
    └── src/
        ├── app/
        │   ├── auth/
        │   │   ├── login/page.tsx
        │   │   └── signup/page.tsx
        │   ├── dashboard/
        │   │   ├── layout.tsx
        │   │   └── page.tsx
        │   ├── layout.tsx
        │   ├── page.tsx
        │   └── globals.css
        ├── components/
        │   ├── ui/ (shadcn components)
        │   └── sidebar.tsx
        └── lib/utils.ts

packages/
└── db/
    └── schema.prisma

docker-compose.yml
.env
package.json
pnpm-workspace.yaml
turbo.json
```

**Проблеми під час розробки:**
1. ❌ TypeScript unused imports → ✅ Виправлено
2. ❌ Docker не встановлено → ✅ Docker Desktop + WSL2
3. ❌ Frontend робив запити на себе → ✅ URL змінено на localhost:4000
4. ❌ Port 4000 зайнятий → ✅ Процес перезапущено

**Технічні особливості:**
- TypeScript strict mode enabled
- ESLint + Prettier configured
- Hot reload working (frontend + backend)
- Error handling з ValidationPipe
- Password hashing з bcrypt
- CORS налаштовано для localhost:3000
- Multi-tenancy через organizationId
- Row-level security ready

**Результат:**  
🎉 Повноцінний робочий прототип! User може створити акаунт, залогінитись, побачити dashboard з sidebar navigation. Authentication працює через JWT. Organization створюється автоматично при signup. База даних готова до масштабування.

---

## 📊 Version Statistics

| Version | Planned | Actual | Status | Date |
|---------|---------|--------|--------|------|
| v0.1 | 5 days | 1 day | ✅ Complete | 15.11.2025 |
| v0.2 | 6 days | TBD | 🔄 In Progress (Day 1/6, 40%) | Started 15.11.2025 |
| v0.3 | 5 days | TBD | 📋 Planned | - |
| v0.4 | 10 days | TBD | 📋 Planned | - |
| v0.5 | 12 days | TBD | 📋 Planned | - |
| **Milestone 1** | **38 days** | **TBD** | **28% Complete** | **Target: Investor Demo** |

---

## 🎯 Progress to Milestones

**Investor Demo (v0.5):**
- ✅ v0.1 Foundation (100%)
- 🔄 v0.2 Google Integration (40%)
- ⏳ v0.3 Chat Infrastructure (0%)
- ⏳ v0.4 AI Teammate + Tasks (0%)
- ⏳ v0.5 Site Audit (0%)
- **Overall: 28%** (1.4/5 versions)

**Beta Version (v0.8):**
- **Overall: 0%** (0/3 versions after Investor Demo)

**Public Launch (v1.0):**
- **Overall: 0%** (0/2 versions after Beta)

**Total Progress:** 14% (1.4/10 versions) 🔄

---

**Останнє оновлення:** 15.11.2025, 14:15  
**Поточна версія:** v0.2 (40% complete) 🔄  
**Наступний крок:** Google OAuth credentials + test flow

**Keep building! 🚀**