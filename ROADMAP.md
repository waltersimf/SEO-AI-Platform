# Forgeline - Development Roadmap

**Версія:** 2.2  
**Дата:** 15.11.2025  
**Формат:** Версійна розробка (як Auditor)

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

## 🔥 MILESTONE 1: Investor Demo (v0.1 → v0.5)

**Загальний час:** 33 дні  
**Прогрес:** 1/5 версій (20%) ✅  
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

**Результат:** 🎉 Повноцінний робочий прототип! Dashboard працює, auth працює, база готова.

---

### 📦 v0.2 - Google Integration & Dashboard

**Час:** 6 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Реальні дані з Google Search Console на dashboard

**День 1-2: Google OAuth**
- [ ] Google OAuth flow (Passport.js)
- [ ] `/integrations/google/connect` endpoint
- [ ] `/integrations/google/callback` endpoint
- [ ] Token encryption (AES-256)
- [ ] Integration model (DB)

**День 3-4: Google Search Console API**
- [ ] GSC API wrapper
- [ ] `/api/gsc/metrics` endpoint
- [ ] Token refresh logic
- [ ] Error handling (expired tokens)

**День 5-6: Dashboard UI**
- [ ] Dashboard page
- [ ] 2-3 графіки (recharts): clicks, impressions, CTR
- [ ] Loading states + skeletons
- [ ] Error handling UI
- [ ] Responsive grid

**Acceptance Criteria:**
- ✅ "Connect Google" button → OAuth popup → success
- ✅ Після auth бачимо GSC дані на dashboard
- ✅ Графіки показують last 30 days
- ✅ Токени encrypted в БД

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
- ✅ "@AI що з трафіком?" → AI відповідає за <3 сек
- ✅ AI має доступ до GSC metrics
- ✅ "@AI створи задачу" → task створюється
- ✅ Schedule + Backlog + Done працюють
- ✅ Acceptance popup при assignment
- ✅ AI може розподілити backlog на тиждень
- ✅ Group task для всіх членів команди

---

### 📦 v0.5 - Site Audit + AI Analysis 🕷️

**Час:** 7 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Можна запустити аудит + AI знаходить проблеми

**День 1-3: Crawler**
- [ ] Crawlee + Playwright setup
- [ ] Crawler до 500 pages
- [ ] SEO checks:
  - [ ] HTTP status codes
  - [ ] Meta tags (title, description)
  - [ ] Headings structure
  - [ ] Images (alt, size)
  - [ ] Internal/external links
- [ ] BullMQ queue setup
- [ ] Progress tracking

**День 4-5: Real-time Progress**
- [ ] WebSocket events (progress update)
- [ ] Frontend: progress bar
- [ ] ETA calculation
- [ ] Cancel crawl option

**День 6-7: AI Analysis**
- [ ] AI prompt: audit analysis
- [ ] Claude API call (batch)
- [ ] Parse results → structured format
- [ ] AI generates:
  - [ ] Summary (1-2 paragraphs)
  - [ ] Top 10 issues
  - [ ] Recommendations
  - [ ] Priority scores
- [ ] "Create Tasks" button
- [ ] Auto-create tasks from AI findings

**Acceptance Criteria:**
- ✅ User клікає "Run Audit" → crawler стартує
- ✅ Progress bar real-time
- ✅ Результати за 3-5 хв (500 pages)
- ✅ AI генерує summary + рекомендації
- ✅ Можна створити tasks з результатів

**🎉 MILESTONE 1 COMPLETE!** → **Investor Demo Ready!**

---

## 🧪 MILESTONE 2: Beta Version (v0.6 → v0.8)

**Загальний час:** 30 днів  
**Ціль:** Розширити функціонал + залучити beta users

---

### 📦 v0.6 - Google APIs (Full) + Data Collection

**Час:** 8 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Всі Google APIs + щоденний збір даних

**День 1-3: Google Analytics GA4**
- [ ] GA4 API integration
- [ ] Metrics: users, sessions, bounce rate
- [ ] Dashboard widgets

**День 4-5: Google Drive/Docs/Sheets**
- [ ] Drive API (list files)
- [ ] Docs API (export reports)
- [ ] Sheets API (export data)

**День 6-8: Data Collection**
- [ ] DataSnapshot model (DB)
- [ ] Cron job (daily 06:00)
- [ ] Collect from GSC + GA4
- [ ] Store snapshots
- [ ] Comparison logic

