# 🗺️ ROADMAP - Forgeline SEO AI Platform

**Загальна тривалість:** 81 день (11.5 тижнів) до Public Launch  
**Поточний прогрес:** v0.6 ЗАВЕРШЕНО! v0.7 Roles & Invite next 👥  
**Останнє оновлення:** 30.11.2025 (Security Audit + New Ideas)

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
| v0.8 | 📋 PLANNED | 0% | 8 днів | AI Analysis + Payment Status |
| v0.9 | 📋 PLANNED | 0% | 10 днів | Notifications + Security Hardening 🔒 |
| v1.0 | 📋 PLANNED | 0% | 10 днів | Launch Prep |
| **Total** | | | **81 день** | Public Launch |

---

## 🚨 CRITICAL: Security Fixes Required

**Дата виявлення:** 30.11.2025 (Security Audit by ChatGPT)  
**Статус:** 🔴 MUST FIX before production demo

### Critical Security Issues

| Issue | Severity | Description | Fix Location |
|-------|----------|-------------|--------------|
| **Chat Access Check** | 🔴 CRITICAL | GET /chat/:id/messages не перевіряє membership | chat.service.ts |
| **WebSocket join_room** | 🔴 CRITICAL | Не валідує чи user належить до чату | chat.gateway.ts |
| **join_organization** | 🔴 CRITICAL | Можна підписатись на чужу org events | events.gateway.ts, test.gateway.ts |
| **Online Users Broadcast** | 🟡 HIGH | Cross-org data leak (всім показує всіх) | test.gateway.ts |

### Recommended Fixes

```typescript
// 1. Chat Access Check
async getChatMessages(chatId: string, userId: string) {
  // Verify user is member of chat
  const membership = await this.prisma.chatMember.findFirst({
    where: { chatId, userId }
  });
  if (!membership) throw new ForbiddenException('Not a member of this chat');
  // ... rest of logic
}

// 2. WebSocket join_room validation
@SubscribeMessage('join_room')
async handleJoinRoom(client: Socket, chatId: string) {
  const userId = client.data.userId;
  const isMember = await this.chatService.isUserInChat(chatId, userId);
  if (!isMember) {
    client.emit('error', { message: 'Not authorized for this chat' });
    return;
  }
  client.join(chatId);
}

// 3. join_organization check
@SubscribeMessage('join_organization')
async handleJoinOrg(client: Socket, orgId: string) {
  const userId = client.data.userId;
  const isMember = await this.userService.isUserInOrg(userId, orgId);
  if (!isMember) {
    client.emit('error', { message: 'Not a member of this organization' });
    return;
  }
  client.join(`org_${orgId}`);
}

// 4. Scope online_users to organization
// Instead of global broadcast, emit only to org members
this.server.to(`org_${orgId}`).emit('online_users_updated', orgOnlineUsers);
```

**Estimated Fix Time:** ~2 hours  
**When:** Before any public demo or investor presentation

---

## 🎯 Milestone Timeline

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ✅ v0.1-0.6 (36d)    📋 v0.7 (10d)    📋 v0.8 (8d)                     │
│  Auth + Chat +        Roles & Invite   AI Analysis +                     │
│  AI + Projects +      System           Morning Brief +                   │
│  Tasks ✅                              Payment Status                    │
│  ─────────────────────────────────────────────────────────              │
│                                                                          │
│  📋 v0.9 (10d)                         📋 v1.0 (10d)                    │
│  Notifications +                        Launch Prep +                    │
│  Security Hardening 🔒                  Performance                      │
│  ──────────────────────────────────────────────────────────────────     │
│                                                                          │
│                           🎉 PUBLIC LAUNCH 🎉                           │
│                                                                          │
├──────────────────────────────────────────────────────────────────────────┤
│                         POST-LAUNCH ROADMAP                              │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  📋 v1.1 (3 weeks)         📋 v1.2 (3 weeks)       📋 v1.3 (2 weeks)   │
│  Knowledge Base 📚         Internal SEO            Templates             │
│  (MUST HAVE)               Browser 🌐              Marketplace 🏪        │
│                            (UNIQUE FEATURE!)                             │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Загальна тривалість до v1.0:** ~81 днів (2.7 місяці)  
**Target Launch:** Січень 2026  
**Post-Launch:** v1.1-v1.3 (Лютий-Березень 2026)

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

