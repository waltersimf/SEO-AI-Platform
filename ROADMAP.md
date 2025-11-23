# 🗺️ ROADMAP - Forgeline SEO AI Platform

**Загальна тривалість:** 75 днів (10.7 тижнів) до Public Launch  
**Поточний прогрес:** v0.3.1 ЗАВЕРШЕНО! v0.4 AI Teammate next 🤖

---

## 📊 Версії та прогрес

| Версія | Статус | Прогрес | Тривалість | Deliverable |
|--------|--------|---------|------------|-------------|
| v0.1 | ✅ DONE | 100% | 5 днів | Auth + DB |
| v0.2 | ✅ DONE | 100% | 5 днів | Dashboard UI |
| v0.3 | ✅ DONE | 100% | 7 днів | Chat System |
| **v0.3.1** | **✅ DONE** | **100%** | **1 день** | **Production Ready** |
| v0.4 | 📋 PLANNED | 0% | 14 днів | **AI Teammate** 🤖 |
| v0.5 | 📋 PLANNED | 0% | 8 днів | Projects |
| v0.6 | 📋 PLANNED | 0% | 7 днів | Tasks + Backlog |
| v0.7 | 📋 PLANNED | 0% | 10 днів | Chat Polish + Invite |
| v0.8 | 📋 PLANNED | 0% | 8 днів | AI Analysis |
| v0.9 | 📋 PLANNED | 0% | 10 днів | Notifications |
| v1.0 | 📋 PLANNED | 0% | 10 днів | Launch Prep |
| **Total** | | | **75 днів** | Public Launch |

---

## 🎯 Milestone Timeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ✅ v0.1-0.3.1 (18d)  📋 v0.4 (14d)   📋 v0.5-0.6 (15d)                │
│  Auth + Chat +        AI Teammate     Projects + Tasks                  │
│  Production Ready                                                        │
│  ─────────────────────────────────────────────────────────              │
│                                                                          │
│  📋 v0.7 (10d)       📋 v0.8 (8d)    📋 v0.9 (10d)    📋 v1.0 (10d)   │
│  Chat Polish +       AI Analysis +   Notifications +   Launch Prep +    │
│  Invite System       Morning Brief   Full Polish       Security         │
│  ──────────────────────────────────────────────────────────────────     │
│                                                                          │
│                           🎉 PUBLIC LAUNCH 🎉                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Загальна тривалість:** ~75 днів (2.5 місяці)  
**Target Launch:** Лютий 2026

---

## 📦 v0.1 - Auth & Database (ЗАВЕРШЕНО ✅)

**Час:** 5 днів  
**Статус:** ✅ DONE  
**Deliverable:** ✅ Users can signup/login

- [x] Prisma schema (User, Organization, Project)
- [x] JWT authentication
- [x] Signup/Login API endpoints
- [x] Password hashing (bcrypt)
- [x] Protected routes middleware
- [x] Multi-tenancy (organization-based)
- [x] Docker Compose (PostgreSQL, Redis)

**Acceptance Criteria:**
- ✅ Users can create account
- ✅ Users can login
- ✅ JWT tokens work
- ✅ Database seeding works

---

## 📦 v0.2 - Dashboard UI (ЗАВЕРШЕНО ✅)

**Час:** 5 днів  
**Статус:** ✅ DONE  
**Deliverable:** ✅ Basic dashboard layout

- [x] Sidebar navigation
- [x] Dashboard layout
- [x] shadcn/ui components
- [x] Responsive design
- [x] Auth pages (login/signup UI)
- [x] Protected dashboard route

**Acceptance Criteria:**
- ✅ Dashboard accessible after login
- ✅ Sidebar with menu items
- ✅ Responsive on mobile
- ✅ Logout works

---

## 📦 v0.3 - Chat System (✅ ЗАВЕРШЕНО - 100%)

Час: 7 днів (16.11.2025 → 22.11.2025)
Статус: ✅ **COMPLETE** (100%)
**Deliverable:** ✅ Team can chat in real-time

### Completed Features ✅

**Backend:**
- [x] Chat database schema (Chat, ChatMember, Message)
- [x] Chat REST API (CRUD operations)
- [x] WebSocket Gateway (Socket.io)
- [x] Real-time message broadcasting
- [x] Room-based messaging
- [x] Online status tracking
- [x] Unread message counters
- [x] Direct chat helper endpoint

