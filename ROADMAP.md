# 🗺️ ROADMAP - Forgeline SEO AI Platform

**Загальна тривалість:** 73 дні (10.5 тижнів) до Public Launch  
**Поточний прогрес:** v0.3 в процесі (96% complete)

---

## 📊 Версії та прогрес

| Версія | Статус | Прогрес | Тривалість | Deliverable |
|--------|--------|---------|------------|-------------|
| v0.1 | ✅ DONE | 100% | 5 днів | Auth + DB |
| v0.2 | ✅ DONE | 100% | 5 днів | Dashboard UI |
| v0.3 | 🚧 IN PROGRESS | 96% | 10 днів | Chat System |
| v0.4 | 📋 PLANNED | 0% | 8 днів | Projects |
| v0.5 | 📋 PLANNED | 0% | 7 днів | Tasks + Backlog |
| v0.6 | 📋 PLANNED | 0% | 10 днів | **Chat UI Polish + Invite System** |
| v0.7 | 📋 PLANNED | 0% | 8 днів | AI Analysis |
| v0.8 | 📋 PLANNED | 0% | 10 днів | Notifications |
| v0.9 | 📋 PLANNED | 0% | 10 днів | Launch Prep |
| **Total** | | | **73 днів** | Public Launch |

---

## 🎯 Milestone Timeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ✅ v0.1-0.2 (10d)   🚧 v0.3 (10d)   📋 v0.4-0.5 (15d)                 │
│  Auth + Dashboard     Chat System     Projects + Tasks                  │
│  ─────────────────────────────────────────────────────────              │
│                                                                          │
│  📋 v0.6 (10d)       📋 v0.7 (8d)    📋 v0.8 (10d)    📋 v0.9 (10d)    │
│  Chat Polish +       AI Analysis +   Notifications +   Launch Prep +    │
│  Invite System       Morning Brief   Full Polish       Security         │
│  ──────────────────────────────────────────────────────────────────     │
│                                                                          │
│                           🎉 PUBLIC LAUNCH 🎉                           │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Загальна тривалість:** ~73 дні (2.5 місяці)  
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

## 📦 v0.3 - Chat System (В ПРОЦЕСІ 🚧 - 96%)

**Час:** 10 днів  
**Статус:** 🚧 IN PROGRESS (96% complete)  
**Deliverable:** ✅ Team can chat in real-time

### Completed Features ✅

**Backend:**
- [x] WebSocket server (Socket.io)
- [x] Chat creation (direct + group)
- [x] Message sending/receiving
- [x] Real-time broadcasting
- [x] Online status tracking
- [x] Unread counters
- [x] Organization-based rooms
- [x] Chat deletion
- [x] Multi-user signup support (Variant A)

**Frontend:**
- [x] ChatInputBar (fixed bottom)
- [x] ChatOverlay (slide-up)
- [x] ChatList component
- [x] ChatBox component
- [x] Direct chat creation
- [x] Group chat creation with member selection
- [x] Real-time message updates
- [x] Unread badges
- [x] Online indicators
- [x] Delete chat UI
- [x] Auto-populated user list
- [x] Backdrop click-to-close

