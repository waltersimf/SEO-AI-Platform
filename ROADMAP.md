# Forgeline - Development Roadmap

**Версія:** 2.6  
**Дата:** 17.11.2025  
**Формат:** Версійна розробка + Покращення з improvement_plan

---

## 🎯 Загальна стратегія

### Milestone до v1.0:

```
📍 v0.1 → v0.5  (33 дні) = Investor Demo (повний!)
📍 v0.6 → v0.8  (30 днів) = Beta Version  
📍 v0.9 → v1.0  (20 днів) = Public Launch

РАЗОМ: 83 робочих днів ≈ 16-17 тижнів (4 місяці)
```

**v1.0 = повна Phase 1** з техдоку

---

## 📊 Progress Tracker

```
v0.1 ████████████████████ 100% ✅
v0.2 ████████████████████ 100% ✅
v0.3 ██████████░░░░░░░░░░  50% 🔄
v0.4 ░░░░░░░░░░░░░░░░░░░░   0%
v0.5 ░░░░░░░░░░░░░░░░░░░░   0%
     └─ INVESTOR DEMO: 50% 🔄

v0.6 ░░░░░░░░░░░░░░░░░░░░   0%
v0.7 ░░░░░░░░░░░░░░░░░░░░   0%
v0.8 ░░░░░░░░░░░░░░░░░░░░   0%
     └─ BETA VERSION: 0%

v0.9 ░░░░░░░░░░░░░░░░░░░░   0%
v1.0 ░░░░░░░░░░░░░░░░░░░░   0%
     └─ PUBLIC LAUNCH: 0%

═══════════════════════════════════════
MILESTONE 1 (Investor Demo): 50% (2.5/5) 🔄
MILESTONE 2 (Beta):           0% (0/3)
MILESTONE 3 (Launch):         0% (0/2)
═══════════════════════════════════════
TOTAL PROGRESS: 25% (2.5/10 versions) 🔄
```

**До наступних milestones:**
- 🔥 Investor Demo (v0.5): ~26 днів
- 🧪 Beta (v0.8): ~56 днів
- 🚀 Launch (v1.0): ~76 днів

---

## 🔥 MILESTONE 1: Investor Demo (v0.1 → v0.5)

**Загальний час:** 33 дні  
**Прогрес:** 2.5/5 версій (50%) 🔄  
**Ціль:** Показати інвесторам killer combo:
- ✅ AI Teammate (в чаті з командою)
- ✅ Повний Task Manager (Schedule/Backlog/Done + AI planning)
- ✅ Site Audit (AI аналіз проблем)
- ✅ Real data з Google APIs

---

### 📦 v0.1 - Foundation & Auth ✅

**Час:** 5 днів → **Фактично: 1 день**  
**Статус:** ✅ **ЗАВЕРШЕНО** (15.11.2025)  
**Deliverable:** ✅ Можна створити акаунт та залогінитись

**Що зроблено:**
- ✅ Next.js 14 + NestJS + PostgreSQL
- ✅ JWT Authentication
- ✅ Basic UI (Login, Signup, Dashboard)
- ✅ Docker infrastructure

**Acceptance Criteria:** ✅ ВСІ ПРОЙДЕНІ

---

### 📦 v0.2 - Google Integration & Dashboard ✅

**Час:** 6 днів → **Фактично: 2 дні**  
**Статус:** ✅ **ЗАВЕРШЕНО** (16.11.2025)  
**Deliverable:** ✅ Google OAuth + зашифровані токени

**Що зроблено:**
- ✅ Google OAuth flow
- ✅ Token encryption (AES-256-GCM)
- ✅ Dashboard UI з connection status
- ✅ GSC integration готова

**Acceptance Criteria:** ✅ ВСІ ПРОЙДЕНІ

---

### 📦 v0.3 - Chat Infrastructure 🔄

**Час:** 5 днів  
**Статус:** 🔄 **IN PROGRESS (50%)**  
**Deliverable:** ✅ Real-time командний чат працює

**КРИТИЧНІ ЗАВДАННЯ (must complete):**

