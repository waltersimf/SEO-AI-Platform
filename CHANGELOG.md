# 📦 CHANGELOG

**Версія документа:** 3.1
**Останнє оновлення:** 19.11.2025
**Поточна версія:** v0.3 🔄 **IN PROGRESS (85%)**

---

## [v0.3] - 2025-11-19

### ✅ Completed Features

**Unread Message Counters (Partial)**
- Added `ChatMember.lastReadAt` database field for tracking read status
- Backend: POST /api/chat/:chatId/read endpoint to mark chats as read
- Backend: GET /api/chat/list now calculates and returns unread count per chat
- Frontend: Red badge displays unread count next to chat names
- Frontend: Chat names appear bold when unread messages exist
- Frontend: Badge clears when user opens chat (mark as read)
- Database: Uses upsert to handle missing ChatMember records

**Known Limitations:**
- Real-time badge updates require manual page refresh
- Badge appears after refresh, not instantly when new message arrives
- Planned fix: WebSocket broadcast implementation in v0.4

**Technical Implementation:**
- Database migration: Added lastReadAt (DateTime?, nullable)
- Unread logic: Counts messages from other users after lastReadAt timestamp
- Mark as read: Updates lastReadAt to current timestamp on chat open
- UI: Badge with count, bold text for unread chats

### 🔧 Bug Fixes
- Fixed upsert in markChatAsRead to handle non-existent ChatMember records
- Fixed TypeScript errors in error handling blocks

---

## 🚀 Released Versions

### v0.3 - Chat Infrastructure 🔄

**Старт:** 16.11.2025 (evening)  
**Статус:** 🔄 **IN PROGRESS (50%)**  
**Deliverable:** ✅ Real-time командний чат працює + User List + Notifications

---

## ✅ ЩО РЕАЛІЗОВАНО (50%):

### День 0: Bug Fixes ✅

**Organization Slug Fix:**
- ✅ Unique slug generation using crypto.randomBytes(4)
- ✅ Format: "organization-name-a3f4b2c1" (8 hex chars)
- ✅ Multiple users can now signup with same org name
- ✅ No more "Unique constraint failed on slug" errors

**Chat Creation Fix:**
- ✅ Comprehensive input validation
- ✅ User verification (prevents cross-org attacks)
- ✅ Specific Prisma error handling (P2002, P2003)
- ✅ Auto-include current user in chats
- ✅ Detailed error messages for debugging

**JWT Token Fix:**
- ✅ JWT payload includes userId (req.user.id)
- ✅ JWT payload includes userName (req.user.name)
- ✅ Fixed TypeScript errors in error handling
- ✅ Chat controller properly validates user session

---

### День 1-2: Backend Infrastructure ✅

**WebSocket Setup:**
- ✅ Socket.io integration (NestJS + React)
- ✅ TestGateway (production-ready with ChatService)
- ✅ Real-time broadcasting (room-based)
- ✅ Typing indicators (backend events)
- ✅ Online status tracking (Map<userId, socketId>)

**Database Models:**
- ✅ Chat model (id, name, organizationId, type)
- ✅ Message model (id, chatId, authorId, content, createdAt)
- ✅ ChatMember model (chatId, userId, joinedAt, lastReadAt)
- ✅ Prisma migrations applied

**Services:**
- ✅ ChatService з Prisma integration:
  - `createChat(organizationId, name, memberIds)`
  - `getOrganizationChats(organizationId)`
  - `getChatMessages(chatId, limit)`
  - `createMessage(chatId, authorId, content)`

**REST API Endpoints:**
- ✅ POST `/api/chat/create` - створити новий чат
- ✅ GET `/api/chat/list` - список чатів для organization
- ✅ GET `/api/chat/:id/messages` - історія повідомлень

**Authentication:**
- ✅ JwtAuthGuard на всіх endpoints
- ✅ organizationId з req.user (dynamic)
- ✅ userId properly included in JWT token

---

### День 3: Frontend UI ✅

**ChatList Component:**
- ✅ Sidebar з списком чатів (width: 320px)
- ✅ Кнопка "+ New Chat" зверху
- ✅ Active chat підсвічення (border-l-4 border-primary)
- ✅ Last message preview
- ✅ Timestamp для останнього повідомлення
- ✅ Members count
- ✅ Loading states
- ✅ Empty state ("No chats yet")

