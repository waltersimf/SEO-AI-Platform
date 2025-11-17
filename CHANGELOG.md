# Forgeline - Change Log

**Версія:** 1.4  
**Формат:** Keep a Changelog

---

## 📋 In Progress

### v0.3 - Chat Infrastructure 🔄

**Старт:** 17.11.2025  
**Статус:** 🔄 **IN PROGRESS (50%)**  
**Реальний час:** 3+ години (багато troubleshooting)

---

## ✅ ЩО РЕАЛІЗОВАНО (50%):

### Backend Infrastructure (50%)

**WebSocket Gateway:**
- ✅ Socket.io інтеграція (v4.8.1)
- ✅ TestGateway працює (PROOF OF CONCEPT)
- ✅ Real-time messaging між клієнтами
- ✅ Room-based broadcasting
- ✅ Events: `join_room`, `send_message`, `typing_start`, `typing_stop`
- ❌ ChatGateway (основний) - НЕ працює через TypeError
- ❌ ChatService - викликає помилки з Prisma
- ❌ Database persistence - повідомлення не зберігаються

**Database Schema:**
- ✅ Chat model створено
- ✅ Message model створено
- ✅ ChatMember model створено
- ✅ Migrations застосовані
- ❌ Фактично НЕ використовується (in-memory storage)

### Frontend (80%)

**ChatBox Component:**
- ✅ UI повністю готовий
- ✅ Socket.io-client підключення
- ✅ Відправка повідомлень
- ✅ Отримання повідомлень real-time
- ✅ Message bubbles (свої/чужі)
- ✅ Auto-scroll до нових повідомлень
- ✅ Typing indicators (UI готовий)
- ❌ Message history з БД
- ❌ Показ історії при завантаженні

**Integration:**
- ✅ ChatBox додано на Dashboard
- ✅ User info передається (userId, userName)
- ⚠️ chatId hardcoded як "test-room" (для тесту)

---

## 🐛 ПРОБЛЕМИ ПІД ЧАС РОЗРОБКИ:

### 1. **CSS не працював** ✅
   - **Проблема:** Dashboard показувався без стилів, тільки HTML
   - **Причина:** Tailwind CSS не компілювався
   - **Симптоми:** Біла сторінка з несформатованим текстом
   - **Рішення:** Перезапуск frontend (Ctrl+C → pnpm dev)
   - **Час:** 10 хвилин

### 2. **Frontend не компілювався** ✅
   - **Проблема:** `GET /dashboard 404` постійно
   - **Причина:** page.tsx мав синтаксичну помилку
   - **Симптоми:** Термінал показував "Found 0 errors" але сторінка 404
   - **Рішення:** Перевірка файлу, виправлення синтаксису
   - **Час:** 15 хвилин

### 3. **TypeError: instanceof is not an object** ❌ КРИТИЧНА
   - **Проблема:** Backend падає при підключенні WebSocket
   - **Симптоми:**
     ```
     TypeError: Right-hand side of 'instanceof' is not an object
     at WsExceptionsHandler.handleUnknownError
     ```
   - **Спроби виправлення:**
     - Додали IoAdapter в main.ts
     - Встановили @nestjs/platform-socket.io
     - Змінили конфігурацію Gateway
   - **Результат:** НЕ ВИРІШЕНО
   - **Workaround:** Створили простий TestGateway БЕЗ ChatService
   - **Час витрачено:** 1.5+ години

### 4. **Socket.io version mismatch** ✅
   - **Проблема:** Думали що версії конфліктують
   - **Перевірка:** Backend v4.8.1, Frontend v4.8.1 ✅
   - **Результат:** Версії сумісні, проблема не тут
   - **Час:** 20 хвилин

### 5. **WebSocket connection fails** ✅ ЧАСТКОВО
   - **Проблема:** Socket підключається і одразу відключається
   - **Симптоми:**
     ```
     Socket connected
     Socket disconnected
     ERR_CONNECTION_REFUSED
     ```
   - **Причина:** ChatGateway з ChatService викликає TypeError
   - **Рішення:** Використали TestGateway (простий, без service)
   - **Час:** 30 хвилин

### 6. **Broadcasting не працює** ✅
   - **Проблема:** Повідомлення не з'являються в інших вкладках
   - **Причина:** Різні `chatId` для кожного користувача
   - **Деталі:**
     - Client 1: `chatId = user.organizationId` → різний UUID
     - Client 2: інший organizationId
     - Clients в різних rooms!
   - **Рішення:** Hardcoded `chatId="test-room"` для тесту
   - **Час:** 20 хвилин

### 7. **User authentication в інкогніто** ✅
   - **Проблема:** Інкогніто показує того самого юзера (Володимир)
   - **Причина:** localStorage.token спільний між вкладками
   - **Рішення:** Логін під різними акаунтами (test3@forgeline.dev)
   - **Час:** 10 хвилин