**День 1-2: Fix ChatGateway + Database Persistence** 🔴
- [ ] 🔴 **Виправити TypeError у ChatGateway**
  - [ ] web_search: "nestjs socket.io prisma best practices"
  - [ ] Знайти working example з GitHub
  - [ ] Скопіювати pattern
  - [ ] Протестувати з Prisma
- [ ] 🔴 **ChatService зберігає messages в БД**
  - [ ] createMessage() → Prisma insert
  - [ ] getChatMessages() → Prisma fetch
  - [ ] Error handling (try/catch)
- [ ] 🔴 **Message history з БД**
  - [ ] GET /chat/:id/messages endpoint
  - [ ] Frontend завантажує історію при mount
  - [ ] Показує старі повідомлення

**День 3: Прибрати хардкод** 🟡
- [ ] 🟡 **Dynamic chatId замість "test-room"**
  - [ ] Default chat для organization
  - [ ] Endpoint: POST /chat/create
  - [ ] Frontend отримує chatId з API
- [ ] 🟡 **organizationId з JWT токена**
  - [ ] JwtAuthGuard в ChatController
  - [ ] req.user.organizationId
- [ ] 🟡 **userId з токена (не hardcode)**

**День 4-5: UX покращення** 🟢
- [ ] 🟢 **Socket.io connection status**
  - [ ] Green indicator: Connected
  - [ ] Red indicator: Disconnected
  - [ ] Toast: "Connection lost, reconnecting..."
- [ ] 🟢 **Auto-reconnect logic**
  - [ ] Socket.io reconnection
  - [ ] Reload messages після reconnect
- [ ] 🟢 **Loading states**
  - [ ] Skeleton для messages
  - [ ] Spinner при відправці

**Acceptance Criteria:**
- ✅ Socket.io підключення (DONE)
- ✅ Real-time messaging (DONE)
- ✅ ChatBox UI (DONE)
- ✅ Room-based chat (DONE)
- [ ] **Messages зберігаються в БД** ← КРИТИЧНО!
- [ ] **Message history завантажується** ← КРИТИЧНО!
- [ ] **chatId динамічний** ← КРИТИЧНО!
- [ ] Connection status показується
- [ ] Typing indicators працюють

**Поточний статус:** 5/9 критеріїв (55%) 🔄

---

### 📦 v0.4 - AI Teammate + Task Manager (Full) 🔥

**Час:** 10 днів → **Додано +2 дні = 12 днів**  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ AI teammate + повний Task Manager + Security improvements

**День 1-4: AI Teammate**
- [ ] AI User створюється в БД (auto)
- [ ] Claude API integration (@anthropic-ai/sdk)
- [ ] @AI mention detection
- [ ] Context builder:
  - [ ] Project info
  - [ ] Last 10 messages
  - [ ] GSC data
- [ ] Token usage tracking
- [ ] Cost calculator

**День 5-8: Task Manager (Full)**
- [ ] Task model extended (schedule, acceptance, group)
- [ ] Schedule view (calendar-like)
- [ ] Backlog view (list)
- [ ] Done view (archive)
- [ ] Estimated time field (mandatory)
- [ ] Acceptance workflow:
  - [ ] Task → "Needs Review"
  - [ ] Popup for acceptor
  - [ ] Accept / Reject
- [ ] Group tasks (assign to all team)
- [ ] Drag & drop (react-beautiful-dnd)

**День 9-10: AI Integration**
- [ ] AI створює tasks з чату
- [ ] AI може розподілити backlog на schedule
- [ ] AI має доступ до GSC metrics

**ДОДАНО: День 11-12: Security & Code Quality** 🔐
> Покращення з improvement_plan (high/medium priority)

**Security Improvements:**
- [ ] 🔐 **DTO Validation (class-validator)**
  - [ ] `@IsEmail`, `@IsNotEmpty` у SignupDto/LoginDto
  - [ ] `@Length`, `@MinLength` для паролів
  - [ ] ValidationPipe глобально
  - [ ] Proper error messages
  