**Frontend:**
- [x] ChatList component (sidebar)
- [x] ChatOverlay component (right panel)
- [x] Socket.io client integration
- [x] Real-time message updates
- [x] Unread badges (list + input bar)
- [x] Online status indicators (green dot)
- [x] Sticky notification bubble
- [x] Chat deletion with confirmation
- [x] Unified chat + user list

**Acceptance Criteria:**
- ✅ Socket.io WebSocket працює
- ✅ Real-time messaging між користувачами
- ✅ Повідомлення зберігаються в БД
- ✅ Message history завантажується
- ✅ Online status tracking
- ✅ User List з організації
- ✅ Direct chats (auto-create)
- ✅ Real-time unread counters
- ✅ Chat types (Direct vs Group)
- ✅ UI alignment fixes
- ✅ Sticky notification bubble
- ✅ No duplicate users

**Result:** 13/13 критеріїв = 100% ✅

---

## 📦 v0.3.1 - Production Ready (✅ ЗАВЕРШЕНО - 100%)

**Дата:** 23.11.2025  
**Час:** 1 робочий день (5.5 годин)  
**Статус:** ✅ **DONE** (100%)  
**Deliverable:** ✅ Production deployment ready

### Мета

Критичні фікси перед v0.4 AI Teammate для production deployment:
1. Environment variables (замість hardcoded localhost)
2. Connection status indicator
3. Auto-logout при 401

### Completed Features ✅

#### 1. Environment Variables ✅

**Проблема:** Hardcoded `http://localhost:4000` блокував production deployment.

**Рішення:**
- [x] Створено `config/api.ts` з `API_URL` і `SOCKET_URL`
- [x] `.env.local` для development
- [x] `.env.production` для production
- [x] Замінено hardcode в 10+ файлах
- [x] `import { API_URL } from '@/config/api'` всюди

**Час:** 2 години

---

#### 2. Socket.io connection status indicator 🟢⚪

**Проблема:** Користувач НЕ бачив коли connection lost.

**Рішення:**
- [x] Додано socketStatus state (connected/disconnected/reconnecting)
- [x] Створено ConnectionStatus компонент
- [x] Показується у Dashboard в "What's Next?" секції
- [x] 🟢 Connected / ⚪ Reconnecting / 🔴 Disconnected
- [x] Auto-reconnect працює

**Час:** 2 години

---

#### 3. Auto-logout при 401 🔐

**Проблема:** Токен протухає, але користувач сидить на сторінці.

**Рішення:**
- [x] Створено `lib/api.ts` wrapper з error handling
- [x] При 401: clear token + toast + redirect to /auth/login
- [x] Toast: "Session expired. Please login again."
- [x] `apiFetch()` функція для всіх API calls
- [x] `useApi()` hook для зручності
- [x] Застосовано до критичних файлів

**Час:** 1 година

---

### Acceptance Criteria: ✅ 3/3

- ✅ **Environment variables** - може деплоїти на production (no hardcode)
- ✅ **Connection status** - користувач бачить connection status  
- ✅ **Auto-logout на 401** - працює при expired token

### Files Changed

**Створено:**
- `apps/web/src/config/api.ts`
- `apps/web/src/lib/api.ts`
- `apps/web/src/components/connection-status.tsx`
- `apps/web/.env.local`
- `apps/web/.env.production`

