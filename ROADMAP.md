# Forgeline - Development Roadmap

**Версія:** 2.1  
**Дата:** 14.11.2025  
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
**Ціль:** Показати інвесторам killer combo:
- ✅ AI Teammate (в чаті з командою)
- ✅ Повний Task Manager (Schedule/Backlog/Done + AI planning)
- ✅ Site Audit (AI аналіз проблем)
- ✅ Real data з Google APIs

---

### 📦 v0.1 - Foundation & Auth

**Час:** 5 днів  
**Deliverable:** ✅ Можна створити акаунт та залогінитись

**День 1-2: Frontend**
- [ ] Next.js 14 проект (App Router)
- [ ] shadcn/ui + Tailwind CSS setup
- [ ] Базовий layout (Sidebar + Main)
- [ ] Auth pages (Login, Signup, Password Reset UI)
- [ ] Responsive mobile

**День 3-4: Backend**
- [ ] NestJS проект setup
- [ ] PostgreSQL + Prisma ORM
- [ ] User model + Organization model
- [ ] JWT authentication (NextAuth.js)
- [ ] `/auth/login`, `/auth/signup` endpoints
- [ ] Auth middleware (protect routes)

**День 5: Infrastructure & Testing**
- [ ] Docker Compose (postgres + redis)
- [ ] Environment variables (.env.example)
- [ ] Git repo structure (monorepo)
- [ ] End-to-end test: signup → login

**Acceptance Criteria:**
- ✅ User створює account → Organization автоматично
- ✅ User логінится → JWT token працює
- ✅ Sidebar з навігацією видно
- ✅ Mobile responsive

---

### 📦 v0.2 - Google Integration & Dashboard

**Час:** 6 днів  
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
**Deliverable:** ✅ Real-time командний чат працює

**День 1-3: Backend**
- [ ] WebSocket server (Socket.io)
- [ ] Chat model + Message model (DB)
- [ ] ChatMember model (many-to-many)
- [ ] `/chat/create` endpoint
- [ ] `/chat/send-message` endpoint (WebSocket)
- [ ] Real-time message delivery
- [ ] Online status tracking
- [ ] Typing indicators

**День 4-5: Frontend**
- [ ] Chat page (list + messages area)
- [ ] Message bubble components
- [ ] Input field з @mention autocomplete
- [ ] Real-time updates (Socket.io client)
- [ ] Scroll to bottom (new messages)
- [ ] Online status badges

**Acceptance Criteria:**
- ✅ User створює group chat → члени команди бачать
- ✅ User пише повідомлення → доставляється real-time
- ✅ Typing indicators працюють
- ✅ Історія зберігається в БД

---

### 📦 v0.4 - AI Teammate + ПОВНИЙ Task Manager 🔥

**Час:** 10 днів  
**Deliverable:** ✅ AI teammate + Schedule/Backlog/Done + AI planning

**День 1-3: AI Teammate**
- [ ] AI User (seed в БД)
- [ ] Claude API wrapper
- [ ] @AI mention detection
- [ ] Context builder (project data + chat history)
- [ ] AI response handler (WebSocket event)
- [ ] Token counting + cost tracking
- [ ] AI typing indicator
- [ ] AI в окремому чаті
- [ ] AI в групових чатах (@mention)

**День 4-7: Task Manager (Full)**
- [ ] Task model з scheduledDate (DB)
- [ ] `/tasks` CRUD endpoints
- [ ] Tasks page з TABS:
  - [ ] Schedule view (по днях)
  - [ ] Backlog view (без дати)
  - [ ] Done view (completed)
- [ ] Create task modal (з estimated time!)
- [ ] Task detail view
- [ ] Task comments
- [ ] Task tags + filters