- [ ] 🔐 **OAuth Google покращення**
  - [ ] Обробка протухлих токенів
  - [ ] Refresh token flow
  - [ ] Error states: "Reconnect Google" button
  - [ ] Token expiry warnings

**Code Quality:**
- [ ] 🧹 **Централізувати OAuth константи**
  - [ ] `shared/constants/google.ts`
  - [ ] GOOGLE_SCOPES експортується
  - [ ] Імпорт в Strategy + Controller
  
- [ ] 🧹 **API fetch обгортка (useApi hook)**
  - [ ] `lib/api.ts` з fetch wrapper
  - [ ] Централізований error handling
  - [ ] Auto-logout по 401
  - [ ] Toast notifications

**UX Improvements:**
- [ ] 🎨 **Повідомлення після дій**
  - [ ] Toast після signup: "Account created!"
  - [ ] Toast після login: "Welcome back!"
  - [ ] Toast після підключення Google: "Google Connected!"
  - [ ] Toast при помилках (friendly messages)

- [ ] 🎨 **Інформативні error messages**
  - [ ] Замість "Invalid credentials" → "Email or password is incorrect"
  - [ ] Замість "Error" → конкретна причина
  - [ ] Clear password field після помилки логіну

**Acceptance Criteria:**
- ✅ "@AI що з трафіком?" → AI відповідає з даних GSC
- ✅ AI створює task коли попросять
- ✅ Task Manager повністю працює (3 views)
- ✅ Acceptance workflow smooth
- ✅ Group tasks working
- ✅ **DTO validation працює** ← НОВИЙ
- ✅ **OAuth error handling** ← НОВИЙ
- ✅ **useApi hook used everywhere** ← НОВИЙ
- ✅ **Toast notifications** ← НОВИЙ

---

### 📦 v0.5 - Site Audit + AI Analysis 🔍

**Час:** 12 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ **INVESTOR DEMO READY!** 🎯

**День 1-6: Crawler (Crawlee + Playwright)**
- [ ] Crawl до 500 pages
- [ ] JS rendering
- [ ] Audit checks (23 types):
  - [ ] Metadata (title, description)
  - [ ] Headings (H1, H2-H6)
  - [ ] Images (alt, size)
  - [ ] Links (broken, redirects)
  - [ ] Performance (load time)
- [ ] Background jobs (BullMQ)

**День 7-9: AI Audit Analysis**
- [ ] AI аналізує результати
- [ ] Критичність issues (High/Medium/Low)
- [ ] Actionable recommendations
- [ ] Automated task creation

**День 10-12: Investor Demo Prep**
- [ ] Demo script (7-10 хв)
- [ ] Test data setup
- [ ] Performance optimization
- [ ] Bug fixes
- [ ] Presentation deck

**Acceptance Criteria:**
- ✅ Audit працює до 500 pages
- ✅ AI аналізує і дає рекомендації
- ✅ Demo runs smoothly 7-10 хв
- ✅ Zero critical bugs
- ✅ **ГОТОВО ДЛЯ ІНВЕСТОРІВ!** 💰

---

## 🧪 MILESTONE 2: Beta Version (v0.6 → v0.8)

### 📦 v0.6 - Google APIs (Full) + Testing Infrastructure

**Час:** 8 днів → **Додано +2 дні = 10 днів**  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Всі Google APIs + щоденний збір + тести

**День 1-3: Google APIs**
- [ ] Google Analytics GA4
- [ ] Google Drive API
- [ ] Google Docs API
- [ ] Google Sheets API

**День 4-6: Data Collection**
- [ ] Cron jobs (daily at 6 AM)
- [ ] DataSnapshot model
- [ ] Parallel collection
- [ ] Error handling + retry

**День 7-8: Dashboard Updates**
- [ ] GA4 widgets
- [ ] Historical charts
- [ ] Data export

**ДОДАНО: День 9-10: Testing Infrastructure** 🧪
> Покращення з improvement_plan (high priority - delayed)