**Result:** 13/13 критеріїв = 100% ✅

---

## 📦 v0.3.1 - Production Ready (✅ ЗАВЕРШЕНО)

**Дата:** 23.11.2025  
**Час:** 1 робочий день (5.5 годин)  
**Статус:** ✅ **DONE** (100%)  
**Deliverable:** ✅ Production deployment ready

- [x] Environment variables (замість hardcoded localhost)
- [x] Connection status indicator (🟢⚪🔴)
- [x] Auto-logout при 401

**Result:** ✅ Production-ready! Можна deploy на staging/production

---

## 📦 v0.4 - AI Teammate (✅ ЗАВЕРШЕНО - 100%)

**Час:** 3 дні (24.11.2025 → 26.11.2025)  
**Статус:** ✅ **COMPLETE** (100%)  
**Deliverable:** ✅ AI participates in team discussions

### Мета

**Перша в світі digital marketing платформа з AI teammate!**

AI як повноцінний член команди - можна @mention в чаті, він аналізує контекст, дає рекомендації.

### Completed Features ✅

**Backend:**
- [x] AI User entity (virtual user per organization)
- [x] Claude API integration (BYOK model)
- [x] AI message handler (async processing)
- [x] Context builder (chat history + team members)

**Frontend:**
- [x] @mention detection у input (@ та " для UA keyboard)
- [x] Mention autocomplete dropdown
- [x] AI message indicator (🤖 avatar, "Bot" badge)
- [x] ReactMarkdown для AI responses

**Result:** 8/8 критеріїв = 100% ✅

---

## 📦 v0.5 - Projects Management (✅ ЗАВЕРШЕНО)

**Час:** 8 днів (27.11.2025 → 28.11.2025)  
**Статус:** ✅ **COMPLETE** (100%)  
**Deliverable:** ✅ Teams can manage SEO projects with Google integrations

### Completed Features ✅

- [x] Project CRUD (create, edit, delete, list)
- [x] Google OAuth integration (organization-level)
- [x] Google Search Console API
- [x] Google Analytics GA4 API
- [x] Google Drive/Docs/Sheets API
- [x] Settings page for integrations
- [x] Property selector for GSC/GA4

**Result:** 100% ✅

---

## 📦 v0.6 - Tasks & Backlog (✅ ЗАВЕРШЕНО)

**Дата:** 28.11.2025 → 30.11.2025  
**Статус:** ✅ **COMPLETE** (100%)  
**Deliverable:** ✅ Full task management with AI integration

### Completed Features ✅

- [x] Week Calendar View (5 days, Mon-Fri)
- [x] Drag & Drop (Backlog ↔ Calendar)
- [x] AI Task Creation from chat (natural language)
- [x] Recurring tasks (daily, weekly, monthly)
- [x] Scheduled time (HH:MM)
- [x] Group tasks (assign to all team members)
- [x] Acceptance workflow (pending → accepted → in_progress → done)
- [x] Real-time updates (WebSocket)
- [x] Auto-planning (button + AI Chat + Settings with cron)
- [x] Task filters (priority, assignee, project)
- [x] Task comments

**Result:** 15/15 критеріїв = 100% ✅

---

## 📦 v0.7 - Roles & Invite System

**Час:** 10 днів  
**Статус:** 📋 NEXT  
**Deliverable:** ✅ Team management + role-based access

**День 1-4: Invite System**
- [ ] Invite model (email, token, expiresAt, usedAt, role)
- [ ] Generate invite links
- [ ] Email invites (SendGrid)
- [ ] Accept/decline invites
- [ ] Invite expiration (7 days default)
- [ ] Pending invites UI (for admin)
- [ ] Revoke invite functionality

**День 5-7: Role Management**
- [ ] Roles: Owner, Admin, Member, Viewer
- [ ] Role-based permissions matrix
- [ ] @Roles() decorator for NestJS guards
- [ ] Permission checks in API guards
- [ ] Role assignment UI
- [ ] Role restrictions enforcement

**День 8-10: Team Management**
- [ ] Team member list page
- [ ] Remove team members (soft delete)
- [ ] Change member roles
- [ ] Team settings page
- [ ] Organization profile editing

**Acceptance Criteria:**
- [ ] Invite links work
- [ ] Email invites sent
- [ ] Roles restrict access properly
- [ ] Team management UI complete
- [ ] Owner can manage all members

**Technical Notes (from Gemini audit):**
- Use soft delete for users (isDeleted: true) to preserve task history
- Implement @Roles() decorator pattern instead of inline checks
- Invite table should track usedAt for audit trail

---

## 📦 v0.8 - AI Analysis + Chat Polish + Payment Status

**Час:** 8 днів  
**Статус:** 📋 PLANNED  
**Deliverable:** ✅ AI analyzes data + polished chat UX + project payments

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

**День 6-7: Chat Polish**
- [ ] Message reactions (emoji)
- [ ] Reply threads
- [ ] Message editing
- [ ] Message deletion
- [ ] File attachments
- [ ] DRY refactor: createMessage + createAIMessage → saveMessageToDb()
- [ ] Enhanced WebSocket logging (chatId, userId in errors)

**День 8: Payment Status Tracking** 💰
- [ ] Project payment status (paid, pending, unpaid, overdue)
- [ ] Status indicator in project list
- [ ] Notification when status changes
- [ ] Budget tracking (optional: budgetTotal, budgetSpent)
- [ ] "Can spend" indicator for SEO specialists

**Acceptance Criteria:**
- [ ] AI analyzes changes daily
- [ ] Morning brief generated at 7:00 AM
- [ ] Emails delivered to users
- [ ] Chat reactions work
- [ ] Payment status visible on projects

---

## 📦 v0.9 - Notifications + Full Polish + Security Hardening 🔒

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

**День 9-10: Security Hardening** 🔒
- [ ] Rate limiting (100 req/min per user)
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] Secure headers (helmet.js)
- [ ] Content Security Policy
- [ ] OAuth state signing (cryptographic validation)
- [ ] Multiple sessions handling (don't show offline if other session active)
- [ ] Scope broadcasts to organization (fix global broadcasts)
- [ ] Unread counts optimization (batch query instead of N+1)
- [ ] DB indexes: Message (chatId, createdAt), Task (status, assignedToId)

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

## 🔮 POST-LAUNCH ROADMAP

### 📦 v1.1 - Knowledge Base (MUST HAVE) 📚

**Час:** 3 тижні  
**Статус:** 📋 PLANNED (Post-Launch)  
**Deliverable:** RAG-based knowledge system (own NotebookLM)

**Чому MUST HAVE:**
AI Teammate зараз відповідає з загальних знань Claude. З Knowledge Base він працюватиме по стандартах твоєї агентства.

**Контент для людей:**
- [ ] SOPs / Гайди
- [ ] Навчальні матеріали
- [ ] Кейси (успішні/провальні)
- [ ] Онбординг docs

**Контент для AI (KILLER!):**
- [ ] Шаблони звітів/документів
- [ ] Покрокові інструкції (семантика, кластеризація, аудит)
- [ ] Чеклісти якості
- [ ] Стандарти агентства
- [ ] Промпти/приклади для AI

**Технічна реалізація:**
- [ ] pgvector extension для PostgreSQL
- [ ] Embedding service (Claude API)
- [ ] Chunking logic для документів
- [ ] Vector search (semantic)
- [ ] Upload UI (PDF, DOCX, Google Docs)
- [ ] Integration з AI Teammate (auto-context)
- [ ] Тегування: [human] vs [ai-instruction]

**News Monitoring (частина KB):**
- [ ] Додавання джерел (RSS, URLs)
- [ ] Scheduled fetch (вечір)
- [ ] AI filtering (релевантність)
- [ ] Morning digest в чат
- [ ] "Add to KB" action

---

### 📦 v1.2 - Internal SEO Browser (UNIQUE FEATURE!) 🌐

**Час:** 3 тижні  
**Статус:** 📋 PLANNED (Post-Launch)  
**Deliverable:** Built-in browser with SEO metrics overlay

**Чому UNIQUE:**
Жоден конкурент не має вбудованого браузера. Замінює 10+ розширень!

**Replaces:**
- Ahrefs SEO Toolbar
- SEMrush extension
- MozBar
- Serpstat
- SimilarWeb
- Wappalyzer
- PageSpeed Insights extension
- Check My Links
- ... та інші

**Features:**
- [ ] Browse any URL
- [ ] SERP analysis overlay (on Google results)
- [ ] Domain metrics (DR, UR, Backlinks, Traffic)
- [ ] Keyword data (volume, KD, CPC)
- [ ] Keyword suggestions sidebar
- [ ] Page analysis (meta tags, H1-H6, Core Web Vitals)
- [ ] Technology detection (Wappalyzer API)
- [ ] Quick actions: "Add to project", "Create task", "Save competitor"

**Technical approach:**
- [ ] Web-based (proxy through backend)
- [ ] Iframe/embed rendering
- [ ] Overlay with metrics from Ahrefs/Serpstat APIs
- [ ] Integration with Projects

---

### 📦 v1.3 - Templates Marketplace 🏪

**Час:** 2 тижні  
**Статус:** 📋 PLANNED (Post-Launch)  
**Deliverable:** Shareable templates library

**Template Types:**
- [ ] Task Templates (аудит сайту, збір семантики)
- [ ] Report Templates (місячний звіт, технічний аудит)
- [ ] SOP Templates (чеклісти, інструкції)
- [ ] AI Prompt Templates (готові промпти для AI Teammate)
- [ ] Project Templates (готовий сетап проекту)

**Features:**
- [ ] Inspiration tab (як у Claude Artifacts)
- [ ] Community templates (від інших агентств)
- [ ] Official templates (від Forgeline)
- [ ] "Use this" → копіює до тебе
- [ ] Rating/reviews
- [ ] Premium templates (monetization?)

---

### 📦 v1.5+ - Future Ideas

**Lower Priority (after user feedback):**

| Idea | Description | When |
|------|-------------|------|
| White-label Reports | Звіти з логотипом агентства | After reports feature |
| Gamification | Бали, streak, лідерборд для команди | v1.5+ |
| Client Portal | Read-only доступ для клієнтів | After user feedback |
| Slack/Telegram Webhooks | Alerts до зовнішніх месенджерів | v1.4 |
| Task Dependencies | blocked_by relationship | v1.4 |
| Time Tracking | Start/stop timer per task | v0.8 or v1.4 |

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

**Remaining to v1.0:**
- 📋 v0.7 - Roles & Invite (10 days) ← NEXT!
- 📋 v0.8 - AI Analysis + Payment Status (8 days)
- 📋 v0.9 - Notifications + Security (10 days)
- 📋 v1.0 - Launch Prep (10 days)

**Total remaining:** 38 days

**Progress:** 36/81 days = **44%** complete 🎉

**Post-Launch:**
- 📋 v1.1 - Knowledge Base (3 weeks) - MUST HAVE
- 📋 v1.2 - Internal SEO Browser (3 weeks) - UNIQUE FEATURE
- 📋 v1.3 - Templates Marketplace (2 weeks)

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
| 28.12.2025 | v0.9 Complete (Notifications + Security) | 📋 |
| 07.01.2026 | v1.0 Complete (Launch Prep) | 📋 |
| **15.01.2026** | **🎉 PUBLIC LAUNCH** | 📋 |
| 05.02.2026 | v1.1 Complete (Knowledge Base) | 📋 |
| 26.02.2026 | v1.2 Complete (Internal Browser) | 📋 |
| 12.03.2026 | v1.3 Complete (Templates) | 📋 |

---

## 🔒 Security Checklist (Pre-Production)

**🔴 Critical (MUST fix before demo):**
- [ ] Chat access check (verify membership)
- [ ] WebSocket join_room validation
- [ ] join_organization org membership check
- [ ] Scope online_users to organization

**🟡 Important (fix in v0.9):**
- [ ] OAuth state signing
- [ ] Multiple sessions handling
- [ ] Global broadcasts → scoped
- [ ] Rate limiting
- [ ] CSRF/XSS protection

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

1. ✅ v0.6 Tasks & Backlog - DONE!
2. 🔴 **Fix Critical Security Issues** (~2 hours)
3. **Start v0.7 - Roles & Invite** 👥 ← NEXT!
4. **Demo для інвесторів** (після v0.7)

**Focus:** Security fixes + Invite system + Role-based access!

---

**Last Updated:** 30.11.2025  
**Current Version:** v0.6 ✅  
**Next Version:** v0.7 - Roles & Invite 👥  
**Days to Launch:** 45 days  
**Security Status:** 🔴 Critical fixes required

---

🎯 **v0.6 Complete! Security audit done! Ready for v0.7!** 🚀