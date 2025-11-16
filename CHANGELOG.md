# Forgeline - Change Log

**Версія:** 1.2  
**Формат:** Keep a Changelog

---

## 📋 Unreleased

### v0.2 - Google Integration & Dashboard (90% COMPLETE) 🔄

**Старт:** 15.11.2025  
**Поточний статус:** 16.11.2025, День 2/6  
**Прогрес:** 90% - OAuth працює, критичні TODO залишились

---

## ✅ ЩО РЕАЛЬНО ЗРОБЛЕНО (16.11.2025):

### Backend Infrastructure (100%)

**OAuth Integration:**
- ✅ Google OAuth 2.0 повністю працює
- ✅ `GoogleStrategy` з `authorizationParams()` method
- ✅ Refresh token успішно отримується і зберігається в БД
- ✅ Access token працює
- ✅ OAuth endpoints:
  - `GET /api/integrations/google/connect` - ініціює OAuth
  - `GET /api/integrations/google/callback` - приймає callback
- ✅ Перевірено end-to-end: користувач може підключити Google Search Console

**Google Search Console Service:**
- ✅ `GscService` створено з методами:
  - `getMetrics()` - отримує метрики з GSC API
  - `refreshAccessToken()` - оновлює протермінований токен
- ✅ `GscController` з endpoint:
  - `GET /api/gsc/metrics?siteUrl=X` - повертає дані GSC
- ✅ Інтеграція з `googleapis` package
- ✅ Error handling для expired tokens
- ✅ Логування (console.log для debugging)

**Database & Models:**
- ✅ `Integration` model працює
- ✅ Токени зберігаються в PostgreSQL
- ✅ Composite unique key `(organizationId, provider)`
- ✅ Каскадне видалення налаштовано

### Frontend (70%)

**Dashboard UI:**
- ✅ `GscMetricsCard` компонент створено
- ✅ Recharts графіки підключені (LineChart готовий)
- ✅ Loading state (базовий)
- ✅ Error handling UI (показує помилки)
- ✅ "No data available" state

**Integration Flow:**
- ✅ Користувач може натиснути "Connect Google"
- ✅ OAuth редірект працює
- ✅ Success/error states

---

## ❌ ЩО НЕ ЗРОБЛЕНО (Critical TODO):

### 🔴 КРИТИЧНЕ (must-fix перед v0.3):

1. **Token Encryption (AES-256)** ⚠️
   - Зараз: токени в БД plaintext
   - Треба: шифрувати `accessToken` і `refreshToken` перед збереженням
   - Час: ~40 хвилин
   - Файли: `integrations.service.ts`

2. **Hardcoded organizationId у OAuth** ⚠️
   - Зараз: `organizationId = 'cmi03mh7f0001nuvzjw3w1oq8'` (жорстко прописано)
   - Треба: передавати через OAuth state або брати з JWT
   - Час: ~30 хвилин
   - Файли: `integrations.controller.ts`, `google.strategy.ts`

3. **JWT_SECRET fallback у коді** ⚠️
   - Зараз: `process.env.JWT_SECRET || 'your-secret-key'`
   - Треба: прибрати fallback, вимагати явний SECRET
   - Час: 5 хвилин
   - Файли: `jwt.strategy.ts`

### 🟡 ВАЖЛИВЕ (nice-to-have):

4. **UI Improvements:**
   - [ ] Skeleton loaders (shadcn/ui)
   - [ ] Responsive grid layout
   - [ ] Кращі error messages
   - [ ] Loading spinners

5. **Auto-refresh logic:**
   - [ ] Автоматичний виклик `refreshAccessToken()` при 401
   - [ ] Перевірка `tokenExpiry` перед запитом

6. **Frontend URL configuration:**
   - [ ] Використовувати `NEXT_PUBLIC_API_URL` замість hardcoded localhost

---

## 🐛 ПРОБЛЕМИ ПІД ЧАС РОЗРОБКИ:

### OAuth Troubleshooting (вирішено):

1. **Redirect URI mismatch** ✅
   - Проблема: Google відхиляв callback через невідповідність URI
   - Причина: NestJS додає `/api` prefix, а в .env не було
   - Рішення: `GOOGLE_CALLBACK_URL=http://localhost:4000/api/integrations/google/callback`

2. **OAuth2Strategy requires clientID** ✅
   - Проблема: Passport не створював strategy
   - Причина: `GoogleStrategy` не був у `providers` масиві
   - Рішення: Додали `GoogleStrategy` до `IntegrationsModule.providers`

3. **Foreign key constraint** ✅
   - Проблема: `organizationId = '1'` не існує в БД
   - Рішення: Використали реальний UUID з тестової організації
   - TODO: Виправити на динамічний orgId через state

4. **Access denied 403** ✅
   - Проблема: Google блокував логін
   - Причина: OAuth app у test mode, user не доданий до Test Users
   - Рішення: Додали email у Google Cloud Console → Test Users

5. **refreshToken = NULL** ✅
   - Проблема: Google не повертав refresh_token
   - Причина: Неправильне розміщення параметрів OAuth
   - Рішення: Використали `authorizationParams()` method у GoogleStrategy