**Backend Tests:**
- [ ] 🧪 **Unit tests (Jest)**
  - [ ] AuthService tests (signup, login, JWT)
  - [ ] EncryptionService tests (encrypt/decrypt)
  - [ ] GscService tests (mock API responses)
  - [ ] ChatService tests (messages persistence)

**Frontend Tests:**
- [ ] 🧪 **Component tests (React Testing Library)**
  - [ ] GoogleConnectButton (connected/disconnected states)
  - [ ] ChatBox (message sending, receiving)
  - [ ] Auth forms (validation, errors)

**Integration Tests:**
- [ ] 🧪 **E2E critical flows**
  - [ ] Signup → Login → Dashboard
  - [ ] Google OAuth flow
  - [ ] Chat messaging real-time

**Test Coverage Target:** 
- [ ] Backend: >70%
- [ ] Frontend: >60%
- [ ] Critical paths: 100%

**Acceptance Criteria:**
- ✅ Всі Google APIs працюють
- ✅ Щоденний збір без помилок
- ✅ Dashboard з повними даними
- ✅ **Tests pass** ← НОВИЙ
- ✅ **Coverage targets met** ← НОВИЙ

---

### 📦 v0.7 - AI Analysis + Morning Brief + Advanced Features

**Час:** 6 днів → **Додано +2 дні = 8 днів**  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ AI аналізує зміни + morning brief + масштабованість

**День 1-3: Analysis Engine**
- [ ] Snapshot comparison
- [ ] Change detection (↑↓ metrics)
- [ ] Anomaly detection
- [ ] Trend analysis

**День 4-6: Morning Brief**
- [ ] AI summary generation
- [ ] Critical issues highlight
- [ ] Actionable recommendations
- [ ] Email delivery (SendGrid)

**ДОДАНО: День 7-8: Scalability & Logging** 🚀
> Покращення з improvement_plan (medium/low priority)

**Scalability:**
- [ ] 📊 **Пагінація**
  - [ ] Chat messages pagination (load more)
  - [ ] Projects list pagination
  - [ ] Tasks pagination (Backlog)
  - [ ] Audit results pagination

- [ ] 📊 **Оптимізація запитів**
  - [ ] `lastMessage` field у Chat model
  - [ ] Indexes на frequently queried fields
  - [ ] N+1 queries optimization

**Logging & Monitoring:**
- [ ] 📝 **Production logging (Winston)**
  - [ ] Replace console.log
  - [ ] Log levels (error, warn, info, debug)
  - [ ] Log rotation
  - [ ] Don't log sensitive data (tokens, passwords)

- [ ] 📝 **Error tracking готовність**
  - [ ] Структуровані логи (JSON)
  - [ ] Request IDs
  - [ ] User context in logs

**Acceptance Criteria:**
- ✅ AI аналізує зміни щодня
- ✅ Morning brief генерується о 7:00
- ✅ Email надходить користувачам
- ✅ **Pagination працює** ← НОВИЙ
- ✅ **Winston logging** ← НОВИЙ

---

### 📦 v0.8 - Notifications (Full) + Polish + Security Hardening

**Час:** 16 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Розумні notifications + повний polish + security

**День 1-5: Notification System**
- [ ] Notification Stack UI (floating)
- [ ] Auto-collapse + grouping
- [ ] Interactive actions
- [ ] Sound effects (optional)
- [ ] Notification center

**День 6-8: Recurring Tasks**
- [ ] Recurring task model
- [ ] Cron scheduler
- [ ] Task instances

**День 9-12: Advanced Crawler**
- [ ] Crawl до 5K pages
- [ ] JS rendering optimization
- [ ] Incremental crawling

**День 13-16: UI/UX Polish + Security**
> Покращення з improvement_plan (low priority + security)

**UI/UX Polish:**
- [ ] 🎨 **UI покращення**
  - [ ] Socket.io status indicator (green/grey dot)
  - [ ] Message animations (slide in)
  - [ ] Skeleton loaders для metrics
  - [ ] Smooth transitions
  - [ ] Loading states everywhere

**Security Hardening:**
- [ ] 🔐 **JWT у HttpOnly cookies (optional)**
  - [ ] Migrate from localStorage
  - [ ] HttpOnly + Secure + SameSite
  - [ ] CSRF protection
  - [ ] Alternative: NextAuth.js evaluation