**Acceptance Criteria:**
- ✅ GA4 дані на dashboard
- ✅ Можна експортувати в Docs
- ✅ Можна експортувати в Sheets (таблиця)
- ✅ Щоранку о 06:00 дані збираються автоматично

---

### 📦 v0.7 - AI Analysis & Morning Brief

**Час:** 6 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ AI аналізує зміни + генерує morning brief

**День 1-3: AI Analysis Engine**
- [ ] Analysis model (DB)
- [ ] Compare snapshots (current vs previous)
- [ ] AI prompt: аналіз змін
- [ ] Claude API call (batch)
- [ ] Parse AI response (structured JSON)
- [ ] Save analysis results
- [ ] Severity detection (info/warning/critical)

**День 4-5: Morning Brief**
- [ ] Morning brief endpoint
- [ ] AI генерує summary всіх проектів
- [ ] UI: brief section на dashboard
- [ ] Critical issues highlight
- [ ] Project cards з статусами

**День 6: Notifications (Basic)**
- [ ] Notification model (DB)
- [ ] WebSocket: notification events
- [ ] Trigger: critical data changes
- [ ] Simple toast popup (top-right)

**Acceptance Criteria:**
- ✅ User відкриває dashboard → бачить готовий morning brief
- ✅ AI показує що змінилось у кожному проекті
- ✅ Critical issues виділені червоним
- ✅ При критичній проблемі → notification popup

---

### 📦 v0.8 - Notifications (Full) & Polish

**Час:** 16 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Розумна система notifications + UI polish

**День 1-6: Notification System**
- [ ] Notification Stack (floating right, як CK3)
- [ ] Notification card (collapsed/expanded)
- [ ] Auto-collapse старих
- [ ] Групування (type + project)
- [ ] Інтерактивні actions:
  - [ ] View Details
  - [ ] Create Tasks
  - [ ] Dismiss
- [ ] Sound effects (optional)
- [ ] Notification settings:
  - [ ] Enable/disable sounds
  - [ ] Volume control
  - [ ] Do not disturb hours

**День 7-10: Recurring Tasks**
- [ ] Recurring pattern (daily, weekly, monthly, custom)
- [ ] RecurringTask model (DB)
- [ ] Cron job: create instances
- [ ] UI: recurring indicator
- [ ] Edit recurring task (this one / all future)

**День 11-13: Advanced Crawler**
- [ ] Crawl до 5K pages
- [ ] Parallel crawling optimization
- [ ] Scheduled crawls (weekly/monthly)
- [ ] Audit history + comparison UI
- [ ] Performance improvements

**День 14-16: UI/UX Polish**
- [ ] Loading states everywhere
- [ ] Error boundaries
- [ ] Empty states (красиві)
- [ ] Animations (framer-motion)
- [ ] Mobile responsive final check
- [ ] Consistency check (buttons, spacing)
- [ ] Success toasts
- [ ] Loading skeletons

**Acceptance Criteria:**
- ✅ Notifications працюють як в CK3 (stack справа)
- ✅ Recurring tasks створюють instances автоматично
- ✅ Crawler може обробити 5K pages за 10-15 хв
- ✅ UI виглядає професійно + mobile готово
- ✅ Lighthouse score >85

**🧪 MILESTONE 2 COMPLETE!** → **Beta Version Ready!**

---

## 🚀 MILESTONE 3: Public Launch (v0.9 → v1.0)

**Загальний час:** 20 днів  
**Ціль:** Production-ready для публічного запуску

---

### 📦 v0.9 - Reports & Settings

**Час:** 8 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ AI звіти + Team management

**День 1-4: Reports Generation**
- [ ] Report model (DB)
- [ ] AI report generation (Claude)
- [ ] Report templates:
  - [ ] Weekly Summary
  - [ ] Monthly Report
  - [ ] Audit Report
- [ ] Export to Google Docs (formatted)
- [ ] Export to Google Sheets
- [ ] PDF export (Puppeteer) - optional
- [ ] Scheduled reports (cron)

**День 5-6: Settings Pages**
- [ ] User settings:
  - [ ] Profile (name, email, avatar)
  - [ ] Password change
  - [ ] Work schedule
  - [ ] Notification preferences
