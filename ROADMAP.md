# 🗺️ ROADMAP - Forgeline SEO AI Platform

**Загальна тривалість:** 81 день (11.5 тижнів) до Public Launch  
**Поточний прогрес:** v0.6 ЗАВЕРШЕНО! v0.7 Roles & Invite next 👥

---

## 📊 Версії та прогрес

| Версія | Статус | Прогрес | Тривалість | Deliverable |
|--------|--------|---------|------------|-------------|
| v0.1 | ✅ DONE | 100% | 5 днів | Auth + DB |
| v0.2 | ✅ DONE | 100% | 5 днів | Dashboard UI |
| v0.3 | ✅ DONE | 100% | 7 днів | Chat System |
| v0.3.1 | ✅ DONE | 100% | 1 день | Production Ready |
| v0.4 | ✅ DONE | 100% | 3 дні | AI Teammate 🤖 |
| v0.5 | ✅ DONE | 100% | 8 днів | Projects 📁 |
| **v0.6** | **✅ DONE** | **100%** | **7 днів** | **Tasks & Backlog** ✅ |
| v0.7 | 📋 NEXT | 0% | 10 днів | Roles & Invite 👥 |
| v0.8 | 📋 PLANNED | 0% | 8 днів | AI Analysis |
| v0.9 | 📋 PLANNED | 0% | 10 днів | Notifications |
| v1.0 | 📋 PLANNED | 0% | 10 днів | Launch Prep |
| **Total** | | | **81 день** | Public Launch |

---

## 🎯 Milestone Timeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ✅ v0.1-0.6 (36d)    📋 v0.7 (10d)    📋 v0.8 (8d)                     │
│  Auth + Chat +        Roles & Invite   AI Analysis +                     │
│  AI + Projects +      System           Morning Brief                     │
│  Tasks ✅                                                                │
│  ─────────────────────────────────────────────────────────              │
│                                                                          │
│  📋 v0.9 (10d)                         📋 v1.0 (10d)                    │
│  Notifications +                        Launch Prep +                    │
│  Full Polish                            Security                         │
│  ──────────────────────────────────────────────────────────────────     │
│                                                                          │
│                           🎉 PUBLIC LAUNCH 🎉                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Загальна тривалість:** ~81 день (2.7 місяці)  
**Target Launch:** Січень 2026

---

## 📦 v0.1 - Auth & Database (✅ ЗАВЕРШЕНО)

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

## 📦 v0.2 - Dashboard UI (✅ ЗАВЕРШЕНО)

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

## 📦 v0.3 - Chat System (✅ ЗАВЕРШЕНО)

**Час:** 7 днів (16.11.2025 → 22.11.2025)  
**Статус:** ✅ **COMPLETE** (100%)  
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

## 📦 v0.3.1 - Production Ready (✅ ЗАВЕРШЕНО)

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

---

#### 2. Socket.io connection status indicator 🟢⚪

**Проблема:** Користувач НЕ бачив коли connection lost.

**Рішення:**
- [x] Додано socketStatus state (connected/disconnected/reconnecting)
- [x] Створено ConnectionStatus компонент
- [x] Показується у Dashboard в "What's Next?" секції
- [x] 🟢 Connected / ⚪ Reconnecting / 🔴 Disconnected
- [x] Auto-reconnect працює

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

### Acceptance Criteria: ✅ 3/3

- ✅ **Environment variables** - може деплоїти на production (no hardcode)
- ✅ **Connection status** - користувач бачить connection status  
- ✅ **Auto-logout на 401** - працює при expired token

### Result

✅ **Production-ready!** Можна deploy на staging/production  
✅ **Демо-ready!** Можна показати інвесторам  
✅ **v0.4-ready!** Готові до AI Teammate development  
✅ **Zero blockers** для подальшого розвитку

---

## 📦 v0.4 - AI Teammate (✅ ЗАВЕРШЕНО - 100%)

**Час:** 3 дні (24.11.2025 → 26.11.2025)  
**Статус:** ✅ **COMPLETE** (100%)  
**Deliverable:** ✅ AI participates in team discussions

### Мета

**Перша в світі digital marketing платформа з AI teammate!**

AI як повноцінний член команди - можна @mention в чаті, він аналізує контекст, дає рекомендації.

**Це як Grok на Twitter, але для маркетинг команд!**

### Completed Features ✅

**Backend:**
- [x] AI User entity (virtual user per organization)
- [x] Claude API integration (BYOK model)
- [x] AI message handler (async processing)
- [x] Context builder (chat history + team members)
- [x] Error handling (API limits, errors)
- [x] seed-ai-user.ts script