**Performance:**
- [ ] ⚡ **Performance optimization**
  - [ ] Code splitting
  - [ ] Image optimization
  - [ ] Lazy loading
  - [ ] Bundle size reduction
  - [ ] API response time <200ms

**Accessibility:**
- [ ] ♿ **A11y improvements**
  - [ ] Keyboard navigation
  - [ ] ARIA labels
  - [ ] Focus management
  - [ ] Color contrast
  - [ ] Screen reader testing

**Acceptance Criteria:**
- ✅ Notifications працюють smooth
- ✅ Recurring tasks виконуються
- ✅ Crawler обробляє 5K pages
- ✅ Lighthouse score >85
- ✅ **Security hardening complete** ← НОВИЙ
- ✅ **A11y passed** ← НОВИЙ
- ✅ **BETA READY!** 🧪

---

## 🚀 MILESTONE 3: Public Launch (v0.9 → v1.0)

### 📦 v0.9 - Reports & Team Management + CI/CD

**Час:** 10 днів → **Додано +2 дні = 12 днів**  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Reports + повне team management + CI/CD

**День 1-5: Reports System**
- [ ] Report templates
- [ ] Custom reports
- [ ] Scheduled reports
- [ ] Export formats (PDF, Docs, Sheets)

**День 6-8: Team Management**
- [ ] Invite users
- [ ] Role permissions
- [ ] User activity log
- [ ] Usage tracking per user

**ДОДАНО: День 9-12: CI/CD & Dev Workflow** 🔧
> Покращення з improvement_plan (low priority - delayed to pre-launch)

**CI/CD Pipeline:**
- [ ] 🔧 **GitHub Actions**
  - [ ] Lint (ESLint + Prettier)
  - [ ] Type check (tsc)
  - [ ] Tests (Jest + E2E)
  - [ ] Build verification
  - [ ] Deploy preview (Vercel)

**Docker Production:**
- [ ] 🐳 **Production Docker setup**
  - [ ] Multi-stage builds
  - [ ] Environment variables handling
  - [ ] Health checks
  - [ ] Docker Compose production

**Acceptance Criteria:**
- ✅ Reports генеруються
- ✅ Team management працює
- ✅ Permissions enforcement
- ✅ **CI/CD pipeline working** ← НОВИЙ
- ✅ **Docker production-ready** ← НОВИЙ

---

### 📦 v1.0 - Production Launch! 🎉

**Час:** 10 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ PUBLIC LAUNCH!

**День 1-3: Security**
- [ ] Security audit (OWASP)
- [ ] Penetration testing
- [ ] Rate limiting
- [ ] CSRF protection

**День 4-6: Performance**
- [ ] Performance audit
- [ ] API optimization (<200ms)
- [ ] Frontend optimization
- [ ] Caching strategy

**День 7-10: Launch Prep**
- [ ] Monitoring (Sentry)
- [ ] Logging infrastructure
- [ ] Production deployment
- [ ] Landing page
- [ ] Documentation
- [ ] Product Hunt submission

**Acceptance Criteria:**
- ✅ Security audit passed
- ✅ Lighthouse >90
- ✅ API <200ms average
- ✅ Zero critical bugs
- ✅ 99.9% uptime
- ✅ **PRODUCTION LIVE!** 🚀

---

## 📋 Improvement Plan Integration Summary

**Всі покращення з improvement_plan.md розподілені:**

### 🔴 High Priority (Must Fix):
- ✅ v0.3: Chat database persistence + прибрати хардкод + UX errors
- ✅ v0.6: Базові тести (delayed після core features)
- ✅ v0.4: OAuth покращення

### 🟡 Medium Priority (Next 1-2 Sprints):
- ✅ v0.8: JWT у cookies (optional security hardening)
- ✅ v0.4: OAuth константи централізувати
- ✅ v0.4: DTO validation
- ✅ v0.4: UX покращення (toast, messages)
- ✅ v0.4: API fetch обгортка