**CreateChatDialog Component:**
- ✅ Modal діалог для створення чату
- ✅ Input для назви чату
- ✅ Validation (name required)
- ✅ Error handling
- ✅ Auto-add current user as member
- ✅ Callback onChatCreated

**Dashboard Integration:**
- ✅ ChatList в sidebar (зліва)
- ✅ Dynamic chatId (no more hardcoded "test-room"!)
- ✅ ChatBox показується при виборі чату
- ✅ Всі старі statistics/cards збережені
- ✅ GoogleConnectButton працює
- ✅ GscMetricsCard працює

**ChatBox Component:**
- ✅ Message history loading з БД
- ✅ Real-time message receiving
- ✅ Message sending
- ✅ Typing indicators (UI with animated dots)
- ✅ Timestamps на кожному повідомленні
- ✅ Auto-scroll до нових повідомлень
- ✅ Message author display with proper names

---

### День 4: Online Status + Multi-User Testing ✅

**Backend Implementation:**
- ✅ TestGateway з online users tracking
- ✅ Map<userId, socketId> для tracking
- ✅ `user_online` event handler
- ✅ `handleDisconnect` видаляє користувача
- ✅ `broadcastOnlineUsers()` відправляє список всім клієнтам
- ✅ Event: `online_users_updated` з масивом userIds
- ✅ ChatService integration для збереження повідомлень з іменами

**Frontend Implementation:**
- ✅ Updated socket.ts з `initSocket(userId, organizationId)`
- ✅ Listener для `online_users_updated` event
- ✅ Custom window event: `online_users_changed`
- ✅ ChatBox state: `onlineUsers: string[]`
- ✅ Helper: `isUserOnline(userId)` функція
- ✅ 🟢 Green indicator біля імені автора якщо online
- ✅ Dashboard передає `organizationId` в ChatBox

**Multi-User Testing (Biba & Boba):**
- ✅ Created 2 test users in same organization
- ✅ Real-time messaging between different users works
- ✅ Typing indicators show correct user name (not email)
- ✅ Messages persist in database
- ✅ Online status tracking functional

---

### День 5: Unread Message Counters ⚠️ (Частково)

**Що працює:**
- ✅ Database: `ChatMember.lastReadAt` поле
- ✅ Backend: POST `/api/chat/:chatId/read` endpoint
- ✅ Backend: GET `/api/chat/list` з `unreadCount`
- ✅ Frontend: Червоний badge з числом
- ✅ Frontend: Bold текст для непрочитаних
- ✅ Badge зникає при кліку на чат

**Не працює:**
- ❌ Real-time оновлення (треба F5)
- ❌ Badge не з'являється автоматично

**Bug Fixes:**
- Fixed upsert в markChatAsRead
- Fixed TypeScript error handling

---

## 🔴 ЩО ЗАЛИШИЛОСЬ (50% - КРИТИЧНО):

### День 5-6: Essential UX Features (8-10 год)

#### 1. 👥 **User List & Direct Chats** (3 год) 🔴
**КРИТИЧНО - без цього чат марний!**

**Backend:**
- [ ] GET `/api/users/organization` - список всіх юзерів організації
  - [ ] Response: `{ id, name, email, role, online }`
  - [ ] Filter: current user excluded (optional)
  - [ ] Sort: online first, then alphabetical

**Frontend:**
- [ ] `<UserList />` component (sidebar або окрема вкладка)
  - [ ] Показує всіх users з організації
  - [ ] 🟢 Online status indicator
  - [ ] Click на юзера → create/open direct chat
  - [ ] Search/filter users
  - [ ] Показує role (admin, member)

**Direct Chat Auto-Creation:**
- [ ] Click на user → check if direct chat exists
- [ ] Якщо немає → POST `/api/chat/create-direct`
  - [ ] type: 'direct'
  - [ ] memberIds: [currentUser, selectedUser]
  - [ ] name: auto-generated (не показується)
- [ ] Якщо є → відкрити існуючий
- [ ] Redirect до direct chat

---

#### 2. 💬 **Chat Types: Direct vs Group** (2 год) 🔴

**Database:**
- [ ] Chat.type field використовується ('direct' | 'group')
- [ ] Direct chats: name = null, avatar з user avatars
- [ ] Group chats: name required, custom avatar

**UI Відмінності:**
```
Direct Chat:
├─ Avatar: user's avatar
├─ Title: user's name
├─ Status: 🟢 online/offline
└─ No "members" shown

Group Chat:
├─ Avatar: group icon або перші літери
├─ Title: chat name
├─ Members count: "5 members"
└─ Members можна додавати
```