**Frontend:**
- [x] @mention detection у input (@ та " для UA keyboard)
- [x] Mention autocomplete dropdown
- [x] Keyboard navigation (↑↓ Enter Escape)
- [x] AI message indicator (🤖 avatar, "Bot" badge)
- [x] ReactMarkdown для AI responses
- [x] Real-time unread counts (stale closure fix)
- [x] Chat preview 3 states (Summary/Single/Empty)

**Acceptance Criteria:**
- ✅ AI User entity в БД
- ✅ Claude API integration працює
- ✅ @mention detection
- ✅ AI відповідає в чаті
- ✅ AI avatar (🤖) всюди
- ✅ Markdown rendering
- ✅ Real-time unread counts
- ✅ Chat preview states

**Result:** 8/8 критеріїв = 100% ✅

### 🐛 Troubleshooting

**Проблема:** Chat preview card positioning  
**Спроби:** 5+ невдалих ітерацій (PR #69, #70)  
**Рішення:** Revert через GitHub UI, відновлення через Gemini AI Studio

**Lessons Learned:**
- Не вгадувати числа - дивитись реальний код
- Аналізувати reference implementation
- Визнавати коли застряг - передати іншому AI

---

## 📦 v0.5 - Projects Management (✅ ЗАВЕРШЕНО)

**Час:** 8 днів (27.11.2025 → 28.11.2025)  
**Статус:** ✅ **COMPLETE** (100%)  
**Deliverable:** ✅ Teams can manage SEO projects with Google integrations

### Completed Features ✅

**Project CRUD:**
- [x] Create project (name, URL, description)
- [x] Edit project
- [x] Delete project
- [x] Project list view (cards grid)
- [x] Project details page

**Google OAuth Integration:**
- [x] Google OAuth 2.0 flow
- [x] Token storage (encrypted)
- [x] Token refresh mechanism
- [x] Multiple Google account support

**Google Integrations:**
- [x] Google Search Console connection
- [x] Google Analytics connection
- [x] Site list from GSC
- [x] Basic metrics display

**Acceptance Criteria:**
- ✅ Can create projects
- ✅ Can edit/delete projects
- ✅ Projects list shows all team projects
- ✅ Can connect Google accounts
- ✅ GSC data displayed on dashboard

**Result:** 5/5 критеріїв = 100% ✅

---

## 📦 v0.6 - Tasks & Backlog (✅ ЗАВЕРШЕНО)

**Дата:** 29-30.11.2025  
**Статус:** ✅ **COMPLETE** (100%)  
**Deliverable:** ✅ Full task management with AI auto-planning

### Мета

Повноцінна система управління задачами як в ClickUp/Asana, але з AI-powered auto-planning.

### Completed Features ✅

#### Task Management Core

**Week Calendar View:**
- [x] Google Calendar-style weekly view
- [x] Days Mon-Fri displayed
- [x] Hours per day indicator (0.0h / 8h)
- [x] Progress bar per day (blue/yellow/red)
- [x] Week navigation (prev/next/today)
- [x] Responsive layout

**Backlog Grid:**
- [x] Task cards in grid layout
- [x] Search backlog
- [x] Add to Backlog button
- [x] Priority badges (color-coded)
- [x] Estimated time display

**Task CRUD:**
- [x] Create task (title, description, assignee, priority, due date, estimated time)
- [x] Edit task
- [x] Delete task with confirmation
- [x] Task status management

**Task Details:**
- [x] Task Detail Modal (slide-out panel)
- [x] Task comments section
- [x] Created/Updated timestamps
- [x] Accepted timestamp
- [x] Start Working button
- [x] Edit/Delete buttons

---

#### Drag & Drop

- [x] @dnd-kit integration
- [x] Backlog → Schedule (sets scheduledDate)
- [x] Schedule → Schedule (changes date)
- [x] Schedule → Backlog (clears date)
- [x] Visual drag overlay
- [x] Drop zone highlighting

---

#### AI Task Creation

**Natural Language Parsing:**
- [x] Detect task creation intent from chat
- [x] Parse title, assignee, priority, due date, estimated time
- [x] Ukrainian language support
- [x] English language support

**Task Preview Card:**
- [x] Editable preview before creation
- [x] All fields editable (title, assignee, priority, etc.)
- [x] Create Task / Cancel buttons
- [x] Persists after page refresh (DB status)

**Scheduled Time:**
- [x] scheduledTime field (HH:MM format)
- [x] AI parses "о 11:00", "at 2pm", etc.
- [x] TimePicker component (hours + 15min intervals)
- [x] Display in task cards

**Recurring Tasks:**
- [x] isRecurring flag
- [x] recurrenceRule (daily, weekly, monthly)
- [x] recurrenceEnd date
- [x] Auto-create next occurrence when marked done
- [x] Repeat dropdown in task forms

**Group Tasks:**
- [x] "Assign to all team members" checkbox
- [x] Creates separate task for each member
- [x] groupTaskId to link related tasks
- [x] "Include myself" option
- [x] Member count display

---

#### Acceptance Workflow

- [x] Task status: pending_acceptance
- [x] Task status: accepted
- [x] Task status: in_progress
- [x] Task status: done
- [x] Accept/Reject buttons for assignee
- [x] Status change notifications
- [x] "Завдання очікує підтвердження" message

---

#### Real-time Updates

- [x] EventsGateway for WebSocket broadcasting
- [x] task_created event
- [x] task_updated event
- [x] task_deleted event
- [x] task_status_changed event
- [x] useTaskSocket hook on frontend
- [x] Live updates without refresh

---

#### Auto-Planning

**Button on Tasks Page:**
- [x] Auto-plan button next to Filters
- [x] Generate plan API endpoint
- [x] Apply plan API endpoint
- [x] Auto-Plan Preview Modal

**Auto-Plan Logic:**
- [x] Sort by priority (critical > high > medium > low)
- [x] Sort by due date (closest first)
- [x] Max 8h per day capacity
- [x] Skip weekends (Mon-Fri only)
- [x] Multi-week planning (3 weeks ahead)
- [x] Track unscheduled tasks with reasons

**Auto-Plan Preview Modal:**
- [x] Tasks grouped by date
- [x] Week selector buttons (clickable)
- [x] Hours per day summary
- [x] Total tasks/hours display
- [x] Unscheduled tasks warning
- [x] Apply Plan / Cancel buttons

**Auto-Plan via AI Chat:**
- [x] Intent detection ("розплануй мої задачі", "plan my week")
- [x] Auto-Plan Preview Card in chat
- [x] Apply directly from chat
- [x] Confirmation message after apply

**Scheduled Auto-Planning (Settings):**
- [x] AutoPlanSettings model in DB
- [x] Enable/disable toggle
- [x] Frequency (daily/weekly)
- [x] Day of week selector
- [x] Time selector (TimePicker)
- [x] "Preview before applying" option
- [x] "Apply automatically" option
- [x] SchedulerService with cron jobs
- [x] Settings page UI

---

#### UI Components

- [x] TimePicker (hours dropdown + 15min intervals)
- [x] Switch component (toggle)
- [x] Auto-Plan Modal
- [x] Auto-Plan Preview Card (for chat)
- [x] Task filters (priority, date range)

---

### ⏸️ Перенесено на пізніші версії

- [ ] Time Tracking UI → v0.8
- [ ] Task attachments → v0.8
- [ ] Task history/audit log → v0.9

---

### Acceptance Criteria: ✅ 15/15

- ✅ Week Calendar View працює
- ✅ Drag & drop в обидва напрямки
- ✅ AI створює задачі з chat
- ✅ Recurring tasks працюють
- ✅ Scheduled time працює
- ✅ Group tasks працюють
- ✅ Acceptance workflow працює
- ✅ Real-time updates працюють
- ✅ Auto-plan button працює
- ✅ Auto-plan в AI Chat працює
- ✅ Auto-plan Settings працює
- ✅ Multi-week planning
- ✅ Progress bar per day
- ✅ Task filters працюють
- ✅ Task comments працюють

**Result:** 15/15 критеріїв = 100% ✅

---

### 🐛 Troubleshooting v0.6

**Проблема:** Task preview card не з'являвся  
**Причина:** aiContext зберігався з повним conversationHistory (занадто великий)  
**Рішення:** Зберігати тільки { taskPreview } без зайвого контексту

**Проблема:** NestJS dependency injection errors  
**Причина:** Missing module imports (TaskModule, ChatModule)  
**Рішення:** Додати потрібні модулі в imports

**Проблема:** Page width issues  
**Причина:** Різні max-width для різних компонентів  
**Рішення:** Уніфікувати ширину контенту і chat overlay

---

## 📦 v0.7 - Roles & Invite System

**Час:** 10 днів  
**Статус:** 📋 NEXT  
**Deliverable:** ✅ Team management + role-based access

**День 1-4: Invite System**
- [ ] Generate invite links
- [ ] Email invites (SendGrid)
- [ ] Accept/decline invites
- [ ] Invite expiration
- [ ] Invite link UI

**День 5-7: Role Management**
- [ ] Roles: Owner, Admin, Member, Viewer
- [ ] Role-based permissions matrix
- [ ] Permission checks in API guards
- [ ] Role assignment UI
- [ ] Role restrictions enforcement

**День 8-10: Team Management**
- [ ] Team member list page
- [ ] Remove team members
- [ ] Change member roles
- [ ] Team settings page
- [ ] Organization profile editing

**Acceptance Criteria:**
- [ ] Invite links work
- [ ] Email invites sent
- [ ] Roles restrict access properly
- [ ] Team management UI complete
- [ ] Owner can manage all members

---

## 📦 v0.8 - AI Analysis + Chat Polish

**Час:** 8 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ AI analyzes data + polished chat UX

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

**День 6-8: Chat Polish + Time Tracking**
- [ ] Message reactions (emoji)
- [ ] Reply threads
- [ ] Message editing
- [ ] Message deletion
- [ ] File attachments
- [ ] Time Tracking UI (start/stop timer)
- [ ] Task attachments

**Acceptance Criteria:**
- [ ] AI analyzes changes daily
- [ ] Morning brief generated at 7:00 AM
- [ ] Emails delivered to users
- [ ] Chat reactions work
- [ ] Time tracking works

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
- [ ] Task history/audit log
- [ ] Dark mode (optional)

**День 9-10: Security Hardening**
- [ ] Rate limiting (100 req/min per user)
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] SQL injection prevention (Prisma handles, but audit)
- [ ] Secure headers (helmet.js)
- [ ] Content Security Policy

**Acceptance Criteria:**
- [ ] Notifications work for all event types
- [ ] Email notifications sent
- [ ] UI polish complete
- [ ] Security audit passed
- [ ] No major bugs

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
- [ ] Lighthouse score >90
- [ ] API <200ms average
- [ ] Zero critical bugs
- [ ] 99.9% uptime
- [ ] **PRODUCTION LIVE!**

---

## 📈 Progress Summary

**Completed:**
- ✅ v0.1 - Auth & Database (5 days)
- ✅ v0.2 - Dashboard UI (5 days)
- ✅ v0.3 - Chat System (7 days)
- ✅ v0.3.1 - Production Ready (1 day)
- ✅ v0.4 - AI Teammate (3 days)
- ✅ v0.5 - Projects (8 days)
- ✅ v0.6 - Tasks & Backlog (7 days)

**Total completed:** 36 days

**Remaining:**
- 📋 v0.7 - Roles & Invite (10 days) ← NEXT!
- 📋 v0.8 - AI Analysis (8 days)
- 📋 v0.9 - Notifications (10 days)
- 📋 v1.0 - Launch Prep (10 days)

**Total remaining:** 38 days

**Progress:** 36/81 days = **44%** complete 🎉

---

## 🎯 Key Milestones

| Date | Milestone | Status |
|------|-----------|--------|
| 15.11.2025 | v0.1 Complete | ✅ |
| 16.11.2025 | v0.2 Complete | ✅ |
| 22.11.2025 | v0.3 Complete | ✅ |
| 23.11.2025 | v0.3.1 Complete | ✅ |
| 26.11.2025 | v0.4 Complete (AI Teammate) | ✅ |
| 28.11.2025 | v0.5 Complete (Projects) | ✅ |
| 30.11.2025 | v0.6 Complete (Tasks) | ✅ |
| 10.12.2025 | v0.7 Complete (Roles & Invite) | 📋 |
| 18.12.2025 | v0.8 Complete (AI Analysis) | 📋 |
| 28.12.2025 | v0.9 Complete (Notifications) | 📋 |
| 07.01.2026 | v1.0 Complete (Launch Prep) | 📋 |
| **15.01.2026** | **🎉 PUBLIC LAUNCH** | 📋 |

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

1. ✅ v0.5 Projects - DONE!
2. ✅ v0.6 Tasks & Backlog - DONE!
3. **Start v0.7 - Roles & Invite** 👥 ← NEXT!
4. **Demo для інвесторів** (після v0.7)

**Focus:** Invite system + Role-based access для team collaboration!

---

**Last Updated:** 30.11.2025  
**Current Version:** v0.6 ✅  
**Next Version:** v0.7 - Roles & Invite 👥  
**Days to Launch:** 45 days

---

🎯 **v0.6 Complete! Almost halfway to launch!** 🚀