**Оновлено:**
- `apps/web/src/components/chat/chat-list.tsx`
- `apps/web/src/components/chat/chat-box.tsx`
- `apps/web/src/app/dashboard/layout.tsx`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/components/chat/create-chat-dialog.tsx`
- `apps/web/src/lib/socket.ts`
- `apps/web/.env.example`

### Result

✅ **Production-ready!** Можна deploy на staging/production  
✅ **Демо-ready!** Можна показати інвесторам  
✅ **v0.4-ready!** Готові до AI Teammate development  
✅ **Zero blockers** для подальшого розвитку

---

## 📦 v0.4 - AI Teammate ⭐ KILLER FEATURE

**Час:** 14 днів  
**Статус:** 📋 NEXT (Start: 24.11.2025)  
**Deliverable:** ✅ AI participates in team discussions

### Мета

**Перша в світі digital marketing платформа з AI teammate!**

AI як повноцінний член команди - можна @mention в чаті, він аналізує дані з усіх інтеграцій, дає рекомендації, створює tasks.

**Це як Grok на Twitter, але для маркетинг команд!**

---

### День 1-3: AI Chat Foundation

**Backend:**
- [ ] AI User entity (virtual user)
- [ ] Claude API integration (BYOK)
- [ ] AI message handler
- [ ] Context builder (chat history + project data)
- [ ] Error handling (API limits, errors)

**Frontend:**
- [ ] @mention detection у input
- [ ] AI message indicator (відрізняти від user)
- [ ] Loading state ("AI is typing...")
- [ ] AI response rendering

**Чому критично:**
- Core feature для інвесторів
- Унікальна диференціація від конкурентів
- BYOK = no monthly cost

**Час:** 3 дні

---

### День 4-7: Context Understanding

**Features:**
- [ ] Project context injection
- [ ] GSC data access
- [ ] Ahrefs data access (якщо є)
- [ ] Recent tasks context
- [ ] Team members context

**AI Prompting:**
```typescript
// System prompt
You are an SEO AI Expert in a team chat.

Context:
- Project: example.com
- Traffic: 10,000 clicks/month
- Recent issues: 15 new 404 errors
- Active tasks: 5 tasks in progress

Team:
- Ivan (SEO Lead)
- Anna (Content Manager)

Instructions:
- Analyze data when asked with @AI
- Give actionable recommendations
- Be concise but thorough
- Offer to create tasks
- Use emoji sparingly
```

**API Cost (BYOK):**
- Input: ~2,500 tokens = $0.0075
- Output: ~500 tokens = $0.0075
- Total: ~$0.015 per response
- Monthly (20 queries/day): ~$9/міс

**Час:** 4 дні

---

### День 8-10: Task Creation

**Features:**
- [ ] AI can suggest tasks
- [ ] User confirms task creation
- [ ] Task automatically created
- [ ] Task linked to chat message
- [ ] Notification sent

**Example Flow:**
```
User: "@AI впав трафік на 20%"

AI: "Проаналізував дані. Бачу 3 проблеми:
     1. 15 нових 404 (з 15.10)
     2. Google Core Update (14.10)
     3. Competitor додав 8 статей
     
     Рекомендації:
     1. Виправити 404 ✅
     2. Перевірити якість контенту
     3. Competitor analysis
     
     Створити задачі? [Так] [Ні]"

User: [Так]

AI: "✅ Створив 3 задачі в Projects > Backlog"
```

**Час:** 3 дні

---

### День 11-14: Polish & Testing

**Features:**
- [ ] AI preferences (tone, formality)
- [ ] Rate limiting (prevent spam)
- [ ] Error messages user-friendly
- [ ] Documentation
- [ ] Unit tests
- [ ] Integration tests
- [ ] Load testing

**Acceptance Criteria:**
- ✅ AI responds to @mentions
- ✅ AI analyzes project data
- ✅ AI gives recommendations
- ✅ AI creates tasks on request
- ✅ Context understanding works
- ✅ No API key leaks
- ✅ Error handling works
- ✅ Rate limiting prevents abuse

**Час:** 4 дні

---

### Marketing & Demo

**Tagline:** "Your AI Teammate, Always in Context"

**Demo scenario:**
```
Team chat:

Ivan: "У нас впав трафік на 20%"
Anna: "Я бачила в GSC багато помилок"
Ivan: "@AI що ти думаєш?"

🤖 AI: "Проаналізував дані site-a.com за тиждень.
      
      Бачу 3 причини падіння:
      1. 15 нових 404 помилок (з 15.10)
      2. Core Update від Google (14.10)
      3. Competitor запустив 8 нових статей
      
      📊 Метрики:
      • Clicks: 450 → 350 (-22%)
      • Impressions: -15%
      
      ✅ Рекомендації:
      1. Виправити 404 (список в задачах)
      2. Перевірити якість контенту
      3. Competitor analysis
      
      Створити задачі?"

Ivan: "Так!"

