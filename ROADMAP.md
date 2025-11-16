# Forgeline - Development Roadmap

**Версія:** 2.5  
**Дата:** 16.11.2025 (вечір)  
**Формат:** Версійна розробка

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
v0.2 ████████████████████ 100% ✅ (OAuth + Encryption DONE!)
v0.3 ░░░░░░░░░░░░░░░░░░░░   0%
v0.4 ░░░░░░░░░░░░░░░░░░░░   0%
v0.5 ░░░░░░░░░░░░░░░░░░░░   0%
     └─ INVESTOR DEMO: 40% 🔄

v0.6 ░░░░░░░░░░░░░░░░░░░░   0%
v0.7 ░░░░░░░░░░░░░░░░░░░░   0%
v0.8 ░░░░░░░░░░░░░░░░░░░░   0%
     └─ BETA VERSION: 0%

v0.9 ░░░░░░░░░░░░░░░░░░░░   0%
v1.0 ░░░░░░░░░░░░░░░░░░░░   0%
     └─ PUBLIC LAUNCH: 0%

═══════════════════════════════════════
MILESTONE 1 (Investor Demo): 40% (2/5) 🔄
MILESTONE 2 (Beta):           0% (0/3)
MILESTONE 3 (Launch):         0% (0/2)
═══════════════════════════════════════
TOTAL PROGRESS: 20% (2/10 versions) 🔄
```

**До наступних milestones:**
- 🔥 Investor Demo (v0.5): ~26 днів
- 🧪 Beta (v0.8): ~56 днів
- 🚀 Launch (v1.0): ~76 днів

---

## 🔥 MILESTONE 1: Investor Demo (v0.1 → v0.5)

**Загальний час:** 33 дні  
**Прогрес:** 2/5 версій (40%) 🔄  
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

**День 1-2: Frontend** ✅
- [✅] Next.js 14 проект (App Router)
- [✅] shadcn/ui + Tailwind CSS setup
- [✅] Базовий layout (Sidebar + Main)
- [✅] Auth pages (Login, Signup, Password Reset UI)
- [✅] Responsive mobile

**День 3-4: Backend** ✅
- [✅] NestJS проект setup
- [✅] PostgreSQL + Prisma ORM
- [✅] User model + Organization model
- [✅] JWT authentication
- [✅] `/auth/login`, `/auth/signup` endpoints
- [✅] Auth middleware (protect routes)

**День 5: Infrastructure & Testing** ✅
- [✅] Docker Compose (postgres + redis)
- [✅] Environment variables (.env)
- [✅] Git repo structure (monorepo)
- [✅] End-to-end test: signup → login

**Acceptance Criteria - ВСІ ПРОЙДЕНІ:** ✅
- [✅] User створює account → Organization автоматично
- [✅] User логінится → JWT token працює
- [✅] Sidebar з навігацією видно
- [✅] Mobile responsive

---

### 📦 v0.2 - Google Integration & Dashboard

**Час:** 6 днів → **Фактично: 2 дні**  
**Статус:** ✅ **ЗАВЕРШЕНО** (16.11.2025)  
**Deliverable:** ✅ Google OAuth + зашифровані токени + UI статус

**День 1-2: Google OAuth** ✅ **DONE!**
- [✅] Integration model (DB) - Prisma schema
- [✅] Prisma migration applied
- [✅] IntegrationsModule (NestJS)
- [✅] IntegrationsService (CRUD)
- [✅] IntegrationsController (REST endpoints)
- [✅] Google OAuth flow (Passport.js + GoogleStrategy)
- [✅] `/api/integrations/google/connect` endpoint
- [✅] `/api/integrations/google/callback` endpoint
- [✅] Google Cloud Console OAuth client setup
- [✅] Token storage в БД
- [✅] OAuth flow tested end-to-end
- [✅] **Token Encryption (AES-256-GCM)** 🔐
- [✅] **JWT_SECRET без fallback**
- [✅] **organizationId через req.user (dynamic)**

**День 3-4: UI Components** ✅ **DONE!**
- [✅] GoogleConnectButton component
- [✅] Auto-detection статусу (check endpoint)
- [✅] "✅ Connected" status display
- [✅] Seamless OAuth redirect flow
- [✅] Error handling UI
- [✅] Loading states

**Проблеми що вирішили:**
1. ✅ `redirect_uri_mismatch` - додали `/api` prefix в callback URL
2. ✅ `OAuth2Strategy requires clientID` - додали GoogleStrategy в providers
3. ✅ `Foreign key constraint` - використали реальний UUID organizationId
4. ✅ `access_denied 403` - додали test user в Google Console
5. ✅ `EADDRINUSE port 4000` - kill-port before restart
6. ✅ `refreshToken = NULL` - використали authorizationParams() method
7. ✅ `Unique constraint failed` - видалення старих записів перед новим OAuth
8. ✅ Token encryption implementation (crypto.createCipheriv)
9. ✅ Dynamic organizationId через JWT guard
10. ✅ Button з auto-check через GET /integrations/:provider

**Acceptance Criteria - ВСІ ПРОЙДЕНІ:** ✅
- [✅] "Connect Google" button → OAuth popup → success
- [✅] Dashboard показує "✅ Connected" статус
- [✅] Токени encrypted в БД (AES-256-GCM)
- [✅] organizationId динамічний (req.user.organizationId)
- [✅] JWT_SECRET без fallback
- [✅] Error handling працює
- [✅] UI responsive та user-friendly

**Реальний час:** ~5 годин активної роботи (з troubleshooting)

**Поточний стан (16.11.2025, вечір):**
- ✅ OAuth infrastructure 100% complete
- ✅ Tokens зашифровані в БД
- ✅ Dashboard показує connection status
- ✅ Security improvements (encryption + JWT)
- ✅ Production-ready OAuth flow

---

### 📦 v0.3 - Chat Infrastructure

**Час:** 5 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Real-time командний чат працює

**День 1-3: Backend**
- [ ] WebSocket server (Socket.io)
- [ ] Chat model + Message model (DB)
- [ ] ChatMember model (many-to-many)
- [ ] `/chat/create` endpoint
- [ ] `/chat/send-message` endpoint
- [ ] Real-time events (message, typing, online)

**День 4-5: Frontend**
- [ ] Chat list (sidebar)
- [ ] Chat window + messages
- [ ] Message input + send
- [ ] Typing indicators
- [ ] Online status
- [ ] @mention autocomplete (basic)

**Acceptance Criteria:**
- ✅ Group chat створюється для organization
- ✅ Messages з'являються real-time
- ✅ Typing indicators працюють
- ✅ Історія зберігається в БД

---

### 📦 v0.4 - AI Teammate + Task Manager (Full) 🔥

**Час:** 10 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ AI teammate + повний Task Manager

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

**Acceptance Criteria:**
- ✅ "@AI що з трафіком?" → AI відповідає з даних GSC
- ✅ AI створює task коли попросять
- ✅ Task Manager повністю працює (3 views)
- ✅ Acceptance workflow smooth
- ✅ Group tasks working

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

### 📦 v0.6 - Google APIs (Full) + Data Collection

**Час:** 8 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Всі Google APIs + щоденний збір

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

**Acceptance Criteria:**
- ✅ Всі Google APIs працюють
- ✅ Щоденний збір без помилок
- ✅ Dashboard з повними даними

---

### 📦 v0.7 - AI Analysis & Morning Brief

**Час:** 6 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ AI аналізує зміни + morning brief

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

**Acceptance Criteria:**
- ✅ AI аналізує зміни щодня
- ✅ Morning brief генерується о 7:00
- ✅ Email надходить користувачам

---

### 📦 v0.8 - Notifications (Full) + Polish

**Час:** 16 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Розумні notifications + повний polish

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

**День 13-16: UI/UX Polish**
- [ ] Performance optimization
- [ ] Loading improvements
- [ ] Error handling polish
- [ ] Accessibility fixes
- [ ] Mobile improvements

**Acceptance Criteria:**
- ✅ Notifications працюють smooth
- ✅ Recurring tasks виконуються
- ✅ Crawler обробляє 5K pages
- ✅ Lighthouse score >85
- ✅ **BETA READY!** 🧪

---

## 🚀 MILESTONE 3: Public Launch (v0.9 → v1.0)

### 📦 v0.9 - Reports & Team Management

**Час:** 10 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Reports + повне team management

**День 1-5: Reports System**
- [ ] Report templates
- [ ] Custom reports
- [ ] Scheduled reports
- [ ] Export formats (PDF, Docs, Sheets)

**День 6-10: Team Management**
- [ ] Invite users
- [ ] Role permissions
- [ ] User activity log
- [ ] Usage tracking per user

**Acceptance Criteria:**
- ✅ Reports генеруються
- ✅ Team management працює
- ✅ Permissions enforcement

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

---

**Останнє оновлення:** 16.11.2025, evening  
**Поточна версія:** v0.2 ✅ **ЗАВЕРШЕНО!** 🎉  
**Наступна версія:** v0.3 - Chat Infrastructure (5 днів)

**Keep building! 🚀**