### 🟢 Low Priority (Nice to Have):
- ✅ v0.7: Пагінація + масштабованість
- ✅ v0.7: Winston logging
- ✅ v0.8: UI полірування
- ✅ v0.9: CI/CD
- ❌ OpenAI integration → ВІДКЛАДЕНО на Phase 2

**Не включено (future phases):**
- AI context endpoint (`/chat/:id/context`) - буде в Phase 2
- OpenAI integration - Phase 2 (multi-LLM support)

---

## ✅ Definition of Done

### v0.5 (Investor Demo)
- [ ] Working demo 7-10 хвилин
- [ ] AI teammate в group чаті
- [ ] Повний Task Manager (Schedule/Backlog/Done)
- [ ] AI planning працює
- [ ] Site Audit до 500 pages
- [ ] AI аналіз audit results
- [ ] Google OAuth + реальні GSC дані
- [ ] Zero critical bugs під час demo

### v0.8 (Beta)
- [ ] 15+ beta users активні
- [ ] Всі Google APIs (GSC, GA4, Docs, Sheets)
- [ ] Щоденний збір даних працює
- [ ] Morning brief генерується
- [ ] Notifications system (floating stack)
- [ ] Recurring tasks
- [ ] Crawler до 5K pages
- [ ] Mobile responsive
- [ ] <10 non-critical bugs
- [ ] Lighthouse >85
- [ ] Tests coverage >60%
- [ ] Security hardening complete

### v1.0 (Launch)
- [ ] Production deployment stable
- [ ] Security audit passed
- [ ] Performance: Lighthouse >90, API <200ms
- [ ] Reports generation + export
- [ ] Team management
- [ ] Documentation complete
- [ ] Zero critical bugs
- [ ] 99.9% uptime
- [ ] Product Hunt ready
- [ ] CI/CD pipeline working
- [ ] Monitoring + logging active

---

## 🔄 Development Process

### Weekly Sprints

**Monday:**
- Sprint planning (2 год)
- Version goals review

**Tuesday-Friday:**
- Deep work (development)
- Daily log (15 хв): progress + blockers

**Friday:**
- Sprint review (що зроблено)
- Self-demo (record video)
- Retro (що покращити next week)

### Git Workflow

```
main (production)
  ↑
develop (staging)
  ↑
feature/v0.x-feature-name
```

**Commits:**
```
feat(v0.1): Complete Foundation & Auth ✅
feat(v0.2): Add Google OAuth integration ✅
feat(v0.2): Add Token Encryption (AES-256) ✅
feat(v0.3): Add Socket.io chat infrastructure
feat(v0.3): Fix ChatGateway TypeError + database persistence
feat(v0.4): Add DTO validation with class-validator
feat(v0.4): Add AI teammate in group chats
fix(v0.5): Crawler timeout on large sites
refactor(v0.2): Optimize GSC API calls
docs(v1.0): Add API documentation
```

---

## 📝 Living Document

**Цей roadmap оновлюється після кожної версії!**

**Tracking:**
- ✅ Completed
- 🔄 In progress
- ⏸️ Blocked/Paused
- 📊 Metrics update

**Version Log:**
- v2.0 - Initial version-based roadmap
- v2.1 - Moved Investor Demo to v0.5 (full Task Manager + Audit)
- v2.2 - v0.1 COMPLETED! 🎉 (15.11.2025)
- v2.3 - v0.2 IN PROGRESS! Backend infrastructure ready (15.11.2025)
- v2.4 - v0.2 OAuth COMPLETE! Dashboard UI pending (15.11.2025, evening)
- v2.5 - v0.2 ЗАВЕРШЕНО! OAuth + Encryption + UI статус (16.11.2025, evening) 🎉
- v2.6 - Integrated improvement_plan.md into roadmap (17.11.2025)

---

**Останнє оновлення:** 17.11.2025  
**Поточна версія:** v0.3 🔄 **IN PROGRESS (50%)**  
**Наступна версія:** v0.4 - AI Teammate + Task Manager + Security (12 днів)

**Keep building! 🚀**