**ChatList Updates:**
- [ ] Розділити візуально: "Direct Messages" + "Group Chats"
- [ ] Direct: показувати ім'я співрозмовника + online status
- [ ] Group: показувати назву + members count
- [ ] Іконки різні (👤 vs 👥)

---

#### 3. 🔴 **Unread Counters & lastReadAt** (2 год) 🔴
**КРИТИЧНО - як дізнатись що написали?**

**Database:**
- [ ] ChatMember.lastReadAt tracking
- [ ] Update при відкритті чату
- [ ] Backend counts unread messages

**Backend:**
- [ ] GET `/api/chat/list` includes unreadCount per chat
  ```typescript
  {
    id, name, type,
    lastMessage: { content, createdAt, author },
    unreadCount: 3,  // NEW!
    members: [...]
  }
  ```

**Frontend:**
- [ ] Badge з числом непрочитаних (🔴 3)
- [ ] Bold font для чатів з unread
- [ ] Mark as read при відкритті чату:
  ```typescript
  PATCH /api/chat/:id/read
  // Updates lastReadAt to now
  ```
- [ ] Highlight нового повідомлення (flash animation)

---

#### 4. 🔔 **Basic Notifications** (1 год) 🔴

**Browser Notifications:**
- [ ] Request permission on login
- [ ] Показувати при новому повідомленні:
  ```
  "John Doe"
  "Hey, can we discuss the report?"
  ```
- [ ] Click → open chat
- [ ] Не показувати якщо chat вже відкритий

**Sound Notifications:**
- [ ] `/public/sounds/message.mp3` - короткий звук
- [ ] Play при новому повідомленні
- [ ] Mute option в settings (Phase 2)
- [ ] Не грати якщо tab не в focus (optional)

**Visual Indicators:**
- [ ] Document title badge: "(3) Forgeline - Chat"
- [ ] Favicon notification badge (optional)

---

#### 5. 🎨 **Proper UI/UX** (2-3 год) 🟢
**Важливо але не критично**

**Варіант A: Окрема `/chat` сторінка** (РЕКОМЕНДУЮ)
```
/chat layout:
┌────────────────────────────────────┐
│ [User List] │ [Chat List] │ [Chat] │
│             │             │        │
│ 👤 Boba 🟢  │ новий 🔴3   │ Active │
│ 👤 Biba     │ Team Chat   │ Chat   │
│ 👤 John     │             │        │
│             │             │        │
│ [+ New DM]  │ [+ New Grp] │ [Send] │
└────────────────────────────────────┘
  200px         320px         flex-1
```

**Створити:**
- [ ] `apps/web/src/app/chat/page.tsx`
- [ ] 3-column layout (Grid або Flexbox)
- [ ] `<UserListSidebar />` - ліва колонка
- [ ] `<ChatListSidebar />` - середня колонка  
- [ ] `<ActiveChat />` - права колонка (flex-1)
- [ ] Responsive: mobile → stacked tabs

**Варіант B: Покращити Dashboard**
- [ ] Chat у правому sidebar (завжди visible)
- [ ] Floating minimize/expand
- [ ] Менше metrics на dashboard

---

#### 6. 🔌 **Connection Status Indicator** (30 хв) 🟢

**Socket.io Status:**
- [ ] Listen to socket events:
  - `connect` → 🟢 Connected
  - `disconnect` → 🔴 Disconnected  
  - `reconnecting` → 🟡 Connecting...

**UI Indicator:**
```tsx
<div className="connection-status">
  {connected ? (
    <span className="text-green-500">🟢 Connected</span>
  ) : reconnecting ? (
    <span className="text-yellow-500">🟡 Reconnecting...</span>
  ) : (
    <span className="text-red-500">🔴 Offline</span>
  )}
</div>
```

**Toast Notifications:**
- [ ] "Connection lost. Reconnecting..." (на disconnect)
- [ ] "Connected!" (на reconnect)
- [ ] Auto-hide через 3 сек

---

#### 7. 📖 **@Mentions** (2-3 год) 🟡
**Nice-to-have, можна відкласти на v0.4**

**Frontend:**
- [ ] Detect "@" в input
- [ ] Show dropdown з users
- [ ] Filter by typing
- [ ] Insert @username on select
- [ ] Highlight mentions in messages

**Backend:**
- [ ] Parse mentions з content:
  ```typescript
  const mentions = extractMentions(content);
  // ['@boba', '@biba']
  ```