**Fixes Completed (2025-11-22):**
- [x] Auto-populated direct chats (Problem #1)
- [x] Group chat member selection (Problem #2)
- [x] Signup organization duplicates (Problem #3 - Temporary Variant A)
- [x] Chat overlay backdrop closing

### Known Issues ❌
- [ ] Duplicate users in ChatList (under investigation)

### Acceptance Criteria:
- ✅ Users can send direct messages
- ✅ Users can create group chats with member selection
- ✅ Messages appear in real-time
- ✅ Online status visible
- ✅ Unread counters work
- ✅ All organization users auto-populate
- ⏳ No duplicate users (debugging)

---

## 📦 v0.4 - Projects Management

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
- ✅ Can connect Google accounts
- ✅ Can add Ahrefs key
- ✅ Data fetching works

---

## 📦 v0.5 - Tasks & Backlog

**Час:** 7 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Task management like Linear

**День 1-3: Tasks CRUD**
- [ ] Create task
- [ ] Edit task
- [ ] Delete task
- [ ] Task statuses (Todo, In Progress, Done, Blocked)
- [ ] Assignee selection
- [ ] Priority levels

**День 4-5: Backlog View**
- [ ] Drag & drop reordering
- [ ] Filters (status, assignee, priority)
- [ ] Search tasks
- [ ] Bulk actions

**День 6-7: Task Details**
- [ ] Task description (rich text)
- [ ] Comments
- [ ] Activity log
- [ ] Related tasks

**Acceptance Criteria:**
- ✅ Can create/edit/delete tasks
- ✅ Drag & drop works
- ✅ Filters work
- ✅ Comments work

---

## 📦 v0.6 - Chat UI Polish + Invite System 🆕

**Час:** 10 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ Professional chat UX + Secure multi-tenancy

### Chat UI Improvements (День 1-6)

**Day 1-2: Search & Avatars**
- [ ] 🔍 **Search functionality**
  - [ ] Search bar at top of ChatList
  - [ ] Search by user name, chat name, message content
  - [ ] Real-time filtering
  - [ ] Clear search button
  - [ ] Keyboard shortcuts (Cmd/Ctrl+K)

- [ ] 👤 **Avatar initials**
  - [ ] Generate initials from names (e.g., "John Doe" → "JD")
  - [ ] Unique colors per user (hash-based)
  - [ ] Replace generic User/Users icons
  - [ ] Consistent across all components

**Day 3-4: Enhanced Indicators & Visuals**
- [ ] ⌨️ **Typing indicators**
  - [ ] "User is typing..." animation
  - [ ] Show in ChatBox below messages
  - [ ] WebSocket events: typing_start, typing_stop
  - [ ] Debounce (stop after 3s of no typing)

- [ ] 🔴 **Better unread badges**
  - [ ] Larger, more prominent badges
  - [ ] Bold chat name when unread
  - [ ] Different color for mentions (@username)
  - [ ] Badge animation on new message

**Day 5-6: Smart Features & Polish**
- [ ] 👥 **Visual distinction direct vs group**
  - [ ] Different icons or colors
  - [ ] Stacked avatars for group chats (show first 3 members)
  - [ ] Group icon with member count overlay

- [ ] ⏰ **Smart timestamps**
  - [ ] Today → show time only ("3:45 PM")
  - [ ] Yesterday → show "Yesterday"
  - [ ] Older → show date ("Nov 20")
  - [ ] Relative time in tooltips ("2 hours ago")

- [ ] 💬 **Improved empty state**
  - [ ] "No chat selected" with onboarding tips
  - [ ] Quick actions: "Create group chat", "Start direct message"
  - [ ] Recent activity preview
  - [ ] Illustration or animation

### Invite System (День 7-10) - Production Security 🔒

**Day 7-8: Backend Implementation**
- [ ] 📧 **Invite model & API**
  - [ ] Invite table: token, email, organizationId, role, expiresAt, createdBy
  - [ ] POST /api/organization/invite - Create invite
  - [ ] GET /api/organization/invites - List pending invites
  - [ ] DELETE /api/organization/invite/:id - Cancel invite
  - [ ] POST /api/auth/signup-with-invite - Signup via invite

- [ ] 🔐 **Invite logic**
  - [ ] Generate secure random tokens (32 bytes)
  - [ ] Email validation
  - [ ] Expiry (7 days default)
  - [ ] One-time use tokens
  - [ ] Role assignment (admin/member)

**Day 9: Frontend UI**
- [ ] 👥 **Organization settings page**
  - [ ] Team members list
  - [ ] "Invite member" button
  - [ ] Invite dialog: email input, role selector
  - [ ] Pending invites list
  - [ ] Cancel/resend actions

- [ ] 📬 **Signup flow update**
  - [ ] Detect invite token in URL (/auth/signup?invite=xxx)
  - [ ] Show organization name in signup form
  - [ ] Auto-fill organization on token validation
  - [ ] Join existing org instead of creating new

**Day 10: Email Integration (Optional)**
- [ ] 📧 **Invite emails** (can be added later)
  - [ ] Email template with invite link
  - [ ] SendGrid/Mailgun integration
  - [ ] For now: just copy link and share manually

**Remove Variant A:**
- [ ] ❌ Remove case-insensitive organization matching
- [ ] ❌ Signup always creates new org (unless invite token)
- [ ] ✅ Secure multi-tenancy

**Acceptance Criteria:**
- ✅ Search works and is fast (<500ms)
- ✅ Avatars with initials everywhere
- ✅ Typing indicators show in real-time
- ✅ Timestamps are smart and readable
- ✅ Unread badges are prominent
- ✅ Empty state is helpful
- ✅ Invite system working end-to-end
- ✅ Admins can invite team members
- ✅ Invited users join correct organization
- ✅ Variant A removed (secure multi-tenancy)

---

## 📦 v0.7 - AI Analysis + Morning Brief + Scalability

**Час:** 8 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ AI analyzes changes + morning brief + scale-ready

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

**День 7-8: Scalability & Logging**
- [ ] 📊 **Pagination**
  - [ ] Chat messages pagination (load more)
  - [ ] Projects list pagination
  - [ ] Tasks pagination (Backlog)
  - [ ] Audit results pagination

- [ ] 📊 **Query optimization**
  - [ ] `lastMessage` field in Chat model
  - [ ] Database indexes on frequent queries
  - [ ] N+1 query fixes

- [ ] 📝 **Production logging (Winston)**
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

## 📦 v0.8 - Notifications + Full Polish + Security Hardening

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

## 📦 v0.9 - Launch Preparation

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
- ✅ **PRODUCTION LIVE!** 🎉

---

## 🔮 Post-Launch (v1.0+)

### Phase 1: Feedback & Iteration (1 month)
- [ ] User feedback collection
- [ ] Bug fixes
- [ ] UX improvements
- [ ] Performance optimization

### Phase 2: Advanced Features (2-3 months)
- [ ] @mentions in chat
- [ ] File attachments
- [ ] Message reactions
- [ ] Voice messages (optional)
- [ ] Video calls (optional)
- [ ] Advanced SEO features:
  - [ ] Technical SEO audit
  - [ ] Content optimization AI
  - [ ] Backlink monitoring
  - [ ] Rank tracking

### Phase 3: Scaling (6+ months)
- [ ] Team plans & pricing tiers
- [ ] API for third-party integrations
- [ ] White-label options
- [ ] Enterprise features
- [ ] Multi-language support

---

## 📊 Risk Mitigation

**Technical Risks:**
- WebSocket scaling → Use Redis adapter for Socket.io
- Database performance → Add indexes, query optimization
- API rate limits → Caching, batching requests

**Business Risks:**
- Slow adoption → Free tier, Product Hunt launch
- Competitor moves → Focus on AI teammate USP
- Budget constraints → Prioritize core features, delay nice-to-haves

**Mitigation Strategy:**
- Start with free tier
- Focus on killer feature (AI teammate)
- Ship fast, iterate based on feedback
- Pivot if needed

---

## 💡 Key Decisions

1. **Monorepo** (PNPM workspace) ✅
2. **WebSocket** для real-time (Socket.io) ✅
3. **JWT** authentication ✅
4. **Organization-based** multi-tenancy ✅
5. **Variant A** signup for testing → **Invite system** for production ✅
6. **Chat UI polish** after core features (v0.6) ✅
7. **Vercel + Railway** for hosting
8. **Free tier** для початку

---

## 🎯 Success Metrics

**v0.3 (Chat MVP):**
- ✅ Real-time messaging works
- ✅ 5+ test users chatting
- ✅ Group chats functional
- ⏳ Zero critical bugs

**v0.5 (Investor Demo):**
- ✅ All core features working
- ✅ Professional UI
- ✅ Demo-ready presentation
- ✅ 20+ hours of testing

**v1.0 (Public Launch):**
- ✅ 50+ beta users
- ✅ 99.9% uptime
- ✅ <200ms API response
- ✅ Lighthouse >90

---

**Last Updated:** 2025-11-22  
**Next Milestone:** Complete v0.3 (96% → 100%)  
**Current Sprint:** Debugging duplicate users in ChatList

---

🚀 **Let's ship it!**