**День 7-8: Advanced Task Features**
- [ ] Acceptance workflow:
  - [ ] Modal при assignment
  - [ ] Estimated time input (обов'язковий)
  - [ ] Accept/Decline buttons
- [ ] Group tasks (на всіх членів команди)
- [ ] Drag & drop між днями (react-beautiful-dnd)

**День 9-10: AI Task Features**
- [ ] AI створює tasks з чату
- [ ] AI planning endpoint (`/tasks/ai-schedule`)
- [ ] AI розподіляє backlog на тиждень
- [ ] Integration: chat → tasks (seamless)

**Acceptance Criteria:**
- ✅ User пише "@AI що з трафіком?" → AI відповідає за <3 сек з даними
- ✅ AI має доступ до GSC metrics
- ✅ User пише "@AI створи задачу fix 404" → task з'являється
- ✅ Task з'являється в Backlog
- ✅ Можна перетягнути task на конкретний день → Schedule
- ✅ Коли хтось створює task на мене → acceptance popup
- ✅ AI може розподілити 10 tasks з backlog на тиждень
- ✅ Group task створює копію для кожного члена команди

---

### 📦 v0.5 - Site Audit + AI Analysis 🕷️

**Час:** 7 днів  
**Deliverable:** ✅ Можна запустити аудит + AI знаходить проблеми

**День 1-3: Crawler**
- [ ] Crawlee + Playwright setup
- [ ] Audit model + AuditPage model (DB)
- [ ] BullMQ queue job (background)
- [ ] `/audit/start` endpoint
- [ ] Crawler до 500 pages (demo limit)
- [ ] Progress tracking (WebSocket)

**День 4-5: SEO Checks**
- [ ] Status codes (404, 500, redirects)
- [ ] Meta tags (title, description, missing/duplicates)
- [ ] Headings (H1 missing, multiple H1)
- [ ] Images (missing alt)
- [ ] Links (broken internal/external)
- [ ] Results parser + storage

**День 6: Audit UI**
- [ ] Audit page (list of audits)
- [ ] "Run Audit" button
- [ ] Progress bar real-time
- [ ] Audit results view:
  - [ ] Grouped by severity (critical/warning/info)
  - [ ] Expandable categories
  - [ ] Issue details

**День 7: AI Audit Analysis**
- [ ] AI аналізує audit results
- [ ] Генерує summary + recommendations
- [ ] Priority suggestions
- [ ] "Create tasks from audit" button

**Acceptance Criteria:**
- ✅ User клікає "Run Audit" → crawler стартує
- ✅ Progress bar оновлюється real-time
- ✅ Через 3-5 хв бачимо результати (500 pages)
- ✅ Issues групуються: Critical (🔴), Warning (🟡), Info (🔵)
- ✅ AI генерує summary: "Знайдено 23 проблеми, 5 критичних"
- ✅ AI рекомендує що робити першим
- ✅ Можна створити tasks з audit results

---

## 🎬 Investor Demo Script (після v0.5)

**Тривалість:** 7-10 хвилин

**1. Quick Intro (30 сек)**
```
"Forgeline - перша SEO платформа де AI = член команди.
 Показую як це працює на реальних даних."
```

**2. Login & Overview (30 сек)**
```
Швидкий логін
Dashboard з real GSC data
"Всі дані синхронізуються автоматично з Google"
```

**3. AI Teammate Demo** 🔥 **(3 хв)**
```
Відкрити group chat

User: "@AI що сталось з трафіком цього тижня?"

AI: "Проаналізував site-a.com за останній тиждень.
     
     📉 Зміни:
     • Clicks: 450 → 350 (-22%)
     • Impressions: 12,000 → 10,200 (-15%)
     • CTR: 3.75% → 3.43%
     
     🔍 Причини:
     1. Google Core Update (15.10) - ймовірно вплинув
     2. Competitor запустив 3 нові статті про [topic]
     3. Сезонний фактор (спад інтересу)
     
     ✅ Рекомендації:
     1. Перевірити якість контенту (після update)
     2. Competitor analysis (що вони додали?)
     3. Моніторити ще тиждень
     
     Створити задачі?"

User: "Так, створи"

AI: "✅ Створив 3 задачі:
     1. Content quality audit
     2. Competitor analysis
     3. Weekly monitoring setup"
```

**"Бачите - AI має повний контекст проекту. Він не просто 
  чатбот, він teammate який розуміє дані!"**

**4. Task Manager Demo** **(2 хв)**
```
Відкрити Tasks page

"Бачимо Schedule на тиждень - AI щойно створив tasks"

[Показати 3 щойно створені tasks]

User: "AI розподіли всі задачі з backlog на тиждень"

AI: "✅ Розподілив 12 tasks:
     Понеділок: 3 tasks (7h)
     Вівторок: 4 tasks (7.5h)
     ..."

[Tasks автоматично розкладаються по днях]

"AI враховує estimated time, deadlines, priorities"

[Drag & drop task з вівторка на середу]

"Можна manually коригувати якщо потрібно"
```

**5. Site Audit Demo** **(2 хв)**
```
User: "Запусти аудит site-a.com"

[Progress bar 0% → 100%]

"Crawler обходить сайт, AI аналізує проблеми"

[Через 2-3 хв готово]

Results:
🔴 Critical (5):
   • 15 pages with 404
   • Multiple H1 on 8 pages
   
🟡 Warning (18):
   • Missing meta descriptions (23)
   • Images without alt (45)

AI Summary:
"Головна проблема - 404 помилки на важливих сторінках.
 Рекомендую виправити першим пріоритетом."

[Create tasks from audit]
→ Tasks з'являються в backlog
```

**6. Vision & Close** **(1 хв)**
```
"Це v0.5 - investor demo версія.

 До v1.0 (Public Launch) додамо:
 • Автоматичні звіти (Google Docs)
 • Розумні notifications
 • Scheduled AI tasks (виконання без участі user)
 • Email/Telegram інтеграції
 
 Roadmap: 83 дні до v1.0
 
 Унікальність: AI як teammate, а не просто tool.
 
 Питання?"
```

**Ключові меседжі для інвесторів:**
- ✅ "All-in-one платформа (chat + tasks + data + AI)"
- ✅ "AI має контекст, не просто Q&A"
- ✅ "Заміна 3-4 інструментів одним"
- ✅ "95% економії часу на рутині"
- ✅ "BYOK модель = необмежене масштабування"

---

## 📊 MILESTONE 2: Beta Version (v0.6 → v0.8)

**Загальний час:** 30 днів  
**Ціль:** Готова платформа для 10-20 beta users

---

### 📦 v0.6 - Google APIs (Full) + Data Collection

**Час:** 8 днів  
**Deliverable:** ✅ GA4 + Docs/Sheets export + щоденний збір

**День 1-2: Google Analytics GA4**
- [ ] GA4 API integration
- [ ] `/api/ga4/metrics` endpoint
- [ ] GA4 widget на dashboard
- [ ] Metrics: sessions, organic, bounce rate

**День 3: Google Drive API**
- [ ] Drive API wrapper
- [ ] File upload/download
- [ ] Folder structure

**День 4: Google Docs API**
- [ ] Docs API wrapper
- [ ] Document creation
- [ ] Text formatting (headings, bold, lists)
- [ ] Table insertion

**День 5: Google Sheets API**
- [ ] Sheets API wrapper
- [ ] Sheet creation
- [ ] Data export (arrays → cells)
- [ ] Formatting (headers, borders)

**День 6-8: Cron Jobs & Data Collection**
- [ ] BullMQ setup (queue)
- [ ] Cron job: daily data collection (06:00)
- [ ] DataSnapshot model (DB)
- [ ] Збір GSC + GA4 metrics
- [ ] Storage snapshots
- [ ] Error handling + retry

**Acceptance Criteria:**
- ✅ GA4 metrics на dashboard
- ✅ Можна експортувати в Docs (форматований)
- ✅ Можна експортувати в Sheets (таблиця)
- ✅ Щоранку о 06:00 дані збираються автоматично

---

### 📦 v0.7 - AI Analysis & Morning Brief

**Час:** 6 днів  
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

---

## 🧪 Beta Testing (1 тиждень після v0.8)

**Запрошуємо:** 10-20 користувачів

**Сегменти:**
- SEO фрілансери (5-7)
- Малі агентства 5-10 людей (3-5)
- Інхаус SEO команди (2-3)

**Що тестуємо:**
- [ ] Onboarding (чи зрозуміло?)
- [ ] Core features (чи працює?)
- [ ] AI responses (чи корисні?)
- [ ] Performance (чи швидко?)
- [ ] Bugs (список issues)

**Feedback:**
- [ ] In-app feedback form
- [ ] Weekly video calls (30 хв кожен)
- [ ] Usage analytics (PostHog або Mixpanel)
- [ ] NPS survey

---

## 🚀 MILESTONE 3: Public Launch (v0.9 → v1.0)

**Загальний час:** 20 днів  
**Ціль:** Production-ready для публічного запуску

---

### 📦 v0.9 - Reports & Settings

**Час:** 8 днів  
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
**Deliverable:** ✅ ГОТОВО ДО ПУБЛІЧНОГО ЗАПУСКУ!

**День 1-4: Security**
- [ ] Security audit (OWASP checklist):
  - [ ] SQL injection prevention
  - [ ] XSS sanitization
  - [ ] CSRF protection
  - [ ] API rate limiting (100 req/min)
  - [ ] Password strength validation
- [ ] Encryption audit (API keys, tokens)
- [ ] Row-level security (RLS) check
- [ ] Auth flow review

**День 5-6: Performance**
- [ ] Database indexes optimization
- [ ] N+1 queries elimination
- [ ] Redis caching (API responses)
- [ ] Frontend bundle optimization:
  - [ ] Code splitting
  - [ ] Lazy loading
  - [ ] Image optimization
- [ ] API response time <200ms (p95)
- [ ] Lighthouse score >90

**День 7-8: Monitoring & DevOps**
- [ ] Sentry setup (error tracking)
- [ ] Winston logging (backend)
- [ ] Health check endpoints
- [ ] Uptime monitoring (UptimeRobot)
- [ ] Performance monitoring (Vercel Analytics)
- [ ] Alert rules (email/Slack)

**День 9-10: Final Polish**
- [ ] UI consistency final check
- [ ] Empty states review
- [ ] Error messages (user-friendly)
- [ ] Success feedback
- [ ] Accessibility audit (WCAG AA)
- [ ] Browser compatibility (Chrome, Firefox, Safari)

**День 11: Deployment**
- [ ] Production build (Next.js + NestJS)
- [ ] Vercel deployment (frontend)
- [ ] Railway deployment (backend)
- [ ] Database migration (production)
- [ ] Redis setup (Upstash production)
- [ ] CDN configuration
- [ ] SSL certificates
- [ ] Custom domain setup
- [ ] Environment variables (production)
- [ ] Backup strategy setup

**День 12: Launch Prep**
- [ ] Landing page (separate)
- [ ] Pricing page
- [ ] Blog (2-3 SEO articles)
- [ ] Product Hunt submission
- [ ] Terms of Service
- [ ] Privacy Policy
- [ ] GDPR compliance
- [ ] Email templates (welcome, password reset)
- [ ] Support email setup

**🚀 LAUNCH DAY!**

**Checklist:**
- ✅ Production stable (99.9% uptime)
- ✅ Zero critical bugs
- ✅ Lighthouse >90
- ✅ Onboarding smooth
- ✅ Product Hunt live
- ✅ Landing page live
- ✅ Can accept payments (Stripe)
- ✅ Support ready

---

## 📊 Success Metrics

### v0.5 (Investor Demo)
- ✅ Demo проходить 5/5 разів без збоїв
- ✅ AI відповідає за <3 сек
- ✅ Audit завершується за <5 хв (500 pages)
- ✅ WOW ефект у 8/10 інвесторів

### v0.8 (Beta)
- ✅ 15+ активних beta users
- ✅ 70%+ retention після першого тижня
- ✅ NPS >40
- ✅ <10 bugs (non-critical)

### v1.0 (Launch)
- ✅ 100+ sign-ups перший місяць
- ✅ 30%+ conversion Free → Paid
- ✅ 99.9% uptime
- ✅ <1% churn

---

## ⚠️ Ризики та мітігація

### Технічні

**Ризик:** AI responses повільні (>5 сек)
- **Мітігація:** Caching, streaming, progress indicators
- **Plan B:** Fallback на GPT-4o

**Ризик:** Crawler падає на великих сайтах
- **Мітігація:** Timeout handling, retry, chunking
- **Plan B:** Limit 1K pages Free plan

**Ризик:** Google APIs rate limits
- **Мітігація:** Batch requests, caching, throttling
- **Plan B:** Clear warnings користувачам

### Часові

**Ризик:** v0.5 не готова за 33 дні
- **Мітігація:** Weekly sprints, ruthless prioritization
- **Plan B:** Demo на v0.4 (без Audit), Audit показати окремо

**Ризик:** Beta feedback major changes
- **Мітігація:** MVP scope locked, hot fixes only
- **Plan B:** Major features → Phase 2

### Бізнес

**Ризик:** Інвестори не бачать value
- **Мітігація:** Killer demo script, metrics
- **Plan B:** Bootstrap до revenue

**Ризик:** Конкуренти копіюють
- **Мітігація:** Speed (v1.0 за 83 дні!)
- **Plan B:** Network effects, brand

---

## 👥 Team & Resources

### Solo (v0.1 → v0.5, 33 дні)

**Володимир:**
- Frontend: 40%
- Backend: 40%
- DevOps: 10%
- Product: 10%

**Hours:** 60-80 год/тиждень (intense sprint!)

### Optional після v0.5

**Якщо funding:**
- Frontend dev: $3-5K/міс
- Backend dev: $3-5K/міс

**Якщо bootstrap:**
- Solo до v0.8
- Hire після paying customers

---

## 💰 Budget (Infrastructure)

### v0.1 → v0.5 (Development)
```
Vercel: $0 (Hobby)
Railway: $5/міс
Supabase: $0 (Free)
Domain: $12/рік
─────────────
Total: ~$10/міс
```

### v0.6 → v0.8 (Beta)
```
Vercel: $20/міс (Pro)
Railway: $20/міс
Supabase: $25/міс
Redis: $10/міс
Sentry: $0 (Dev)
─────────────
Total: ~$75/міс
```

### v1.0 (Production)
```
Vercel: $20/міс
Railway: $50/міс
Supabase: $25/міс
Redis: $10/міс
Sentry: $26/міс
CDN: $10/міс
Monitoring: $10/міс
─────────────
Total: ~$150/міс
```

**Break-even:** 3-5 Pro users

---

## 📅 Timeline Visualization

```
v0.1 ████ 5д
v0.2 ██████ 6д
v0.3 █████ 5д
v0.4 ██████████ 10д
v0.5 ███████ 7д
     └─ INVESTOR DEMO (33 дні) ✅

v0.6 ████████ 8д
v0.7 ██████ 6д
v0.8 ████████████████ 16д
     └─ BETA VERSION (30 днів) ✅

v0.9 ████████ 8д
v1.0 ████████████ 12д
     └─ PUBLIC LAUNCH (20 днів) 🚀

═══════════════════════════════════════
TOTAL: 83 робочих дні (16-17 тижнів)
```

**Key Milestones:**
- 📍 День 33: Investor Demo Ready 🔥
- 📍 День 63: Beta Launch 🧪
- 📍 День 83: v1.0 Public Launch! 🎉

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

---

**v1.0 or bust! Let's ship! 🚀**

**Володимир, готовий до v0.1?** 💪