- [ ] Save в Message.mentions field
- [ ] Notification для mentioned users

---

## 🎯 UPDATED ACCEPTANCE CRITERIA (12 total):

**Technical (Backend):**
- [✅] Socket.io підключення працює
- [✅] Real-time messaging між клієнтами
- [✅] Messages зберігаються в БД
- [✅] Message history завантажується
- [✅] Online status tracking backend
- [✅] Typing indicators backend

**Essential UX (must have):**
- [❌] **User List з організації** ← КРИТИЧНО
- [❌] **Direct chats auto-creation** ← КРИТИЧНО
- [❌] **Unread counters** ← КРИТИЧНО
- [❌] **Basic notifications (sound + browser)** ← КРИТИЧНО

**Nice-to-have:**
- [❌] Connection status indicator
- [❌] @Mentions autocomplete

**Поточний статус:** 6/12 критеріїв (50%) 🔄

---

## 📊 Version Statistics

| Version | Planned | Actual | Status | Completion Date |
|---------|---------|--------|--------|-----------------|
| v0.1 | 5 days | 1 day | ✅ Complete | 15.11.2025 |
| v0.2 | 6 days | 2 days | ✅ Complete | 16.11.2025 |
| v0.3 | 5 days | 6 days (est.) | 🔄 In Progress (50%) | Target: 21.11.2025 |
| v0.4 | 10 days | TBD | 📋 Planned | - |
| v0.5 | 12 days | TBD | 📋 Planned | - |

**v0.3 Extended Timeline:**
- День 0-4: Core infrastructure (DONE) ✅
- День 5-6: Essential UX (TODO) 🔴
- **Total:** 6 днів (+1 день від original)

---

## 📦 ФАЙЛИ ДЛЯ СТВОРЕННЯ (День 5-6):

```
Backend:
├── apps/api/src/users/
│   ├── users.module.ts (NEW)
│   ├── users.controller.ts (NEW)
│   └── users.service.ts (NEW)
│       └── getOrganizationUsers()
├── apps/api/src/chat/
│   ├── chat.controller.ts (UPDATE)
│   │   └── createDirectChat()
│   │   └── markChatAsRead()
│   └── chat.service.ts (UPDATE)
│       └── getUnreadCount()

Frontend:
├── apps/web/src/app/chat/
│   └── page.tsx (NEW - окрема сторінка)
├── apps/web/src/components/chat/
│   ├── user-list.tsx (NEW)
│   ├── chat-list.tsx (UPDATE - direct vs group)
│   ├── chat-box.tsx (UPDATE - unread tracking)
│   ├── connection-status.tsx (NEW)
│   └── notification-handler.tsx (NEW)
└── public/sounds/
    └── message.mp3 (NEW)

Database:
└── packages/db/prisma/schema.prisma
    └── ChatMember.lastReadAt (already exists!)
```

---

## 🚀 NEXT SESSION (День 5-6) - ROADMAP:

### ПРІОРИТЕТИ:

**Сесія 1 (3-4 год):** 🔴
1. User List component (1 год)
2. Backend endpoint для users (30 хв)
3. Direct chat creation (1 год)
4. Chat types UI differentiation (30 хв)

**Сесія 2 (3-4 год):** 🔴  
1. Unread counters backend (1 год)
2. Unread counters UI (1 год)
3. Browser notifications (30 хв)
4. Sound notifications (30 хв)

**Сесія 3 (2-3 год - optional):** 🟢
1. `/chat` page layout (1-2 год)
2. Connection status (30 хв)
3. Polish & bug fixes (1 год)

**Total: 8-10 годин = 2 дні з Claude Code**

---

## 🎓 KEY INSIGHTS:

**Чому це важливо:**
- ❌ Без User List - не розумієш кому писати
- ❌ Без Unread - не знаєш що є нові повідомлення
- ❌ Без Notifications - пропускаєш повідомлення
- ❌ Без Direct chats - незручно спілкуватись 1-on-1

**Ці 4 фічі = МІНІМУМ для usable chat!**

Typing indicators, online status, @mentions - це nice-to-have, але базові речі КРИТИЧНІ!

---

**Останнє оновлення:** 19.11.2025  
**Поточна версія:** v0.3 🔄 **IN PROGRESS (50%)**  
**Наступний крок:** День 5-6 - Essential UX (User List, Unread, Notifications)

**Час завершити v0.3 ПРАВИЛЬНО! 🚀💪**