- [ ] Organization settings:
  - [ ] Org info (name, logo)
  - [ ] Plan management
  - [ ] Usage stats

**День 7-8: Team Management**
- [ ] Invite user (email)
- [ ] Invite link generation
- [ ] Team members list
- [ ] Role assignment (Admin, SEO, AM)
- [ ] Remove user
- [ ] Permissions check

**Acceptance Criteria:**
- ✅ AI генерує професійний звіт за 30-60 сек
- ✅ Експорт у Docs виглядає гарно
- ✅ Admin може запросити teammate
- ✅ Різні ролі мають різні права

---

### 📦 v1.0 - Production Launch! 🎉

**Час:** 12 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ ГОТОВО ДО ПУБЛІЧНОГО ЗАПУСКУ!

**День 1-3: Security & Performance**
- [ ] Security audit (OWASP Top 10)
- [ ] Rate limiting
- [ ] Input validation hardening
- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Performance optimization:
  - [ ] DB query optimization
  - [ ] Caching strategy (Redis)
  - [ ] CDN setup
  - [ ] Image optimization

**День 4-6: Monitoring & Logging**
- [ ] Sentry integration
- [ ] Error tracking
- [ ] Performance monitoring
- [ ] Logging (Winston)
- [ ] Alerts (critical errors)
- [ ] Uptime monitoring (UptimeRobot)

**День 7-9: Production Deployment**
- [ ] Vercel (frontend)
- [ ] Railway (backend)
- [ ] Supabase (database)
- [ ] Upstash (redis)
- [ ] Environment variables
- [ ] SSL certificates
- [ ] Custom domain
- [ ] CI/CD pipeline (GitHub Actions)

**День 10-12: Final Polish & Launch**
- [ ] Landing page
- [ ] Product tour (onboarding)
- [ ] Documentation:
  - [ ] Getting Started
  - [ ] API docs
  - [ ] FAQ
- [ ] Pricing page
- [ ] Stripe integration (payments)
- [ ] Product Hunt submission
- [ ] Social media announce

**Acceptance Criteria:**
- ✅ Production stable (99.9% uptime)
- ✅ Lighthouse score >90
- ✅ Zero critical bugs
- ✅ Security audit passed
- ✅ Product Hunt live
- ✅ Can accept payments
- ✅ Onboarding < 5 min
- ✅ First 10 customers

**🎉 v1.0 LAUNCH!** → **Public Available!**

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
- ⏸️ Blocked
- 📊 Metrics update

**Version Log:**
- v2.0 - Initial version-based roadmap
- v2.1 - Moved Investor Demo to v0.5 (full Task Manager + Audit)
- v2.2 - v0.1 COMPLETED! 🎉 (15.11.2025)

---

## 📊 Progress Tracker

```
v0.1 ████████████████████ 100% ✅
v0.2 ░░░░░░░░░░░░░░░░░░░░   0%
v0.3 ░░░░░░░░░░░░░░░░░░░░   0%
v0.4 ░░░░░░░░░░░░░░░░░░░░   0%
v0.5 ░░░░░░░░░░░░░░░░░░░░   0%
     └─ INVESTOR DEMO: 20% ✅

v0.6 ░░░░░░░░░░░░░░░░░░░░   0%
v0.7 ░░░░░░░░░░░░░░░░░░░░   0%
v0.8 ░░░░░░░░░░░░░░░░░░░░   0%
     └─ BETA VERSION: 0%

v0.9 ░░░░░░░░░░░░░░░░░░░░   0%
v1.0 ░░░░░░░░░░░░░░░░░░░░   0%
     └─ PUBLIC LAUNCH: 0%

═══════════════════════════════════════
MILESTONE 1 (Investor Demo): 20% (1/5) ✅
MILESTONE 2 (Beta):           0% (0/3)
MILESTONE 3 (Launch):         0% (0/2)
═══════════════════════════════════════
TOTAL PROGRESS: 10% (1/10 versions) ✅
```

**До наступних milestones:**
- 🔥 Investor Demo (v0.5): 32 дні
- 🧪 Beta (v0.8): 62 дні
- 🚀 Launch (v1.0): 82 дні

---

**Останнє оновлення:** 15.11.2025  
**Поточна версія:** v0.1 ✅  
**Наступна версія:** v0.2 - Google Integration & Dashboard

**v0.1 Complete! Next: v0.2! 🚀**