### 8. **ChatService Prisma TypeError** ❌ НЕ ВИРІШЕНО
   - **Проблема:** ChatService викликає instanceof TypeError
   - **Спроби:**
     - Спрощення service методів
     - Видалення складної логіки
     - Різні варіанти imports
   - **Результат:** Залишається нерозв'язаною
   - **Workaround:** TestGateway без service (in-memory)
   - **TODO:** Виправити в наступній сесії з web_search

### 9. **Git Bash для терміналу** ✅
   - **Проблема:** PowerShell питає "Terminate batch job?" після Ctrl+C
   - **Розв'язання:** Switch на Git Bash в VS Code
   - **Як:** Ctrl+Shift+P → "Terminal: Select Default Profile" → Git Bash
   - **Час:** 2 хвилини

---

## 📊 ТЕХНІЧНІ ДЕТАЛІ:

**Нові файли:**
```
apps/api/src/chat/
├── chat.module.ts (оновлено - TestGateway в providers)
├── chat.gateway.ts (НЕ ПРАЦЮЄ - TypeError)
├── test.gateway.ts (ПРАЦЮЄ - простий POC)
├── chat.service.ts (НЕ ПРАЦЮЄ - викликає помилки)
└── chat.controller.ts

apps/web/src/components/chat/
├── chat-box.tsx (повний UI компонент)
└── socket.ts (Socket.io client setup)

packages/db/
├── prisma/schema.prisma (Chat, Message, ChatMember models)
└── migrations/
    └── 20251117033925_add_chat_models/
```

**Пакети додані:**
```json
{
  "socket.io": "^4.8.1",
  "socket.io-client": "^4.8.1",
  "@nestjs/websockets": "^11.1.9",
  "@nestjs/platform-socket.io": "^11.1.9"
}
```

**Environment Variables:**
```bash
# Без змін - використовуємо існуючі
```

---

## 🎯 ACCEPTANCE CRITERIA:

**v0.3 Criteria - ЧАСТКОВО ВИКОНАНІ:**

- [✅] Socket.io підключення працює
- [✅] Real-time messaging між клієнтами
- [✅] ChatBox UI component
- [✅] Room-based chat
- [⚠️] Typing indicators (UI готовий, backend частково)
- [❌] **Database persistence** - критично!
- [❌] **Message history** з БД
- [❌] **Production-ready gateway** (ChatGateway)
- [❌] Multiple rooms per organization
- [❌] Chat list/navigation

**Поточний статус:** 4/10 критеріїв виконано (40%) 🔄

---

## 🔍 ЩО ПРАЦЮЄ ЗАРАЗ:

**✅ Working (TestGateway POC):**
```
User 1 відправляє повідомлення 
→ Socket.io emit 'send_message'
→ TestGateway.handleMessage()
→ server.to(chatId).emit('receive_message')
→ User 2 отримує миттєво
→ Показує в UI
```

**❌ What's Missing:**
- Повідомлення НЕ зберігаються в БД
- Після перезавантаження - історія зникає
- chatId = "test-room" hardcoded
- Немає ChatService (in-memory тільки)

---

## 📈 ПРОГРЕС ДО MILESTONES:

**v0.3 = 50% COMPLETE** 🔄

**Що залишилось:**
1. **Виправити ChatService** (1-2 дні)
   - web_search best practices
   - Скопіювати working example
   - Протестувати з Prisma
2. **Database persistence** (1 день)
   - Зберігати messages
   - Завантажувати history
3. **Production gateway** (1 день)
   - Повернути ChatGateway
   - Видалити TestGateway
   - Full integration test

**Наступні кроки:**
- v0.4 - AI Teammate + Task Manager (10 днів)
- v0.5 - Site Audit (12 днів) = **INVESTOR DEMO** 🔥

---

## 🎓 LESSONS LEARNED:

**Що працювало добре:**
- ✅ Простий TestGateway як proof of concept
- ✅ Step-by-step debugging
- ✅ Hardcoded test-room для тестування broadcasting
- ✅ Git Bash замість PowerShell

**Що не спрацювало:**
- ❌ Складний ChatService з Prisma одразу
- ❌ Намагання виправити TypeError "наосліп"
- ❌ Не використали web_search для best practices

**Для наступного разу:**
- 💡 ЗАВЖДИ web_search спочатку для незнайомих тем
- 💡 Простий POC перед складною логікою
- 💡 Не витрачати >30 хв на одну проблему без search
- 💡 Документувати кожну проблему одразу

**Відкладено на продовження v0.3:**
- ChatService з Prisma (правильна реалізація)
- Database persistence
- Message history API endpoint
- Multiple chat rooms
- Chat list UI
- Typing indicators (backend)
- Read receipts
- User online status

---

## 📦 Released Versions

### v0.2 - Google Integration & Dashboard ✅

**Старт:** 15.11.2025  
**Завершено:** 16.11.2025  
**Статус:** ✅ **100% COMPLETE**  
**Реальний час:** 2 дні (5+ годин активної роботи з troubleshooting)

---