🤖 AI: "✅ Створив 3 задачі в Backlog"
```

**WOW factor:** AI **САМ** аналізує дані, **САМ** дає рекомендації, **САМ** створює tasks!

---

## 📦 v0.5 - Projects Management

**Час:** 8 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Teams can manage client websites

**День 1-3: Projects CRUD**
- [ ] Create project
- [ ] Edit project
- [ ] Delete project
- [ ] Project list view
- [ ] Project details page

**День 4-5: Project Settings**
- [ ] Domain/URL input
- [ ] Target keywords
- [ ] Competitors
- [ ] Google credentials link

**День 6-8: API Integrations Setup**
- [ ] Google Search Console auth
- [ ] Google Analytics auth
- [ ] Ahrefs API key input
- [ ] Connection testing

**Acceptance Criteria:**
- ✅ Can create projects
- ✅ Can edit/delete projects
- ✅ Projects list shows all team projects
- ✅ Can connect Google accounts
- ✅ Can add API keys

---

## 📦 v0.6 - Tasks & Backlog

**Час:** 7 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Teams can manage SEO tasks

**День 1-3: Task Management**
- [ ] Task CRUD
- [ ] Task assignment
- [ ] Task status (Todo, In Progress, Done)
- [ ] Task priority
- [ ] Due dates

**День 4-5: Backlog**
- [ ] Kanban board
- [ ] Drag & drop
- [ ] Task filtering
- [ ] Sprint planning

**День 6-7: Task Details**
- [ ] Task description (rich text)
- [ ] Task comments
- [ ] Task attachments
- [ ] Task history

**Acceptance Criteria:**
- ✅ Can create tasks
- ✅ Can assign tasks
- ✅ Kanban board works
- ✅ Drag & drop works
- ✅ Task comments work

---

## 📦 v0.7 - Chat UI Polish + Invite System

**Час:** 10 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Professional chat + team invites

**День 1-4: Chat Polish**
- [ ] Message reactions (emoji)
- [ ] Reply threads
- [ ] Message editing
- [ ] Message deletion
- [ ] Rich text formatting
- [ ] File attachments
- [ ] Image preview
- [ ] Link preview

**День 5-7: Invite System**
- [ ] Generate invite links
- [ ] Email invites
- [ ] Accept/decline invites
- [ ] Role-based access
- [ ] Invite expiration

**День 8-10: Team Management**
- [ ] Team member list
- [ ] Role management (Owner, Admin, Member)
- [ ] Remove team members
- [ ] Change roles

**Acceptance Criteria:**
- ✅ Chat має reactions
- ✅ Reply threads працюють
- ✅ Можна запросити в команду
- ✅ Roles працюють
- ✅ Professional UX

---

## 📦 v0.8 - AI Analysis + Morning Brief

**Час:** 8 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ AI analyzes data daily + sends brief

**День 1-3: AI Daily Analysis**
- [ ] Scheduled jobs (BullMQ)
- [ ] Daily data fetch (GSC, Ahrefs)
- [ ] AI analysis of changes
- [ ] Detect issues automatically

**День 4-5: Morning Brief**
- [ ] Generate morning brief email
- [ ] Key metrics summary
- [ ] Detected issues
- [ ] Recommendations
- [ ] Email delivery (SendGrid)

**День 6-8: Pagination + Logging**
- [ ] **Query optimization**
  - [ ] `lastMessage` field in Chat model
  - [ ] Database indexes on frequent queries
  - [ ] N+1 query fixes

- [ ] **Production logging (Winston)**
  - [ ] Replace console.log
  - [ ] Log levels (error, warn, info, debug)
  - [ ] Log rotation
  - [ ] No sensitive data in logs
  - [ ] Request IDs for tracing

**Acceptance Criteria:**
- ✅ AI analyzes changes daily
- ✅ Morning brief generated at 7:00 AM
- ✅ Emails delivered to users
- ✅ Pagination works everywhere
- ✅ Winston logging in production

---

## 📦 v0.9 - Notifications + Full Polish + Security Hardening

**Час:** 10 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Complete notification system + production-ready security

**День 1-3: Notifications Backend**
- [ ] Notification model
- [ ] Notification types (chat, task, mention, system)
- [ ] Read/unread status
- [ ] Notification preferences
- [ ] Email notifications (SendGrid)
- [ ] Push notifications (optional)

**День 4-6: Notifications UI**
- [ ] Notification bell icon
- [ ] Notification dropdown
- [ ] Mark as read
- [ ] Notification settings page
- [ ] Toast notifications for real-time events

**День 7-8: UI Polish**
- [ ] Loading states everywhere
- [ ] Error messages user-friendly
- [ ] Empty states with illustrations
- [ ] Smooth transitions
- [ ] Mobile responsiveness final check
- [ ] Dark mode (optional)

**День 9-10: Security Hardening**
- [ ] Rate limiting (100 req/min per user)
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] SQL injection prevention (Prisma handles, but audit)
- [ ] Secure headers (helmet.js)
- [ ] Content Security Policy

**Acceptance Criteria:**
- ✅ Notifications work for all event types
- ✅ Email notifications sent
- ✅ UI polish complete
- ✅ Security audit passed
- ✅ No major bugs

---

## 📦 v1.0 - Launch Preparation

**Час:** 10 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** 🎉 PUBLIC LAUNCH!

**День 1-3: Performance & Monitoring**
- [ ] Performance audit
- [ ] API optimization (<200ms average)
- [ ] Frontend optimization (Lighthouse >90)
- [ ] Caching strategy (Redis)
- [ ] Monitoring setup (Sentry)
- [ ] Logging infrastructure

**День 4-6: Documentation & Testing**
- [ ] User documentation
- [ ] API documentation (Swagger)
- [ ] Admin guide
- [ ] Bug bash (team testing)
- [ ] Fix critical bugs

**День 7-10: Launch**
- [ ] Production deployment (Vercel + Railway)
- [ ] Domain setup
- [ ] SSL certificates
- [ ] Landing page live
- [ ] Product Hunt submission
- [ ] Social media announcement
- [ ] Blog post

**Acceptance Criteria:**
- ✅ Lighthouse score >90
- ✅ API <200ms average
- ✅ Zero critical bugs
- ✅ 99.9% uptime
- ✅ **PRODUCTION LIVE!**

---

## 📈 Progress Summary

**Completed:**
- ✅ v0.1 - Auth & Database (5 days)
- ✅ v0.2 - Dashboard UI (5 days)
- ✅ v0.3 - Chat System (7 days)
- ✅ v0.3.1 - Production Ready (1 day)

**Total completed:** 18 days

**Remaining:**
- 📋 v0.4 - AI Teammate (14 days) ← NEXT!
- 📋 v0.5-v1.0 (57 days)

**Total remaining:** 71 days

**Progress:** 18/75 days = **24%** complete

---

## 🎯 Key Milestones

| Date | Milestone | Status |
|------|-----------|--------|
| 15.11.2025 | v0.1 Complete | ✅ |
| 16.11.2025 | v0.2 Complete | ✅ |
| 22.11.2025 | v0.3 Complete | ✅ |
| 23.11.2025 | v0.3.1 Complete | ✅ |
| 07.12.2025 | v0.4 Complete (AI Teammate) | 📋 |
| 15.12.2025 | v0.5 Complete (Projects) | 📋 |
| 22.12.2025 | v0.6 Complete (Tasks) | 📋 |
| 01.01.2026 | v0.7 Complete (Chat Polish) | 📋 |
| 09.01.2026 | v0.8 Complete (AI Analysis) | 📋 |
| 19.01.2026 | v0.9 Complete (Notifications) | 📋 |
| 29.01.2026 | v1.0 Complete (Launch Prep) | 📋 |
| **01.02.2026** | **🎉 PUBLIC LAUNCH** | 📋 |

---

## 💰 Budget Planning

**Phase 1 (до v0.5):** $100-150
- Vercel Pro (deploy)
- Railway Starter (DB hosting)
- Domain + SSL
- Email (SendGrid)

**Phase 2 (v0.6-v1.0):** $500-1000
- Scale infrastructure
- Monitoring (Sentry)
- CDN (Cloudflare)
- Testing tools

**Launch budget:** $1,500 total
- Marketing materials
- Product Hunt featured
- Initial ads budget

---

## 🚀 Next Steps

1. **Завершити v0.3.1** ✅ DONE!
2. **Deploy на staging** (optional)
3. **Start v0.4 - AI Teammate** 🤖 ← NEXT!
4. **Demo для інвесторів** (after v0.4)

**Focus:** AI Teammate як killer feature для інвесторів!

---

**Last Updated:** 23.11.2025  
**Current Version:** v0.3.1 ✅  
**Next Version:** v0.4 - AI Teammate 🤖  
**Days to Launch:** 71 days

---

🎯 **Let's build the future of digital marketing!** 🚀