6. **EADDRINUSE port 4000** ✅
   - Проблема: Порт зайнятий "зомбі" процесом
   - Рішення: `npx kill-port 4000`

### Frontend Issues (вирішено):

7. **Next.js кешування** ✅
   - Проблема: Зміни в коді не застосовувались
   - Рішення: Видалили папку `.next`, перезапустили dev server

8. **Fetch URL issues** ✅
   - Проблема: URLSearchParams не застосовувались
   - Рішення: Використали правильний синтаксис з template strings

---

## 📊 ТЕХНІЧНІ ДЕТАЛІ:

**Оновлені/створені файли:**
```
apps/api/src/
├── integrations/
│   ├── integrations.module.ts (updated - GoogleStrategy у providers)
│   ├── integrations.controller.ts (OAuth endpoints)
│   ├── integrations.service.ts (CRUD для Integration)
│   └── google.strategy.ts (authorizationParams method)
├── gsc/
│   ├── gsc.module.ts (новий)
│   ├── gsc.controller.ts (новий - /api/gsc/metrics)
│   └── gsc.service.ts (новий - getMetrics, refreshAccessToken)
└── app.module.ts (додано GscModule)

apps/web/src/
└── components/dashboard/
    └── gsc-metrics-card.tsx (новий - UI з recharts)

.env (додано):
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET  
- GOOGLE_CALLBACK_URL
```

**Пакети додані:**
```json
{
  "@nestjs/passport": "^10.0.3",
  "passport": "^0.7.0", 
  "passport-google-oauth20": "^2.0.0",
  "googleapis": "^128.0.0",
  "recharts": "^2.10.3"
}
```

**Environment Variables:**
```bash
# Google OAuth
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_CALLBACK_URL=http://localhost:4000/api/integrations/google/callback

# Frontend
FRONTEND_URL=http://localhost:3000
```

---

## 🎯 ACCEPTANCE CRITERIA:

**v0.2 Criteria:**
- ✅ Google OAuth працює end-to-end
- ✅ Refresh token зберігається в БД
- ✅ GscService може робити запити до Google API
- ✅ Dashboard показує Google Search Console секцію
- ⏸️ Токени зашифровані (TODO)
- ⏸️ organizationId динамічний (TODO)
- ✅ Error handling на backend
- ✅ Error handling на frontend (базовий)
- ⏸️ UI improvements (TODO)

**Поточний статус:** 7/9 критеріїв виконано (78%)

---

## 📈 ПРОГРЕС ДО MILESTONES:

**Що залишилось до завершення v0.2:**
- Token encryption (40 хв)
- Fix hardcoded organizationId (30 хв)
- Fix JWT_SECRET fallback (5 хв)
- **Разом: ~1.5 години** ⏱️

**Після цього v0.2 = 100% DONE** ✅

---

## 🔍 ВИСНОВКИ З АУДИТУ (ChatGPT):

**Сильні сторони:**
- ✅ OAuth інтеграція реалізована правильно
- ✅ Модульна архітектура (легко розширювати)
- ✅ Детальне troubleshooting documentation
- ✅ Multi-tenancy закладено правильно

**Критичні виправлення (з аудиту):**
- ⚠️ Token encryption - ОБОВ'ЯЗКОВО
- ⚠️ Hardcoded organizationId - ОБОВ'ЯЗКОВО  
- ⚠️ JWT_SECRET fallback - ОБОВ'ЯЗКОВО

**Відкладено на v0.3:**
- Task Manager
- AI Claude integration
- Socket.io real-time
- BullMQ/Cron jobs
- Site Audit (Crawlee)

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

---

## 📊 Version Statistics

| Version | Planned | Actual | Status | Completion Date |
|---------|---------|--------|--------|-----------------|
| v0.1 | 5 days | 1 day | ✅ Complete | 15.11.2025 |
| v0.2 | 6 days | 2 days | 🔄 90% (Critical TODO) | In Progress |
| v0.3 | 5 days | TBD | 📋 Planned | - |
| v0.4 | 10 days | TBD | 📋 Planned | - |
| v0.5 | 12 days | TBD | 📋 Planned | - |
| **Milestone 1** | **38 days** | **TBD** | **45% Complete** | **Target: Investor Demo** |

---

## 🎯 Progress to Milestones

**Investor Demo (v0.5):**
- ✅ v0.1 Foundation (100%)
- 🔄 v0.2 Google Integration (90%)
- ⏳ v0.3 Chat Infrastructure (0%)
- ⏳ v0.4 AI Teammate + Tasks (0%)
- ⏳ v0.5 Site Audit (0%)
- **Overall: 38%** (1.9/5 versions)

**Beta Version (v0.8):**
- **Overall: 0%** (0/3 versions after Investor Demo)

**Public Launch (v1.0):**
- **Overall: 0%** (0/2 versions after Beta)

**Total Progress:** 19% (1.9/10 versions) 🔄

---

**Останнє оновлення:** 16.11.2025, 14:00  
**Поточна версія:** v0.2 (90% complete - critical fixes needed) 🔄  
**Наступний крок:** Token encryption + fix hardcoded organizationId (~1.5 год)

**Keep building! 🚀**