## ✅ ЩО РЕАЛІЗОВАНО (100%):

### Backend Infrastructure (100%)

**OAuth Integration:**
- ✅ Google OAuth 2.0 повністю працює
- ✅ `GoogleStrategy` з `authorizationParams()` method
- ✅ Refresh token успішно отримується і зберігається
- ✅ Access token працює
- ✅ OAuth endpoints:
  - `GET /api/integrations/google/connect` - ініціює OAuth
  - `GET /api/integrations/google/callback` - приймає callback
  - `GET /api/integrations/:provider` - check connection status
- ✅ Перевірено end-to-end: користувач підключає Google через UI кнопку

**Token Encryption (AES-256-GCM):** 🔐
- ✅ Імплементовано повне шифрування токенів
- ✅ `crypto.createCipheriv()` для encryption
- ✅ `crypto.createDecipheriv()` для decryption
- ✅ ENCRYPTION_KEY в .env (32+ символів)
- ✅ Access + Refresh tokens зашифровані в БД
- ✅ Автоматична дешифровка при отриманні з БД
- ✅ IV (initialization vector) зберігається окремо

**Security Improvements:**
- ✅ JWT_SECRET без fallback - тільки з .env
- ✅ organizationId динамічний через `req.user.organizationId`
- ✅ JwtAuthGuard на OAuth connect endpoint (тимчасово закоментований для dev)
- ✅ Видалено дублікат `apps/api/.env` (конфлікт credentials)

**Database & Models:**
- ✅ `Integration` model працює
- ✅ Токени зберігаються зашифровані
- ✅ Composite unique key `(organizationId, provider)`
- ✅ Каскадне видалення налаштовано

### Frontend (100%)

**GoogleConnectButton Component:**
- ✅ Auto-detection connection status через API
- ✅ "✅ Connected" state з зеленою галочкою
- ✅ "Connect Google Account" кнопка для нових connections
- ✅ Loading state ("Loading...")
- ✅ Seamless redirect до backend OAuth endpoint
- ✅ useEffect для перевірки статусу при mount

**Dashboard Integration:**
- ✅ OAuth кнопка додана на dashboard
- ✅ Success states після OAuth flow
- ✅ Error handling UI (базовий)

**User Flow:**
```
Dashboard → Click "Connect" → Backend OAuth → Google screen 
→ User authorizes → Callback → Tokens encrypted → Save to DB 
→ Redirect to dashboard → Button shows "✅ Connected"
```

---

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
- ✅ Auth pages (Login, Signup)
- ✅ Dashboard page з sidebar navigation
- ✅ Responsive design

**Backend (NestJS):**
- ✅ NestJS project structure
- ✅ Prisma ORM integration
- ✅ PostgreSQL database
- ✅ User + Organization models
- ✅ JWT Authentication (signup, login)
- ✅ Password hashing (bcrypt)
- ✅ Guards & Strategies (JwtAuthGuard)
- ✅ CORS налаштовано

**Infrastructure:**
- ✅ Docker Compose (PostgreSQL + Redis)
- ✅ Monorepo structure (pnpm workspaces)
- ✅ Environment variables
- ✅ Git repo setup

**Acceptance Criteria - ВСІ ПРОЙДЕНІ:** ✅
- [✅] User signup → Organization auto-create
- [✅] User login → JWT token працює
- [✅] Dashboard видно після login
- [✅] Sidebar navigation
- [✅] Mobile responsive

---

## 📊 Version Statistics

| Version | Planned | Actual | Status | Completion Date |
|---------|---------|--------|--------|-----------------|
| v0.1 | 5 days | 1 day | ✅ Complete | 15.11.2025 |
| v0.2 | 6 days | 2 days | ✅ Complete | 16.11.2025 |
| v0.3 | 5 days | TBD | 🔄 In Progress (50%) | - |
| v0.4 | 10 days | TBD | 📋 Planned | - |
| v0.5 | 12 days | TBD | 📋 Planned | - |
| **Milestone 1** | **38 days** | **TBD** | **45% Complete** | **Target: Investor Demo** |

---

## 🎯 Progress to Milestones

**Investor Demo (v0.5):**
- ✅ v0.1 Foundation (100%)
- ✅ v0.2 Google Integration (100%)
- 🔄 v0.3 Chat Infrastructure (50%)
- ⏳ v0.4 AI Teammate + Tasks (0%)
- ⏳ v0.5 Site Audit (0%)
- **Overall: 50%** (2.5/5 versions) 🔄

**Beta Version (v0.8):**
- **Overall: 0%** (0/3 versions after Investor Demo)

**Public Launch (v1.0):**
- **Overall: 0%** (0/2 versions after Beta)

**Total Progress:** 25% (2.5/10 versions) 🔄

---

**Останнє оновлення:** 17.11.2025, evening  
**Поточна версія:** v0.3 🔄 **IN PROGRESS (50%)**  
**Наступний крок:** Виправити ChatService + Database persistence

**Keep building! 🚀**