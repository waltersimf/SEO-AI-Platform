# SEO AI Platform - Технічна документація

**Версія:** 1.3  
**Дата:** 06 листопада 2025  
**Статус:** MVP Planning

---

## 📋 Зміст

1. [Огляд проекту](#огляд-проекту)
2. [Концепція та УТП](#концепція-та-утп)
3. [Технічна архітектура](#технічна-архітектура)
4. [Технологічний стек](#технологічний-стек)
5. [Функціональні модулі](#функціональні-модулі)
6. [API інтеграції](#api-інтеграції)
7. [Multi-tenancy модель](#multi-tenancy-модель)
8. [Безпека та зберігання даних](#безпека-та-зберігання-даних)
9. [UI/UX концепція](#uiux-концепція)
10. [Економіка проекту](#економіка-проекту)
11. [Roadmap розробки](#roadmap-розробки)
12. [Deployment стратегія](#deployment-стратегія)

---

## 1. Огляд проекту

### 1.1. Назва проекту
**SEO AI Platform** (робоча назва)

### 1.2. Опис
AI-powered централізована платформа для SEO-команд та агентств, яка об'єднує всі інструменти SEO-аналізу в одному місці з автоматичним AI-аналізом та генерацією actionable рекомендацій.

### 1.3. Цільова аудиторія
- SEO-агентства (5-50+ клієнтів)
- Інхаус SEO-команди
- Фрілансери (1-5 клієнтів)
- Digital-маркетинг агентства

### 1.4. Проблема яку вирішуємо
SEO-спеціалісти щодня витрачають 1-3 години на:
- Перевірку 5-10+ різних інструментів (GSC, Analytics, Ahrefs, Serpstat, etc)
- Ручний збір та аналіз даних
- Створення звітів для клієнтів
- Пошук та пріоритизацію проблем
- Постановку задач команді

**Результат:** Рутина займає 40-60% робочого часу замість стратегічної роботи.

---

## 2. Концепція та УТП

### 2.1. Унікальна торгова пропозиція (УТП)

**"Один інструмент замість десяти. AI робить рутину — ви приймаєте рішення."**

#### Ключова відмінність від конкурентів:

| Традиційний підхід | SEO AI Platform |
|-------------------|-----------------|
| 10+ відкритих табів щодня | 1 платформа |
| Ручний збір даних | Автоматичний збір (cron) |
| "Ось дані - розбирайся сам" | AI пояснює ЩО і ЧОМУ сталось |
| Записати проблеми вручну | AI створює задачі автоматично |
| Годинами робити звіт | AI генерує за 30 секунд |
| Не помітив проблему = втрата | Миттєві алерти в Telegram |

### 2.2. Core Value Propositions

1. **Централізація** — всі SEO-інструменти в одному місці
2. **AI як мозок** — не просто дані, а аналіз та рекомендації
3. **Автоматизація рутини** — збір даних, аналіз, звіти, алерти
4. **Командна робота** — вбудований task manager для SEO
5. **BYOK модель** — користувач підключає свої API ключі (нульові витрати на API)

### 2.3. Приклад типового use case

**Традиційний ранок SEO-менеджера:**
```
08:00 - Відкрити Google Search Console (10 хв)
08:10 - Перевірити Analytics (15 хв)
08:25 - Зайти в Serpstat (20 хв)
08:45 - Записати проблеми в Notion/Trello (30 хв)
09:15 - Написати повідомлення команді

Разом: 1+ година на 1 проект
```

**З SEO AI Platform:**
```
08:00 - Відкрити дашборд
08:01 - AI вже проаналізував все за ніч:
       "Проект А: 🔴 критична проблема (15 нових 404)"
       "Проект Б: 🟢 все ОК, трафік +8%"
       "Проект В: 🟡 позитивна динаміка"
08:05 - Підтвердити автогенеровані задачі
08:10 - Готово, можна займатись стратегією

Разом: 10 хвилин на всі проекти
```

---

## 3. Технічна архітектура

### 3.1. Платформа: Web Application

**Рішення:** Web-based (НЕ Desktop app)

**Обґрунтування:**
- ✅ Простіше розробити (в 2 рази швидше)
- ✅ Не треба окремі білди для Windows/Mac/Linux
- ✅ Миттєві оновлення (git push = live)
- ✅ Працює на всіх пристроях (включно з мобільними)
- ✅ Краще для командної роботи (просто кинути посилання)
- ✅ SEO-спеціалісти і так живуть в браузері
- ✅ Дешевший хостинг

**Краулінг:** Виконується на backend серверах (не на ПК користувача) — швидше і надійніше

### 3.2. Високорівнева архітектура

```
┌─────────────────────────────────────────────────────┐
│          Користувач (Browser)                       │
│  - Бачить UI, пише в чат, натискає кнопки          │
└────────────────┬────────────────────────────────────┘
                 │ HTTPS (інтернет)
                 â–¼
┌─────────────────────────────────────────────────────┐
│         Frontend (Next.js 14)                       │
│                                                      │
│  ЩО ЦЕ: HTML/CSS/JavaScript в браузері             │
│                                                      │
│  ЩО РОБИТЬ:                                         │
│  • Показує красивий UI                              │
│  • Приймає ввід користувача                         │
│  • Відправляє запити на Backend                     │
│  • Показує відповіді від Backend                    │
│                                                      │
│  ЩО НЕ РОБИТЬ:                                      │
│  • НЕ викликає Claude/Serpstat напряму             │
│  • НЕ має доступу до БД                             │
│  • НЕ зберігає дані назавжди                        │
│                                                      │
│  Hosting: Vercel (безкоштовно для старту)          │
└────────────────┬────────────────────────────────────┘
                 │ REST API / WebSockets
                 â–¼
┌─────────────────────────────────────────────────────┐
│         Backend API (NestJS)                        │
│                                                      │
│  ЩО ЦЕ: Node.js сервер (працює 24/7 в хмарі)      │
│                                                      │
│  ЩО РОБИТЬ:                                         │
│  • Координує всю бізнес-логіку                      │
│  • Викликає External APIs (Claude, Google, etc)     │
│  • Управляє базою даних                             │
│  • Виконує автоматичні задачі (cron jobs)          │
│  • Обробляє background jobs (краулінг, аналіз)      │
│  • Захищає API ключі (encryption)                   │
│                                                      │
│  КОМПОНЕНТИ:                                        │
│  ┌──────────────────────────────────────────────┐  │
│  │ API Gateway Layer                            │  │
│  │ • Auth middleware (хто це?)                  │  │
│  │ • Organization context (яка компанія?)       │  │
│  │ • Rate limiting (не спамить?)                │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Business Logic Layer                         │  │
│  │ • Projects management                        │  │
│  │ • Tasks management                           │  │
│  │ • Data aggregation                           │  │
│  │ • AI analysis orchestration                  │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Integration Layer                            │  │
│  │ • Google APIs (GSC, GA4, Docs, Sheets)       │  │
│  │ • AI APIs (Claude, OpenAI)                   │  │
│  │ • SEO Tools (Serpstat, Ahrefs - optional)    │  │
│  │ • Notifications (Telegram, Email)            │  │
│  │                                               │  │
│  │ ВАЖЛИВО: Backend бере API ключі з БД         │  │
│  │ та викликає ці сервіси від імені користувача │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │ Background Jobs (BullMQ + Cron)              │  │
│  │                                               │  │
│  │ CRON JOBS (автоматичні задачі):              │  │
│  │ • Щоденний збір даних (06:00)                │  │
│  │ • Перевірка scheduled tasks (кожні 5 хв)     │  │
│  │ • AI аналіз змін                              │  │
│  │                                               │  │
│  │ QUEUE WORKERS (важкі задачі):                │  │
│  │ • Audit/Crawl jobs (10-30 хв)                │  │
│  │ • Semantic research (1-3 год)                │  │
│  │ • Report generation                           │  │
│  │                                               │  │
│  │ Користувач може закрити браузер —            │  │
│  │ задачі продовжують виконуватись!             │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  Hosting: Railway ($5-50/міс)                       │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        â–¼                 â–¼
┌──────────────┐  ┌──────────────┐
│  PostgreSQL  │  │  Redis       │
│  (Supabase)  │  │  (Upstash)   │
│              │  │              │
│ - Users      │  │ - Queue jobs │
│ - Projects   │  │ - Cache      │
│ - Tasks      │  │ - Sessions   │
│ - Audits     │  │              │
│ - Scheduled  │  │              │
│   Tasks      │  │              │
│ - API Keys   │  │              │
│   (encrypted)│  │              │
└──────────────┘  └──────────────┘
```

### Як компоненти взаємодіють:

**Приклад 1: Користувач пише в чат**
```
Користувач: "Зроби аудит site.com"
    ↓ (натискає Enter)
Frontend: відправляє POST /api/chat
    ↓ (через інтернет)
Backend: отримує запит
    ↓
Backend → Claude API: "Що user хоче?"
    ↓
Claude → Backend: "Він хоче аудит"
    ↓
Backend → Database: створює задачу
    ↓
Backend → Queue: додає audit job
    ↓
Backend → Frontend: "Аудит запущено!"
    ↓
Frontend → Користувач: показує повідомлення
```

**Приклад 2: Автоматичний щоденний збір даних**
```
06:00 ранку:
Cron (на Backend сервері): "Час! Запускаю скрипт"
    ↓
Backend: читає з БД всі активні проекти
    ↓
Backend → Database: дістає API ключі користувачів
    ↓
Backend → Google Search Console: збирає дані (паралельно для всіх)
Backend → Google Analytics: збирає дані
    ↓
Backend → Database: зберігає DataSnapshot
    ↓
Backend → Claude API: "Проаналізуй зміни"
    ↓
Claude → Backend: аналіз
    ↓
Backend → Database: зберігає Analysis
    ↓
Якщо critical → Backend → Telegram: відправляє alert
    ↓
Користувач прокидається → відкриває сайт → бачить свіжі дані
```

**Приклад 3: Scheduled Task**
```
П'ятниця, 17:00:
Користувач: "Зроби семантику на вихідні"
    ↓
Frontend → Backend → Claude (розуміє intent)
    ↓
Backend → Database: створює scheduledTask {scheduledFor: субота 10:00}
    ↓
Backend → Frontend: "Запланував!"

Субота, 10:00:
Cron (Backend): "Перевіряю scheduled tasks..."
    ↓
Backend → Database: SELECT tasks WHERE scheduledFor <= now
    ↓
Database: "Є задача: semantic_research"
    ↓
Backend → Serpstat API: збирає keywords (2-3 год)
    ↓
Backend → Claude API: кластеризує
    ↓
Backend → Database: зберігає результат
    ↓
Backend → Telegram: "✅ Готово!"

Понеділок, 09:00:
Користувач відкриває сайт
    ↓
Frontend → Backend: GET /api/scheduled-tasks/latest
    ↓
Backend → Database: читає результат
    ↓
Backend → Frontend: повертає дані
    ↓
Frontend: показує "✅ Семантика готова! 1,247 keywords"
```

### Чому саме така архітектура?

**Frontend окремо від Backend:**
- ✅ Безпека (API ключі на сервері, не в браузері)
- ✅ Швидкість (Backend ближче до APIs)
- ✅ Автоматизація (Backend працює 24/7, Frontend — ні)
- ✅ Масштабування (можна додати більше Backend серверів)

**Background Jobs окремо:**
- ✅ Довгі задачі не блокують API
- ✅ Користувач може закрити браузер
- ✅ Retry при помилках
- ✅ Пріоритизація задач

### 3.3. Краулінг архітектура

```
User → "Запустити аудит" → API endpoint
                              ↓
                         Add job to Queue (Redis)
                              ↓
                    ┌─────────────────────┐
                    │   Crawler Worker    │
                    │  (Background)       │
                    │                     │
                    │  Uses: Crawlee      │
                    │  + Playwright       │
                    │                     │
                    │  Crawls site        │
                    │  Analyzes pages     │
                    │  Saves to DB        │
                    └──────────┬──────────┘
                               ↓
                    ┌─────────────────────┐
                    │   AI Analysis       │
                    │   (Claude API)      │
                    │                     │
                    │  Finds issues       │
                    │  Generates tasks    │
                    └──────────┬──────────┘
                               ↓
                    Send notification (Telegram)
                               ↓
                    User sees results in Dashboard
```

**Переваги web-based краулінгу:**
- Користувач може закрити браузер — краулінг триває
- Потужні сервери (не залежить від ПК користувача)
- Паралельний краулінг декількох сайтів
- Результати доступні з будь-якого пристрою
- Можна робити автоматичні краули за розкладом

---

## 4. Технологічний стек

### 4.1. Frontend

**Framework:** Next.js 14 (React)

**Обґрунтування:**
- Server Components для швидкості
- App Router (file-based routing)
- Built-in API routes
- Відмінне SEO для лендінгу
- Vercel deployment (безкоштовно)

**UI Libraries:**
```
- shadcn/ui — компоненти
- Tailwind CSS — стилізація
- Lucide Icons — іконки
- Recharts — графіки
- React Hook Form — форми
- Zod — валідація
- TanStack Query — data fetching
```

### 4.2. Backend

**Framework:** NestJS (Node.js)

**Обґрунтування:**
- TypeScript native
- Модульна архітектура
- Built-in dependency injection
- Схожість на Angular (знайома структура)
- Чудова документація

**Key Libraries:**
```
- Prisma — ORM для PostgreSQL
- BullMQ — черги для фонових задач
- Passport.js — аутентифікація
- Socket.io — real-time (опціонально)
- @nestjs/schedule — cron jobs
```

### 4.3. Database

**Primary:** PostgreSQL (Supabase)

**Обґрунтування:**
- Реляційна модель для структурованих даних
- Row Level Security (built-in multi-tenancy)
- JSON support для гнучких полів
- Supabase надає auth + realtime out-of-box

**Cache/Queue:** Redis (Upstash)

**Обґрунтування:**
- Кешування API відповідей
- BullMQ черги для фонових задач
- Швидкий доступ до часто використовуваних даних

### 4.4. Crawler

**Library:** Crawlee + Playwright

**Обґрунтування:**
- JavaScript rendering (реальний браузер)
- Автоматичні retry
- Обхід rate limits
- Паралельний краулінг
- Проста інтеграція

**Альтернатива для простих завдань:** Axios + Cheerio

### 4.5. AI Integration

**Primary:** Anthropic Claude API (Sonnet 4)

**Обґрунтування:**
- Найкращий для аналітичних задач
- Великий context window (200K tokens)
- Дешевше ніж GPT-4
- Кращий для structured output

**Fallback:** OpenAI GPT-4o (опціонально)

### 4.6. Infrastructure

**Deployment:**
```
Frontend: Vercel (безкоштовно для старту)
Backend: Railway або Render ($5-50/міс)
Database: Supabase (безкоштовно до 500MB)
Queue/Cache: Upstash Redis (безкоштовно до 10K req)
```

**Cost для MVP:** ~$0-30/міс

---

## 5. Функціональні модулі

### 5.1. Module: Authentication & Organizations

**Функції:**
- Реєстрація/логін (email + password)
- OAuth через Google (для GSC/GA4/Docs)
- Multi-tenancy (Organizations)
- Ролі на основі професій: Admin, SEO Specialist, Account Manager
- Invite system (запрошення в організацію)

**Database Schema:**
```prisma
model Organization {
  id          String   @id @default(cuid())
  name        String
  slug        String   @unique
  plan        String   @default("free") // free, pro, agency
  maxProjects Int      @default(5)
  
  users       User[]
  projects    Project[]
  
  createdAt   DateTime @default(now())
}

model User {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String
  passwordHash   String
  
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  role           String   @default("seo") // admin, seo, account_manager
  
  assignedTasks  Task[]
  
  createdAt      DateTime @default(now())
}
```

### 5.2. Module: Projects Management

**Функції:**
- Створення проекту (домен, назва)
- Налаштування проекту
- Підключення API інтеграцій
- Видалення/архівування проекту

**Database Schema:**
```prisma
model Project {
  id             String   @id @default(cuid())
  domain         String
  name           String
  
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  // Settings
  cms            String?  // wordpress, shopify, custom
  crawlSchedule  String   @default("weekly") // daily, weekly, monthly
  
  // Relations
  integrations   Integration[]
  audits         Audit[]
  tasks          Task[]
  dataSnapshots  DataSnapshot[]
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### 5.3. Module: Integrations (API Keys Management)

**Функції:**
- Підключення API (OAuth або manual)
- Зберігання зашифрованих credentials
- Тестування підключення
- Моніторинг usage/limits
- Статус інтеграцій (active, error, expired)

**Database Schema:**
```prisma
model Integration {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  provider       String   // 'gsc', 'ga4', 'anthropic', 'serpstat', 'ahrefs'
  encryptedData  String   // JSON з credentials (AES-256 encrypted)
  
  status         String   @default("active") // active, error, expired
  lastChecked    DateTime?
  errorMessage   String?
  
  usage          Json?    // { requests: 1234, limit: 25000 }
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

**Encryption:**
- Algorithm: AES-256-GCM
- Key: 32-byte random (env variable)
- IV: 16-byte random per record
- Auth tag для integrity

### 5.4. Module: Data Collection (Cron Jobs)

**Функції:**
- Щоденний збір даних (cron: 6:00 AM)
- Паралельний збір з усіх джерел
- Зберігання snapshots
- Розрахунок змін (delta)

**Sources:**
- Google Search Console (impressions, clicks, errors)
- Google Analytics (traffic, bounce rate)
- PageSpeed Insights (CWV scores)
- Serpstat (rankings, keywords) — опціонально

**Database Schema:**
```prisma
model DataSnapshot {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  
  date      DateTime @default(now())
  
  // Metrics (JSON)
  gscMetrics      Json // { impressions, clicks, ctr, errors: [...] }
  ga4Metrics      Json // { organic, bounceRate, avgTime }
  pagespeedMetrics Json? // { mobile: {}, desktop: {} }
  serpstatMetrics  Json? // { rankings: [...] }
  
  createdAt DateTime @default(now())
  
  @@index([projectId, date])
}
```

### 5.5. Module: AI Analysis Engine

**Функції:**
- Автоматичний аналіз змін
- Виявлення проблем та аномалій
- Генерація пояснень (чому це сталося)
- Створення рекомендацій
- Пріоритизація проблем (low, medium, high, critical)

**Flow:**
```
1. New DataSnapshot → Trigger AI analysis
2. Compare with previous snapshot
3. Calculate changes (%, absolute)
4. Send to Claude API with prompt:
   "Проаналізуй зміни SEO метрик..."
5. Parse AI response (JSON)
6. Save analysis to DB
7. If critical → Send alert
8. Auto-generate tasks if needed
```

**Database Schema:**
```prisma
model Analysis {
  id        String   @id @default(cuid())
  projectId String
  
  date      DateTime @default(now())
  
  severity  String   // info, warning, critical
  mainIssue String?  // "Різке падіння трафіку"
  
  explanation     String  // AI-generated explanation
  recommendations String[] // Array of recommendations
  urgency         String  // low, medium, high
  
  // Що саме змінилось
  changes   Json    // { gsc: { impressions: { old, new, change } }, ... }
  
  createdAt DateTime @default(now())
}
```

### 5.6. Module: Site Audit & Crawler

**Функції:**
- On-demand краулінг сайту
- Scheduled crawls (weekly, monthly)
- Технічний аналіз кожної сторінки
- Виявлення SEO проблем
- Збереження історії аудитів

**Що перевіряється:**
- HTTP статус коди (404, 500, redirects)
- Meta tags (title, description, missing/duplicates)
- Headings (H1 missing, multiple H1)
- Content (word count, thin content)
- Images (missing alt, large size, broken)
- Links (broken, external without nofollow)
- Technical (canonical, robots, sitemap)
- Speed (load time, Core Web Vitals)

**Database Schema:**
```prisma
model Audit {
  id        String   @id @default(cuid())
  projectId String
  project   Project  @relation(fields: [projectId], references: [id])
  
  status    String   @default("queued") // queued, running, completed, failed
  progress  Int      @default(0) // 0-100
  
  // Settings
  maxPages  Int      @default(1000)
  maxDepth  Int      @default(5)
  
  // Results
  pagesScanned Int    @default(0)
  issues       Json?  // Grouped by category and severity
  
  startedAt    DateTime?
  completedAt  DateTime?
  createdAt    DateTime @default(now())
}

model AuditPage {
  id      String @id @default(cuid())
  auditId String
  audit   Audit  @relation(fields: [auditId], references: [id])
  
  url          String
  statusCode   Int
  title        String?
  metaDesc     String?
  h1           String[]
  wordCount    Int
  loadTime     Float
  
  issues       String[] // Array of issue types
  
  @@index([auditId, url])
}
```

### 5.7. Module: Task Management

**Концепція:**
Вбудований task manager спеціально для SEO-команд з AI-плануванням та автоматизацією. Замінює Jira/Trello/Asana для SEO задач.

**Ключові особливості:**
- ✅ **Schedule + Backlog система** (планування тижня)
- ✅ **AI планування** (автоматичний розподіл задач по днях)
- ✅ **Acceptance workflow** (підтвердження задач з estimated time)
- ✅ **Group tasks** (створення задачі на всіх членів команди)
- ✅ **Recurring tasks** (повторювані задачі)
- ✅ **Time tracking** (опціонально)
- ✅ **Drag & drop** (ручне редагування розкладу)

---

#### 5.7.1. Three Views Architecture

**Користувач бачить три views:**

```
┌────────────────────────────────────────────┐
│ 📋 My Tasks              [@Ivan ▼]         │
├────────────────────────────────────────────┤
│ TABS:                                      │
│ [📅 Schedule] [📋 Backlog] [✅ Done]       │
└────────────────────────────────────────────┘
```

**1. Schedule View** - розплановані задачі по днях:
```
Понеділок, 04.11          [7.5h / 7.5h] ✅
├─ 🔴 Fix 404 errors (2h)
├─ 🟡 Check indexation (1h)
└─ 🟢 Meta descriptions (4h)

Вівторок, 05.11           [8.2h / 7.5h] ⚠️
├─ ... (overload warning)
```

**2. Backlog View** - задачі без scheduledDate:
```
📋 BACKLOG (26 tasks)     [Est: 52h total]
├─ 🟢 Update robots.txt (2h)
├─ 🟢 Internal links audit (4h)
└─ ... (ще 24)
```

**3. Done View** - завершені задачі:
```
✅ COMPLETED (this week: 12 tasks, 38h)
```

---

#### 5.7.2. Task Creation (два способи)

**Варіант A: UI Form (швидко)**
```
┌────────────────────────────────────┐
│ Створити задачу                    │
├────────────────────────────────────┤
│ Назва: [Fix 404 errors]            │
│ Проект: [site-a.com ▼]             │
│ Виконавець: [Ivan ▼] або [Всі ▼]  │
│ Estimated time: [2] hours          │
│ Дедлайн: [08.11.2025]              │
│ Пріоритет: (•) High                │
│ [Create]                           │
└────────────────────────────────────┘
```

**Варіант B: AI Creation (детально)**
```
User: "Постав задачу на Івана щоб виправив 404 помилки 
       на site-a.com. Додай документ з аудиту. Дедлайн - п'ятниця."

AI розуміє:
{
  "assignee": "ivan@agency.com",
  "projectId": "site-a.com",
  "title": "Виправити 404 помилки",
  "description": "На сайті виявлено 15 помилок 404...",
  "priority": "high",
  "dueDate": "2025-11-08",
  "relatedDocuments": ["audit-doc-id"],
  "estimatedTime": null // Іван сам вкаже при acceptance
}
```

---

#### 5.7.3. Acceptance Workflow

**Коли хтось створює задачу на мене:**

```
1. Task створюється зі status: "pending_acceptance"
2. Я отримую notification (Telegram + In-app)
3. Бачу popup:

┌────────────────────────────────────┐
│ 🔔 Нова задача від @TeamLead       │
├────────────────────────────────────┤
│ 📋 Fix 404 errors                  │
│ Проект: site-a.com                 │
│ Дедлайн: 08.11.2025 (4 дні)       │
│                                    │
│ ⏱️ Скільки часу займе?             │
│ [2.5] hours                        │
│                                    │
│ 💬 Коментар (optional):            │
│ [____________________________]     │
│                                    │
│ [✅ Accept] [❌ Decline] [💬 Ask]  │
└────────────────────────────────────┘

4. Після Accept:
   - status → "backlog"
   - estimatedTime → 2.5h
   - Тімлід отримує: "✅ Ivan accepted (2.5h)"

5. Якщо Decline:
   - status → "declined"
   - Тімлід отримує: "❌ Ivan declined (причина)"
```

**Коли створюю на себе:**
- Estimated time обов'язковий (вказую одразу)
- Task одразу в backlog (немає acceptance)

---

#### 5.7.4. Group Tasks (на всіх = копія кожному)

**Створення задачі "на всіх":**

```
Тімлід: "Створи задачу на всіх: переглянути новий документ"

System:
├─ Знаходить всіх team members
├─ Створює ОКРЕМИЙ Task для кожного:
│   ├─ Task 1: assignee = Ivan
│   ├─ Task 2: assignee = Anna
│   ├─ Task 3: assignee = Petro
│   └─ ...
├─ Всі задачі мають groupTaskId (для зв'язку)
└─ Кожен отримує notification для acceptance
```

**Тімлід бачить group progress:**
```
┌────────────────────────────────────┐
│ 📋 Group Task Status               │
├────────────────────────────────────┤
│ Task: "Переглянути документ"       │
│                                    │
│ Team Progress:                     │
│ ✅ Ivan - Accepted (2h) - Done     │
│ ✅ Anna - Accepted (1.5h) - Todo   │
│ ⏳ Petro - Pending acceptance      │
│ ❌ Maria - Declined (vacation)     │
│                                    │
│ Summary: 2/4 accepted, 1 declined  │
└────────────────────────────────────┘
```

---

#### 5.7.5. AI Planning (розподіл на тиждень)

**User команда:**
```
User: "AI, створи розклад на тиждень"
```

**AI workflow:**
```typescript
1. Отримує всі tasks з Backlog (де estimatedTime є)
2. Читає user settings:
   - workingHoursPerDay: 8h
   - bufferTime: 0.5h (резерв)
   - availablePerDay: 7.5h
3. Враховує:
   - Critical tasks → першими
   - Deadlines (urgent → priority)
   - Priority (high → перед medium)
4. Розподіляє по днях (max 7.5h/day):
   Monday: 3 tasks (7h)
   Tuesday: 4 tasks (7.5h)
   Wednesday: 3 tasks (6.5h)
   ...
5. Якщо не вмістились → залишаються в Backlog
```

**AI повертає:**
```
✅ Розклад на тиждень готовий!

Понеділок (7h):
• Fix 404 errors (critical, 2h)
• Check indexation (high, 1h)
• Meta tags - start (medium, 4h)

...

⚠️ Не вмістились 5 задач (12h) - залишились в Backlog
⚠️ 3 tasks без estimated time - поставив по пріоритету

[✅ Apply] [✏️ Edit] [✗ Cancel]
```

---

#### 5.7.6. Estimated Time Logic

**Правила:**

| Сценарій | Estimated Time |
|----------|----------------|
| Створюю на себе | Обов'язково вказую одразу ✅ |
| Хтось на мене | Вказую при acceptance ✅ |
| AI генерує | AI робить базовий estimate |
| Старі tasks (edge case) | AI ставить по deadline/priority |

**Edge case (без estimated time):**
```
Якщо task без часу потрапив в планування:
├─ AI аналізує deadline + priority
├─ Якщо critical + urgent deadline → ставить першим
├─ Якщо normal → виділяє весь день (8h) з warning
└─ User може поправити manually
```

---

#### 5.7.7. Recurring Tasks

**Типи періодичності:**
- Daily (щодня)
- Weekly (щотижня, конкретний день)
- Monthly (щомісяця, конкретне число)
- Custom (cron expression)

**Як працює:**
```
1. User створює recurring task:
   "Перевірити GSC щопонеділка о 09:00"

2. Зберігається master task:
   {
     isRecurring: true,
     recurringPattern: "weekly",
     recurringConfig: {
       dayOfWeek: "monday",
       time: "09:00"
     }
   }

3. Cron job (щодня 00:00):
   - Перевіряє recurring tasks
   - Якщо настав час → створює instance:
     {
       parentTaskId: "master-id",
       scheduledDate: "2025-11-04",
       status: "scheduled"
     }

4. User бачить задачу в Schedule на понеділок
```

---

#### 5.7.8. Time Tracking (опціонально)

**Manual tracking:**
```
1. User: [▶️ Start task] → timer починається
2. Працює... (timer йде)
3. User: [⏸️ Pause] → timer зупиняється
4. User: [▶️ Continue] → timer продовжує
5. User: [✅ Complete] → actualTime зберігається
```

**Time entries:**
```
⏱️ Time Tracking:
┌────────────────────────────────┐
│ Current: 01:23:45              │
│ [⏸️ Pause] [⏹️ Stop]           │
└────────────────────────────────┘

History:
• Today 10:00-11:30 (1.5h)
• Today 14:00-15:23 (1.4h)
───────────────────────────
Total: 2.9h / 2h estimated ⚠️
```

**Benefits:**
- Порівняння estimated vs actual
- AI вчиться (покращує estimates)
- Team reports для тімліда

---

#### 5.7.9. Task Statuses (повний список)

```typescript
enum TaskStatus {
  // Acceptance stage
  "pending_acceptance"  // Очікує підтвердження assignee
  "declined"            // Відхилено assignee
  
  // Planning stage
  "backlog"             // В черзі (без scheduledDate)
  "scheduled"           // Розплановано на дату
  
  // Execution stage
  "todo"                // Сьогодні треба почати
  "in_progress"         // В роботі зараз
  
  // Blocked/Paused
  "blocked"             // Заблоковано (чекає щось)
  "paused"              // На паузі (відклав)
  
  // Completed
  "done"                // Виконано ✅
  "wont_do"             // Не будемо робити
}
```

**Workflow:**
```
pending_acceptance → [Accept + set time] → backlog
                  ↘ [Decline] → declined

backlog → [AI schedules OR manual] → scheduled
                                   ↘ todo → in_progress → done
                                                        ↘ blocked
                                                        ↘ paused
```

---

#### 5.7.10. User Settings (планування)

```typescript
model UserSettings {
  userId           String @unique
  
  // Work schedule
  workingHoursPerDay Float @default(8)
  workingDays        String[] // ["monday", "tuesday", ...]
  bufferTime         Float @default(0.5) // резерв часу
  
  // AI planning
  aiPlanningEnabled  Boolean @default(true)
  allowOverload      Boolean @default(false) // AI може >8h?
  
  // Time tracking
  timeTrackingEnabled Boolean @default(false)
  autoStopAfterIdle   Int? @default(15) // minutes
}
```

---

#### 5.7.11. Drag & Drop (manual editing)

**User може manually:**
- Перетягувати tasks між днями
- Змінювати порядок в одному дні
- Переносити з Backlog → Schedule
- Переносити з Schedule → Backlog

```typescript
// Frontend (React)
const handleDragEnd = (result) => {
  const newDate = result.destination.droppableId;
  
  await updateTask(taskId, {
    scheduledDate: newDate
  });
};
```

---

#### 5.7.12. Database Schema (повна версія)

```prisma
model Task {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  
  // Basic info
  title       String
  description String
  
  // Status & Assignment
  status        String   @default("backlog") // enum TaskStatus
  assignedToId  String   // ЗАВЖДИ є! (не null)
  assignedTo    User     @relation(fields: [assignedToId], references: [id])
  createdBy     String   // userId або 'ai'
  
  // Scheduling
  scheduledDate DateTime? // null = в Backlog, є дата = в Schedule
  dueDate       DateTime? // deadline
  
  // Estimated time
  estimatedTimeMin Float?  // в годинах (2)
  estimatedTimeMax Float?  // в годинах (3)
  estimatedTimeBy  String? // 'user', 'ai', або null
  
  // Actual time (after completion)
  actualTimeSpent  Float?  // фактичний час
  
  // Priority
  priority    String   @default("medium") // low, medium, high, critical
  
  // Tags & Relations
  tags        String[] // ['technical', 'content', 'links']
  relatedUrls String[] // URLs пов'язані з задачею
  
  // Group tasks
  groupTaskId String?  // зв'язує копії однієї задачі
  isGroupTask Boolean  @default(false)
  
  // Acceptance tracking
  acceptedAt    DateTime?
  declinedAt    DateTime?
  declineReason String?
  
  // Recurring tasks
  isRecurring      Boolean @default(false)
  recurringPattern String? // "daily", "weekly", "monthly", "custom"
  recurringConfig  Json?   // { dayOfWeek: "monday", time: "09:00" }
  parentTaskId     String? // якщо це instance of recurring task
  
  // Time tracking
  timeTrackingEnabled Boolean @default(false)
  timeEntries         TimeEntry[]
  
  // Relations
  documents   TaskDocument[] // зв'язок з Google Drive docs
  comments    Comment[]
  
  // Tracking
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  completedAt DateTime?
  
  @@index([assignedToId, status])
  @@index([scheduledDate])
  @@index([projectId])
  @@index([groupTaskId])
}

model TaskDocument {
  id             String @id @default(cuid())
  taskId         String
  task           Task   @relation(fields: [taskId], references: [id])
  googleDriveId  String
  title          String
  
  @@index([taskId])
}

model TimeEntry {
  id       String   @id @default(cuid())
  taskId   String
  task     Task     @relation(fields: [taskId], references: [id])
  
  userId   String   // хто тректив
  user     User     @relation(fields: [userId], references: [id])
  
  startedAt  DateTime
  endedAt    DateTime?
  duration   Float   // в годинах
  
  note     String?  // "Робив redirects"
  
  createdAt DateTime @default(now())
  
  @@index([taskId])
  @@index([userId])
}

model Comment {
  id       String   @id @default(cuid())
  taskId   String
  task     Task     @relation(fields: [taskId], references: [id])
  
  authorId String
  author   User     @relation(fields: [authorId], references: [id])
  
  content  String
  
  createdAt DateTime @default(now())
  
  @@index([taskId])
}

model UserSettings {
  id         String   @id @default(cuid())
  userId     String   @unique
  user       User     @relation(fields: [userId], references: [id])
  
  // Work schedule
  workingHoursPerDay Float    @default(8)
  workingDays        String[] @default(["monday", "tuesday", "wednesday", "thursday", "friday"])
  bufferTime         Float    @default(0.5)
  
  // AI planning preferences
  aiPlanningEnabled  Boolean  @default(true)
  allowOverload      Boolean  @default(false)
  
  // Time tracking
  timeTrackingEnabled Boolean @default(false)
  autoStopAfterIdle   Int?    @default(15) // minutes
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

---

#### 5.7.13. AI Commands (приклади)

**Користувач може:**

```
"Створи розклад на тиждень"
→ AI розподіляє backlog tasks на 5 днів

"Постав задачу на Івана: виправити 404, дедлайн п'ятниця"
→ AI створює task з acceptance workflow

"Створи задачу на всіх: переглянути документ"
→ AI створює копію для кожного члена команди

"Перенеси все з четверга на п'ятницю"
→ AI масово змінює scheduledDate

"Які задачі найважливіші зараз?"
→ AI аналізує пріоритети та deadlines

"Оптимізуй мій тиждень - забагато на понеділок"
→ AI перерозподіляє для балансу
```

---

#### 5.7.14. Notifications

**Коли відправляються:**

| Подія | Кому | Канал |
|-------|------|-------|
| Нова задача створена на мене | Assignee | Telegram + In-app |
| Task accepted | Автор задачі | In-app |
| Task declined | Автор задачі | In-app + Telegram |
| Deadline за 24 год | Assignee | Telegram |
| Task overdue | Assignee + Тімлід | Telegram |
| Group task progress | Автор (тімлід) | In-app |
| Згадали в коментарі (@mention) | User | In-app |

---

#### 5.7.15. Phase 2 Features (не в MVP)

**Відкладено на Phase 2:**
- ❌ Task dependencies (блокування задач)
- ❌ Real subtasks (окремі DB records)
- ❌ Audit log (повна історія змін)
- ❌ Bulk operations (масові дії)
- ❌ Sprint/Milestone planning
- ❌ Kanban board view
- ❌ Calendar view
- ❌ Gantt chart (timeline)

**MVP включає:**
- ✅ Schedule + Backlog + Done views (List)
- ✅ UI форма + AI створення
- ✅ Acceptance workflow
- ✅ Group tasks
- ✅ AI planning
- ✅ Recurring tasks
- ✅ Time tracking (basic)
- ✅ Drag & drop
- ✅ Comments + tags
- ✅ Notifications

---

### 5.8. Module: Alerts & Notifications

**Функції:**
- Real-time алерти (критичні проблеми)
- Telegram notifications
- Email notifications (опціонально)
- Slack webhooks (опціонально)

**Triggers:**
- Трафік впав >20%
- Помилки індексації (new 404/500)
- Позиції впали на >5 позицій
- Core Web Vitals погіршились
- Manual trigger від користувача

**Приклад Telegram повідомлення:**
```
🔴 КРИТИЧНО: site.com

Органічний трафік впав на 35% за 3 дні!

Причини:
• Google Core Update (15.10)
• 23 нові 404 помилки
• Падіння позицій по 15 ключових запитах

Рекомендації:
1. Виправити 404 (список у задачах)
2. Перевірити якість контенту
3. Моніторити далі 7 днів

[Відкрити дашборд] [Створити задачі]
```

### 5.9. Module: Reports & Export

**Функції:**
- Автоматична генерація звітів (AI)
- Експорт у Google Docs
- Експорт у Google Sheets
- Експорт у PDF (опціонально)
- Презентації в Google Slides (Phase 2)

**Типи звітів:**
- Щоденний brief (morning brief)
- Щотижневий summary
- Місячний звіт для клієнта
- Audit report (після краулінгу)

**Google Docs генерація:**
```typescript
// Приклад структури документу
{
  title: "SEO Аудит site.com — 01.11.2025",
  sections: [
    {
      heading: "Executive Summary",
      content: aiGenerated.summary
    },
    {
      heading: "Ключові проблеми",
      content: aiGenerated.mainIssues,
      bullet_points: true
    },
    {
      heading: "Рекомендації",
      content: aiGenerated.recommendations
    },
    {
      heading: "Метрики",
      table: metricsData
    }
  ]
}
```

### 5.10. Module: AI Chat Assistant

**Функції:**
- Розмовний інтерфейс для аналізу
- Питання-відповідь про проект
- Генерація стратегій
- Пояснення технічних термінів
- Context-aware (знає всі дані проекту)

**Приклади запитів:**
```
User: "Чому впав трафік на site.com?"
AI: "Проаналізував дані за останній тиждень. Бачу 3 причини:
     1. Google Core Update (15.10) — ваш сайт під фільтром
     2. Конкурент запустив 15 нових статей
     3. Сезонність (жовтень завжди -10%)
     
     Найімовірніше комбінація #1 + #3. Рекомендую..."

User: "Які задачі найважливіші зараз?"
AI: "За пріоритетом:
     🔴 КРИТИЧНО: Виправити 15 помилок 404
     🟡 ВАЖЛИВО: Оптимізувати 8 повільних сторінок
     🟢 БАЖАНО: Додати 50 внутрішніх посилань
     
     Почніть з 404 — це найбільше впливає на індексацію."
```

---

### 5.11. Module: AI Task Scheduler (Scheduled Tasks)

**Функції:**
- Створення відкладених AI задач
- Планування складних операцій на зручний час
- Автоматичне виконання без участі користувача
- Recurring tasks (періодичні задачі)
- Розумна оптимізація часу виконання

**Use Cases:**
```
"Зібрати семантику на вихідні"
"Зробити конкурентний аналіз щопонеділка"
"Генерувати місячні звіти 1 числа"
"Краулити сайт щотижня вночі"
```

**Database Schema:**
```prisma
model ScheduledTask {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  
  // Що робити
  taskType    String   // 'semantic_research', 'competitor_analysis', 'full_audit', 'report_generation'
  parameters  Json     // Параметри задачі
  
  // Коли
  scheduledFor DateTime
  timezone     String   @default("Europe/Kiev")
  
  // Періодичність (опціонально)
  recurring    Boolean  @default(false)
  cronSchedule String?  // "0 10 * * 6" = щосуботи о 10:00
  
  // Статус
  status      String   @default("scheduled") // scheduled, running, completed, failed
  startedAt   DateTime?
  completedAt DateTime?
  
  // Результати
  resultData  Json?
  errorMessage String?
  
  // Notification
  notifyOnComplete Boolean @default(true)
  notifyChannels   String[] // ['telegram', 'email']
  
  createdAt   DateTime @default(now())
  createdBy   String
}
```

**Як працює:**

1. **Створення задачі (через AI або UI):**
```typescript
User: "Зібри семантику по проекту site.com на вихідні"

// Frontend → Backend
// Backend → Claude API (розуміє intent)
const intent = await claude.analyze(userMessage);
// Claude: { taskType: "semantic_research", scheduledFor: "2025-11-02T10:00:00Z" }

// Backend → Database (записує задачу)
await prisma.scheduledTask.create({
  data: {
    taskType: "semantic_research",
    scheduledFor: new Date("2025-11-02T10:00:00Z"),
    projectId: project.id,
    createdBy: user.id
  }
});
```

2. **Автоматичне виконання (Backend cron job):**
```typescript
// Кожні 5 хвилин Backend перевіряє БД
@Cron('*/5 * * * *')
async checkScheduledTasks() {
  const now = new Date();
  
  // Знайти задачі що треба запустити
  const tasks = await prisma.scheduledTask.findMany({
    where: {
      scheduledFor: { lte: now },
      status: 'scheduled'
    }
  });
  
  // Виконати кожну задачу
  for (const task of tasks) {
    await this.executeTask(task);
  }
}

async executeTask(task: ScheduledTask) {
  // 1. Отримати API ключі користувача з БД
  const serpstatKey = await getApiKey(task.projectId, 'serpstat');
  const claudeKey = await getApiKey(task.projectId, 'anthropic');
  
  // 2. Виконати задачу (може тривати години)
  const keywords = await serpstat.getKeywords(serpstatKey);
  const clusters = await claude.cluster(keywords, claudeKey);
  
  // 3. Зберегти результат
  await prisma.scheduledTask.update({
    where: { id: task.id },
    data: {
      status: 'completed',
      resultData: { keywords, clusters }
    }
  });
  
  // 4. Notification
  await telegram.send('✅ Семантика готова!');
}
```

3. **Користувач бачить результат:**
```typescript
// Понеділок: користувач відкриває платформу
// Frontend запитує Backend
const result = await fetch('/api/scheduled-tasks/latest');
// Backend читає з БД і повертає готові дані
```

**Переваги:**
- 🕐 Розподіл навантаження (важкі задачі вночі/на вихідні)
- 💰 Оптимізація витрат API (off-peak hours)
- ⏰ Зручність (поставив — забув — готово)
- 🔄 Автоматизація (periodic tasks)
- 👥 Team workload balancing

**Templates (швидкі дії):**
```
📊 "Зібрати семантичне ядро на вихідні"
🔍 "Проаналізувати конкурентів щотижня"
📈 "Генерувати місячний звіт 1 числа"
🕷️ "Повний краулінг сайту щомісяця"
```

**Implementation Priority:**
- Phase 1 (MVP): Базові scheduled tasks
- Phase 2: AI створення задач через чат
- Phase 3: Recurring tasks + AI оптимізація часу

---

## 6. API Інтеграції

### 6.1. Модель: BYOK (Bring Your Own Keys)

**Концепція:**
Платформа НЕ надає API ключі. Користувач підключає свої власні API через налаштування.

**Переваги:**
- ✅ Нульові витрати на API з боку платформи
- ✅ Користувач контролює свої ліміти
- ✅ Прозорість використання
- ✅ Гнучкість (підключає тільки що треба)
- ✅ Масштабування без додаткових витрат

### 6.2. Список API та їх вартість

#### Обов'язкові (безкоштовні):

**1. Google Search Console API**
- Вартість: ✅ $0
- Ліміти: 1,200 req/хв
- Дані: Покази, кліки, CTR, помилки індексації

**2. Google Analytics Data API (GA4)**
- Вартість: ✅ $0
- Ліміти: 25,000 req/день
- Дані: Трафік, bounce rate, conversions

**3. Google Drive API**
- Вартість: ✅ $0
- Ліміти: 20,000 req/день
- Можливості: Пошук документів, організація файлів в папки, управління permissions
- Для чого: AI пошук документів по всіх проектах, автоматична організація, share з командою


**3. Google Docs API**
- Вартість: ✅ $0
- Можливості: Створення звітів, експорт

**4. Google Sheets API**
- Вартість: ✅ $0
- Можливості: Експорт задач, метрик

**6. PageSpeed Insights API**
- Вартість: ✅ $0
- Ліміти: 25,000 req/день
- Дані: Core Web Vitals, Performance score

**7. Telegram Bot API**
- Вартість: ✅ $0
- Ліміти: 30 messages/sec

#### Обов'язкові (платні):

**8. Anthropic Claude API**
- Вартість: 💰 $3/1M input + $15/1M output
- Типові витрати: $5-50/міс залежно від usage
- Для чого: AI аналіз, генерація звітів, чат

**9. OpenAI API** (fallback, опціонально)
- Вартість: 💰 $5/1M input + $15/1M output
- Типові витрати: $10-100/міс

#### Опціональні (платні SEO tools):

**10. Serpstat API**
- Вартість: 💰 $69-299/міс
- Дані: Keywords, rankings, backlinks, competitors

**11. Ahrefs API**
- Вартість: 💰 $500-1000/міс
- Дані: Найбільша база backlinks, DR, organic keywords

**12. SEMrush API**
- Вартість: 💰 $200-800/міс
- Альтернатива Serpstat/Ahrefs

#### Опціональні (notifications):

**13. SendGrid / Mailgun**
- Вартість: ✅ $0 для базового (100-5000 emails/міс)
- Для: Email звіти

**14. Slack Webhook**
- Вартість: ✅ $0

### 6.3. Типові витрати користувача

**Фрілансер (1-5 проектів):**
```
Google APIs: $0 ✅
Claude API: ~$10-20/міс
Платформа: $49/міс

РАЗОМ: ~$60-70/міс
```

**Агентство (10-30 проектів):**
```
Google APIs: $0 ✅
Claude API: ~$50-100/міс
Serpstat: $69-149/міс
Платформа: $149/міс

РАЗОМ: ~$270-400/міс
```

**Велике агентство (50+ проектів):**
```
Google APIs: $0 ✅
Claude API: ~$200-500/міс
Ahrefs API: $500/міс
Платформа: $499/міс

РАЗОМ: ~$1,200-1,500/міс
```

**ROI:** Економія 10-20 годин/тиждень = $2,000-4,000/міс вартості часу спеціаліста

---

### 6.4. Google OAuth Configuration (Organization-level)

**Модель:** Organization-level OAuth (Admin підключає для всієї організації)

**Як працює:**
1. Admin організації підключає свій Google Account один раз
2. OAuth tokens зберігаються на рівні Organization (encrypted)
3. Вся команда використовує ці самі токени
4. Документи створюються на Google Drive Admin'а
5. Автоматично share з усіма members організації

**Google Drive структура:**
```
Google Drive Admin'а:
  My Drive/
    SEO AI Platform/
      site-a.com/
        Reports/
        Keywords/
        Audits/
      site-b.com/
        Reports/
        ...
```

**Переваги:**
- ✅ Централізація (всі документи в одному місці)
- ✅ Простий onboarding (команда не налаштовує OAuth)
- ✅ Контроль (Admin управляє доступом)
- ✅ Continuity (документи залишаються при звільненні)

---

## 7. Multi-tenancy модель

### 7.1. Organization-based Architecture

**Структура:**
```
Organization (Компанія/Агентство)
├── Users (Команда)
│   ├── 👑 Admin (Owner/Team Lead)
│   │   └── Повний контроль над організацією
│   ├── 🔍 SEO Specialist
│   │   └── Технічна SEO робота
│   └── 💼 Account Manager
│       └── Клієнтська робота та звіти
│
└── Projects (Сайти клієнтів)
    ├── Project 1
    ├── Project 2
    └── Project 3
```

### 7.2. Row-Level Security (RLS)

**Принцип:** Кожен запит автоматично фільтрується по `organizationId`

```typescript
// Middleware додає organizationId до кожного request
app.use(async (req, res, next) => {
  const user = await getUserFromToken(req.headers.authorization);
  req.organizationId = user.organizationId;
  next();
});

// Всі запити автоматично фільтруються
const projects = await prisma.project.findMany({
  where: {
    organizationId: req.organizationId // Автоматично!
  }
});
```

**Результат:** Користувач НІКОЛИ не побачить дані іншої організації (гарантовано на рівні БД)

### 7.3. Ролі та права доступу

**Модель:** Ролі на основі професій (не рівні доступу)

| Дія | Admin | SEO | Account Manager |
|-----|-------|-----|-----------------|
| **Organization** |
| Управління організацією | ✅ | ❌ | ❌ |
| API ключі та інтеграції | ✅ | ❌ | ❌ |
| Білінг та підписка | ✅ | ❌ | ❌ |
| Запрошувати користувачів | ✅ | ❌ | ❌ |
| Видаляти користувачів | ✅ | ❌ | ❌ |
| **Projects** |
| Створювати проекти | ✅ | ❌ | ❌ |
| Видаляти проекти | ✅ | ❌ | ❌ |
| Налаштування проекту | ✅ | ⚠️ | ⚠️ |
| Переглядати проекти | ✅ | ✅ | ✅ |
| **Technical SEO** |
| Запускати аудити | ✅ | ✅ | ❌ |
| Краулінг сайтів | ✅ | ✅ | ❌ |
| Генерація семантики | ✅ | ✅ | ❌ |
| Конкурентний аналіз | ✅ | ✅ | ❌ |
| Переглядати результати аудитів | ✅ | ✅ | ⚠️ (summary) |
| **Analytics & Data** |
| GSC/GA4 дані | ✅ | ✅ | ✅ (спрощено) |
| Технічний аналіз | ✅ | ✅ | ⚠️ (summary) |
| PageSpeed / CWV | ✅ | ✅ | ⚠️ (summary) |
| **Reports** |
| Генерувати клієнтські звіти | ✅ | ⚠️ | ✅ |
| Експорт в Docs/Sheets | ✅ | ⚠️ | ✅ |
| Scheduled звіти | ✅ | ❌ | ✅ |
| **Tasks** |
| Створювати задачі | ✅ | ✅ | ✅ |
| Призначати задачі | ✅ | ✅ | ✅ |
| Виконувати задачі | ✅ | ✅ | ✅ |
| Коментувати | ✅ | ✅ | ✅ |
| **AI Chat** |
| Технічні питання | ✅ | ✅ | ⚠️ (обмежено) |
| Клієнтські питання | ✅ | ⚠️ (обмежено) | ✅ |

**Пояснення:**
- ✅ = Повний доступ
- ⚠️ = Обмежений доступ (спрощена версія або read-only)
- ❌ = Немає доступу

---

### 7.3.1. Детальний опис ролей

#### 👑 Admin (Owner/Team Lead)

**Фокус:** Управління організацією та інфраструктурою

**Основні обов'язки:**
- Налаштування organization (назва, план, біллінг)
- Управління API ключами (Google, Claude, Serpstat, etc)
- Запрошення/видалення членів команди
- Створення/видалення проектів
- Моніторинг витрат та usage
- Все що можуть SEO + Account Manager

**Доступ:** Повний контроль над усім

---

#### 🔍 SEO Specialist

**Фокус:** Технічна SEO робота та оптимізація

**Основні обов'язки:**

**Технічний аналіз:**
- Запускати технічні аудити (Crawlee)
- Краулінг сайтів (до 10K+ сторінок)
- Аналіз Core Web Vitals і швидкості
- Перевірка індексації через GSC
- PageSpeed аналіз

**Семантика та конкуренти:**
- Генерація семантичного ядра
- Кластеризація keywords (AI)
- Конкурентний аналіз (Serpstat/Ahrefs)
- Gap analysis (missing keywords)

**Аналітика:**
- Глибокий аналіз GSC/GA4 даних
- Трекінг позицій
- Backlinks аналіз
- Технічні метрики

**AI для технічних питань:**
- "Чому впав трафік?"
- "Які технічні проблеми критичні?"
- "Як покращити CWV?"

**Задачі:**
- Створювати технічні задачі
- Призначати на себе або інших
- Виконувати технічні завдання

**Обмеження:**
- ❌ НЕ може генерувати клієнтські звіти (це роль AM)
- ❌ НЕ може створювати/видаляти проекти
- ❌ НЕ має доступу до API налаштувань
- ❌ НЕ має доступу до біллінгу

---

#### 💼 Account Manager

**Фокус:** Клієнтська робота, звіти та комунікація

**Основні обов'язки:**

**Dashboard та Overview:**
- High-level метрики всіх проектів
- Статус проектів ("все ОК" / "потрібна увага")
- Прогрес задач команди
- Ключові показники для клієнта

**Звіти та Презентації:**
- Генерація клієнтських звітів (AI)
- Експорт в Google Docs (красиві звіти)
- Експорт в Google Sheets (таблиці)
- Scheduled автоматичні звіти
- White-label звіти (Agency план)

**Управління задачами:**
- Створювати задачі для команди
- Призначати на SEO/PPC/Content/etc
- Відстежувати прогрес виконання
- Коментувати та давати feedback
- Змінювати пріоритети

**AI для клієнтських питань:**
- "Створи звіт для клієнта за місяць"
- "Які досягнення показати на зустрічі?"
- "Що сказати клієнту про падіння трафіку?"

**Notifications:**
- Алерти про критичні проблеми
- Щоденні/тижневі summaries
- Telegram/Email updates

**Обмеження:**
- ⚠️ Бачить результати аудитів (summary, не деталі)
- ⚠️ Бачить технічні метрики (спрощена версія)
- ❌ НЕ може запускати технічні аудити
- ❌ НЕ може генерувати семантику
- ❌ НЕ може створювати/видаляти проекти
- ❌ НЕ має доступу до API налаштувань

---

### 7.3.2. Приклади UI для різних ролей

#### SEO Specialist бачить:

```
┌──────────────────────────────────────┐
│ 🔍 SEO Dashboard                     │
├──────────────────────────────────────┤
│                                       │
│ ⚡ Технічні алерти:                  │
│ 🔴 site-a.com: 15 нових 404          │
│ 🟡 site-b.com: CWV погіршились       │
│                                       │
│ 📊 Мої технічні задачі (8)           │
│ • Виправити 404 на site-a.com        │
│ • Оптимізувати швидкість site-b      │
│                                       │
│ 🤖 AI Tech Assistant                 │
│ "Питайте про технічні проблеми..."   │
│                                       │
│ [Запустити аудит] [Семантика] [GSC]  │
└──────────────────────────────────────┘
```

#### Account Manager бачить:

```
┌──────────────────────────────────────┐
│ 💼 Client Management                 │
├──────────────────────────────────────┤
│                                       │
│ 📈 Проекти (5 активних)              │
│ ┌────────────────────────────────┐   │
│ │ site-a.com                     │   │
│ │ Статус: 🟢 На треку            │   │
│ │ Трафік: +12% ✅                │   │
│ │ Задачі: 3 в роботі (SEO team)  │   │
│ │ [Згенерувати звіт для клієнта] │   │
│ └────────────────────────────────┘   │
│                                       │
│ ✅ Задачі команди                    │
│ • SEO: 5 активних, 2 на перевірці   │
│ • Content: 2 активних                │
│                                       │
│ 🤖 AI Client Assistant               │
│ "Згенеруйте звіт або створіть..."   │
│                                       │
│ [Створити звіт] [Нова задача команді]│
└──────────────────────────────────────┘
```

---

### 7.4. Onboarding Flow

**Новий користувач:**
```
1. Реєстрація на сайті
   ↓
2. Створюється Organization автоматично
   - name: "ACME Agency"
   - slug: "acme-abc123"
   - user стає Admin
   ↓
3. Onboarding wizard:
   - Підключити Google OAuth
   - Додати перший проект
   - Підключити Claude API
   ↓
4. Готово! Можна запустити перший аудит
```

**Запрошення члена команди:**
```
1. Admin → Settings → Team → Invite
   ↓
2. Вводить email + роль (SEO Specialist або Account Manager)
   ↓
3. Система відправляє invite link
   ↓
4. Новий user реєструється по лінку
   ↓
5. Автоматично додається в Organization з обраною роллю
   ↓
6. Бачить ТІ САМІ проекти що і Admin (з відповідним доступом)
```

**Приклад запрошення:**
```
Admin:
├─ Email: ivan@agency.com
├─ Роль: 🔍 SEO Specialist
└─ Надіслати запрошення

Admin:
├─ Email: maria@agency.com
├─ Роль: 💼 Account Manager
└─ Надіслати запрошення
```

---

### 7.5. Майбутні ролі (Phase 2+)

**MVP включає тільки 3 ролі.** В Phase 2 можна додати:

```
🎯 PPC Specialist
├─ Google Ads інтеграція
├─ Аналіз рекламних кампаній
├─ Оптимізація ставок
└─ Звіти по рекламі

✍️ Content Manager
├─ Контент-календар
├─ Управління статтями
├─ SEO-вимоги від SEO Specialist
└─ Дедлайни публікацій

🎨 Designer
├─ Креативи для реклами
├─ Банери для сайту
├─ Графіка для статей
└─ Задачі від Content Manager

👨‍💻 Developer
├─ Технічні правки на сайті
├─ Задачі від SEO Specialist
├─ Імплементація фіксів
└─ Deploy та тестування
```

**Рішення:** Додаємо після фідбеку від реальних користувачів MVP.

---

## 8. Безпека та зберігання даних

### 8.1. Шифрування API ключів

**Algorithm:** AES-256-GCM

**Процес:**
```typescript
// Encryption
1. Generate random 16-byte IV
2. Encrypt JSON data with AES-256-GCM
3. Get auth tag for integrity
4. Store: { iv, authTag, encryptedData }

// Decryption
1. Extract IV and authTag
2. Decrypt with AES-256-GCM
3. Verify authTag
4. Parse JSON
```

**Key management:**
- Encryption key зберігається в environment variables
- Ротація ключів: кожні 90 днів (automated)
- Backup keys для старих записів

### 8.2. Authentication

**Метод:** JWT (JSON Web Tokens)

**Flow:**
```
1. User login → Backend validates
   ↓
2. Generate JWT with payload:
   {
     userId: "xxx",
     organizationId: "yyy",
     role: "admin",
     exp: 7 days
   }
   ↓
3. Return JWT to client
   ↓
4. Client sends JWT in Authorization header
   ↓
5. Backend verifies signature + expiration
```

**Refresh tokens:** Окремий refresh token (30 днів) для оновлення access token

### 8.3. Rate Limiting

**На рівні API:**
- 100 requests/хв per user (standard)
- 1000 requests/хв per organization (large plans)

**На рівні AI:**
- Free plan: 10 AI queries/день
- Pro plan: 100 AI queries/день
- Agency plan: Unlimited

### 8.4. Data Retention

**Active data:** Зберігається необмежено

**Snapshots:** 
- Daily snapshots: 90 днів
- Weekly snapshots: 1 рік
- Monthly snapshots: 3 роки

**Audits:**
- Детальні результати: 6 місяців
- Summaries: Необмежено

**Deleted projects:**
- Soft delete: 30 днів (можна відновити)
- Hard delete: Після 30 днів (назавжди)

### 8.5. GDPR Compliance

- ✅ Right to access (експорт всіх даних)
- ✅ Right to deletion (повне видалення)
- ✅ Data portability (експорт у JSON/CSV)
- ✅ Encrypted storage
- ✅ Audit logs (хто що змінив)

---

## 9. UI/UX концепція

### 9.1. Основні сторінки

**1. Dashboard (головна)**
```
┌────────────────────────────────────────────┐
│  [Logo] SEO Platform    [🔍] [🔔] [@User] │
├────────────────────────────────────────────┤
│                                             │
│  🌅 Доброго ранку, Іван!                   │
│                                             │
│  📊 Огляд проектів (5 активних)            │
│  ┌──────────────────────────────────────┐  │
│  │ 🔴 site-a.com                        │  │
│  │    Критично: 15 нових 404 помилок   │  │
│  │    Трафік: -12% ⚠️                   │  │
│  │    [Детальніше] [Створити задачі]   │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐  │
│  │ 🟢 site-b.com                        │  │
│  │    Все добре, трафік +8% ✅          │  │
│  │    [Детальніше]                      │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  💬 AI Assistant                            │
│  "Питайте мене про будь-який проект..."    │
│                                             │
└────────────────────────────────────────────┘
```

**2. Project Detail**
```
┌────────────────────────────────────────────┐
│  ← Dashboard  |  site.com                  │
├────────────────────────────────────────────┤
│                                             │
│  📊 Метрики (за 30 днів)                   │
│  ┌─────┬─────┬─────┬─────┐                │
│  │ GSC │ GA4 │Speed│Tasks│                │
│  └─────┴─────┴─────┴─────┘                │
│                                             │
│  📈 [Графік трафіку]                       │
│                                             │
│  🤖 AI Інсайти                             │
│  "Органіка +15% завдяки покращенню..."     │
│                                             │
│  ⚠️ Проблеми (12)                          │
│  • 5 сторінок без meta description         │
│  • 3 битих посилання                       │
│  • 4 повільних зображення                  │
│                                             │
│  ✅ Задачі (8 активних)                    │
│  [Список задач...]                         │
│                                             │
└────────────────────────────────────────────┘
```

**3. Task Manager**
```
┌────────────────────────────────────────────┐
│  Задачі  |  site.com                       │
├────────────────────────────────────────────┤
│                                             │
│  [Фільтр: Всі ▼] [Сортувати: Пріоритет ▼]│
│                                             │
│  🔴 КРИТИЧНІ (3)                           │
│  ┌──────────────────────────────────────┐  │
│  │ ☐ Виправити 15 помилок 404          │  │
│  │   @ivan  |  До: 05.11  |  2 коменти  │  │
│  │   [Детальніше]                       │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  🟡 ВАЖЛИВІ (5)                            │
│  ┌──────────────────────────────────────┐  │
│  │ ☑ Додати meta description (50 стор.)│  │
│  │   @anna  |  Виконано ✅              │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  [+ Створити задачу]                       │
│                                             │
└────────────────────────────────────────────┘
```

**4. Settings → Integrations**
```
┌────────────────────────────────────────────┐
│  Налаштування  >  Інтеграції               │
├────────────────────────────────────────────┤
│                                             │
│  📊 Обов'язкові                            │
│  ┌──────────────────────────────────────┐  │
│  │ ✅ Google Search Console             │  │
│  │    Підключено: 3 властивості        │  │
│  │    [Керувати]                        │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  🤖 AI                                     │
│  ┌──────────────────────────────────────┐  │
│  │ ⚡ Anthropic Claude                  │  │
│  │    Статус: ✅ Активно                │  │
│  │    Баланс: $45.23                    │  │
│  │    [Налаштувати]                     │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  📈 SEO Tools (опціонально)                │
│  ┌──────────────────────────────────────┐  │
│  │ 🔍 Serpstat                          │  │
│  │    Статус: ❌ Не підключено          │  │
│  │    [Підключити]                      │  │
│  └──────────────────────────────────────┘  │
│                                             │
└────────────────────────────────────────────┘
```

**5. AI Chat**
```
┌────────────────────────────────────────────┐
│  💬 AI Assistant                           │
├────────────────────────────────────────────┤
│                                             │
│  User: Чому впав трафік на site.com?      │
│                                             │
│  AI: Проаналізував дані за тиждень.        │
│      Знайшов 3 причини:                    │
│      1. Google Core Update (15.10)         │
│      2. Конкурент запустив 15 статей       │
│      3. Сезонність (жовтень -10%)          │
│                                             │
│      Найімовірніше #1 + #3.                │
│      Рекомендую перевірити якість...       │
│                                             │
│  [Створити задачі] [Детальний звіт]       │
│                                             │
│  [Введіть повідомлення...]    [Надіслати] │
│                                             │
└────────────────────────────────────────────┘
```

### 9.2. Design System

**Колірна палітра:**
```
Primary: #3B82F6 (Blue)
Success: #10B981 (Green)
Warning: #F59E0B (Yellow)
Error: #EF4444 (Red)
Background: #FFFFFF / #0F172A (Light/Dark)
Text: #1E293B / #F1F5F9 (Light/Dark)
```

**Типографія:**
```
Font: Inter (Google Fonts)
Headings: 600-700 weight
Body: 400 weight
Code: 'Fira Code' monospace
```

**Spacing:**
```
Base unit: 4px
xs: 4px
sm: 8px
md: 16px
lg: 24px
xl: 32px
2xl: 48px
```

### 9.3. Responsive Design

**Breakpoints:**
```
Mobile: 0-640px
Tablet: 641-1024px
Desktop: 1025px+
```

**Mobile-first підхід:**
- Мобільні користувачі бачать компактний дашборд
- Tablet — повний функціонал
- Desktop — максимально інформативний

---

## 10. Documents Management

### 10.1. Концепція

Документи створюються через AI або UI, зберігаються на Google Drive організації.

**Доступ:**
- **UI:** `/projects/[id]/documents` (тільки для цього проекту)
- **AI Chat:** Глобальний пошук по всіх проектах

---

### 10.2. Створення документів

**AI-Generated:** Claude генерує контент + створює документ
**Manual:** User створює через UI (+ New Document button)

---

### 10.3. Naming Convention

**Формат:** `[Тип] - [Опис] - [Проект]`

**Приклади:**
- "Звіт - Жовтень 2025 - site-a.com"
- "ТЗ - Додавання мікророзмітки - site-a.com"
- "Аудит - Технічний - site-a.com"

---

### 10.4. Database & API

```typescript
interface Document {
  googleDriveId: string;
  projectId: string;
  title: string;
  type: 'report' | 'audit' | 'tz' | 'keywords';
}
```

**API Endpoints:**
- `GET /api/projects/:projectId/documents`
- `POST /api/projects/:projectId/documents`
- `DELETE /api/projects/:projectId/documents/:id`

---

## 11. Економіка проекту

### 10.1. Витрати платформи (ваші)

**Infrastructure:**
```
Vercel (Frontend): $0-20/міс
Railway (Backend): $5-50/міс
Supabase (DB): $0-25/міс
Upstash (Redis): $0-10/міс
Domain + SSL: $20/рік

РАЗОМ: ~$10-105/міс + $20/рік
```

**Витрати на API:** $0 (користувачі підключають свої)

**Break-even:** 1-3 платні користувачі

### 10.2. Pricing для користувачів

**Free Plan** ($0/міс)
```
- 1 проект
- 1 користувач
- Базовий дашборд
- GSC + GA4 інтеграція
- Google Docs/Sheets експорт
- Щотижневі автоматичні звіти
- Community support
```

**Pro Plan** ($49/міс)
```
- 10 проектів
- 3 користувачі
- Все з Free
- Щоденні алерти (Telegram/Email)
- Автоматичні звіти (Google Docs)
- Scheduled Tasks (відкладені AI задачі)
- Serpstat інтеграція (потрібен свій ключ)
- Priority support
```

**Agency Plan** ($149/міс)
```
- 50 проектів
- 10 користувачів
- Все з Pro
- Ahrefs інтеграція (потрібен свій ключ)
- White-label звіти
- Advanced Scheduled Tasks (recurring)
- API access
- Dedicated support
```

**Enterprise Plan** ($499/міс)
```
- Unlimited проекти
- Unlimited користувачі
- Все з Agency
- Custom інтеграції
- SLA 99.9%
- Personal account manager
- Custom deployment (опціонально)
- On-premise option
```

**Важливо:** Ми НЕ обмежуємо AI usage! Користувач підключає власний Claude API ключ і сам контролює витрати. Ми беремо гроші за кількість проектів, team features та advanced функціонал.

### 10.3. Прогноз revenue

**Сценарій 1: Консервативний**
```
Місяць 3:
- 5 Free users
- 3 Pro users × $49 = $147
- 0 Agency users
Revenue: $147/міс
Costs: ~$50/міс
Profit: $97/міс

Місяць 6:
- 20 Free users
- 15 Pro users × $49 = $735
- 3 Agency users × $149 = $447
Revenue: $1,182/міс
Costs: ~$100/міс
Profit: $1,082/міс

Рік 1:
- 50 Free users
- 50 Pro users × $49 = $2,450
- 15 Agency users × $149 = $2,235
Revenue: $4,685/міс
Costs: ~$200/міс
Profit: $4,485/міс ($53,820/рік)
```

**Сценарій 2: Оптимістичний**
```
Рік 1:
- 200 Free users
- 150 Pro users × $49 = $7,350
- 40 Agency users × $149 = $5,960
- 5 Enterprise × $499 = $2,495
Revenue: $15,805/міс
Costs: ~$500/міс
Profit: $15,305/міс ($183,660/рік)
```

### 10.4. Customer Acquisition Cost (CAC)

**Канали:**
- Content Marketing (SEO блог) — $0-500/міс
- Google Ads — $1,000-3,000/міс
- LinkedIn Ads — $500-1,500/міс
- SEO Communities (Reddit, Facebook) — $0

**CAC:** ~$50-150 per customer

**LTV (Lifetime Value):**
- Pro user: $49 × 12 міс = $588/рік
- Agency user: $149 × 12 міс = $1,788/рік

**LTV/CAC ratio:** 4-12x (дуже добре)

---

## 12. Roadmap розробки

### 11.1. Phase 1: MVP (Місяці 1-3)

**Тиждень 1-2: Foundation**
- [ ] Next.js setup + UI компоненти (shadcn/ui)
- [ ] NestJS API + Database (Prisma)
- [ ] Authentication (NextAuth + JWT)
- [ ] Multi-tenancy setup (Organizations)

**Тиждень 3-4: Core Integrations**
- [ ] Google OAuth setup
- [ ] Google Search Console API
- [ ] Google Analytics GA4 API
- [ ] PageSpeed Insights API

**Тиждень 5-6: Data Collection**
- [ ] Cron jobs для щоденного збору даних
- [ ] DataSnapshot model + storage
- [ ] Dashboard з графіками (Recharts)

**Тиждень 7-8: AI Integration**
- [ ] Claude API integration
- [ ] AI Analysis Service
- [ ] Morning Brief генерація
- [ ] Автогенерація задач

**Тиждень 9-10: Crawler**
- [ ] Crawlee + Playwright setup
- [ ] Audit Service
- [ ] Background jobs queue (BullMQ)
- [ ] Збереження результатів аудиту

**Тиждень 11-12: Polish & Testing**
- [ ] Task Manager UI
- [ ] Telegram notifications
- [ ] Bug fixes
- [ ] Beta testing з 3-5 користувачами

**Результат Phase 1:**
Робоча платформа з базовим функціоналом:
- Google APIs підключені
- AI аналіз працює
- Краулер робить аудити
- Користувачі можуть створювати проекти та задачі

### 11.2. Phase 2: Automation & Reports (Місяці 4-6)

**Місяць 4:**
- [ ] Google Docs API integration
- [ ] Google Sheets API integration
- [ ] Автоматична генерація звітів
- [ ] Експорт задач у Sheets
- [ ] **Scheduled Tasks (базова версія)**
  - [ ] UI для створення відкладених задач
  - [ ] Cron job для перевірки scheduled tasks
  - [ ] Один тип задачі (semantic research)
  - [ ] Telegram notification після виконання

**Місяць 5:**
- [ ] Serpstat API integration (опціонально)
- [ ] Семантичне ядро (keyword research)
- [ ] Competitor analysis
- [ ] AI Chat Assistant (повноцінний)
- [ ] **Scheduled Tasks (розширена версія)**
  - [ ] Всі типи задач (аудит, конкуренти, звіти)
  - [ ] AI створення задач через чат
  - [ ] Templates для швидких дій

**Місяць 6:**
- [ ] Email notifications (SendGrid)
- [ ] Advanced filtering & sorting
- [ ] Історія змін (audit trail)
- [ ] Performance optimization
- [ ] **Recurring Scheduled Tasks**
  - [ ] Періодичні задачі (cron expressions)
  - [ ] AI оптимізація часу виконання
  - [ ] Queue management

**Результат Phase 2:**
Повноцінна платформа з автоматизацією:
- Звіти генеруються автоматично
- Експорт у Google Docs/Sheets
- Розширені інтеграції
- **AI може виконувати задачі по розкладу без участі користувача**

### 11.3. Phase 3: Team & Scaling (Місяці 7-12)

**Місяць 7-8:**
- [ ] Розширені ролі та права доступу
- [ ] Team collaboration features
- [ ] Comments Ñ– discussions
- [ ] Activity feed

**Місяць 9-10:**
- [ ] White-label звіти (брендування)
- [ ] API для партнерів
- [ ] Webhooks
- [ ] Ahrefs API integration (Enterprise план)

**Місяць 11-12:**
- [ ] Google Slides integration (презентації)
- [ ] Custom dashboards (конструктор)
- [ ] Advanced AI features (стратегії, прогнози)
- [ ] Mobile app (PWA) optimization

**Результат Phase 3:**
Enterprise-ready платформа:
- Підходить для великих агентств
- Повна кастомізація
- API для інтеграцій

---

## 13. Deployment стратегія

### 12.1. Development Environment

**Local Development:**
```bash
# Frontend (Next.js)
cd apps/web
npm run dev
# http://localhost:3000

# Backend (NestJS)
cd apps/api
npm run start:dev
# http://localhost:4000

# Database
docker-compose up postgres redis
```

**Tech Stack:**
```
Node.js: 20.x LTS
pnpm: 8.x (package manager)
PostgreSQL: 15.x
Redis: 7.x
```

### 12.2. Staging Environment

**Platform:** Railway або Render

**Setup:**
```
Frontend: Vercel Preview Deploys (автоматично з PR)
Backend: Railway staging environment
Database: Supabase staging project
```

**URL:** `staging.seoplatform.com`

**Використання:**
- Тестування нових фіч
- QA testing
- Beta users

### 12.3. Production Environment

**Frontend Deployment (Vercel):**
```bash
# Automatic deployment on push to main
git push origin main

# Vercel автоматично:
1. Build Next.js app
2. Deploy to edge network
3. SSL certificate
4. Custom domain setup

URL: app.seoplatform.com
```

**Backend Deployment (Railway):**
```bash
# Connected to GitHub repo
git push origin main

# Railway автоматично:
1. Build Docker image
2. Run migrations
3. Deploy to cloud
4. Health checks

URL: api.seoplatform.com
```

**Database (Supabase):**
```
Production PostgreSQL
├── Automatic backups (daily)
├── Point-in-time recovery
├── Connection pooling (PgBouncer)
└── Read replicas (Phase 3)
```

**Redis (Upstash):**
```
Serverless Redis
├── Global replication
├── High availability
└── Automatic scaling
```

### 12.4. CI/CD Pipeline

**GitHub Actions:**
```yaml
# .github/workflows/deploy.yml

name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - Checkout code
      - Run tests
      - Run linting
      
  deploy-frontend:
    needs: test
    steps:
      - Vercel deployment (automatic)
      
  deploy-backend:
    needs: test
    steps:
      - Railway deployment (automatic)
```

### 12.5. Monitoring & Logging

**Application Monitoring:**
- Vercel Analytics (frontend performance)
- Sentry (error tracking)
- LogTail / Better Stack (logs)

**Infrastructure Monitoring:**
- Railway metrics (CPU, Memory, Network)
- Supabase metrics (DB performance)
- Upstash metrics (Redis usage)

**Alerts:**
- Email/Slack при errors >10/хв
- SMS при downtime >5 хв
- Telegram при critical errors

### 12.6. Backup Strategy

**Database Backups:**
```
Daily: Full backup (автоматично Supabase)
Weekly: Download backup to S3
Monthly: Archive backup
Retention: 90 днів
```

**Code Backups:**
```
GitHub: Primary repository
GitLab: Mirror (automated)
```

**Disaster Recovery:**
- RTO (Recovery Time Objective): <4 години
- RPO (Recovery Point Objective): <24 години

---

## Додатки

### Додаток A: Посилання на документацію

**APIs:**
- Google Search Console: https://developers.google.com/webmaster-tools
- Google Analytics: https://developers.google.com/analytics/devguides/reporting/data/v1
- Google Docs: https://developers.google.com/docs/api
- Google Sheets: https://developers.google.com/sheets/api
- Anthropic Claude: https://docs.anthropic.com/claude/reference
- Serpstat: https://serpstat.com/api/
- Ahrefs: https://ahrefs.com/api

**Frameworks:**
- Next.js: https://nextjs.org/docs
- NestJS: https://docs.nestjs.com
- Prisma: https://www.prisma.io/docs
- Crawlee: https://crawlee.dev/docs

**Infrastructure:**
- Vercel: https://vercel.com/docs
- Railway: https://docs.railway.app
- Supabase: https://supabase.com/docs

### Додаток B: Глосарій

**BYOK** — Bring Your Own Keys (модель де користувач підключає свої API)

**GSC** — Google Search Console

**GA4** — Google Analytics 4

**CWV** — Core Web Vitals (LCP, FID, CLS)

**RLS** — Row Level Security (безпека на рівні рядків БД)

**Multi-tenancy** — Архітектура де одна база даних обслуговує багато організацій

**JWT** — JSON Web Token (токен авторизації)

**Cron** — Заплановані задачі (наприклад, щоденний збір даних)

**Queue** — Черга задач для фонової обробки

**Crawler** — Програма що обходить сайт та збирає дані

### Додаток C: FAQ

**Q: Чому веб, а не десктоп?**
A: Веб простіше розробляти, легше оновлювати, працює на всіх пристроях, краще для командної роботи. Десктоп мав би сенс тільки для дуже потужного краулінгу (мільйони сторінок), але наш краулінг на серверах навіть краще.

**Q: Чому BYOK модель, а не надавати API самим?**
A: Нульові витрати на API з нашого боку, користувач контролює свої ліміти, масштабується безкоштовно.

**Q: Скільки коштує запустити MVP?**
A: ~$10-100/міс на infrastructure. Break-even при 1-3 платних користувачах.

**Q: Скільки часу на розробку MVP?**
A: 2-3 місяці при 1 full-time розробнику або 1-1.5 місяці при команді з 2 розробників.

**Q: Які головні ризики?**
A: 
1. Якість AI-рекомендацій (треба тестувати промпти)
2. Вартість Claude API (але користувач платить)
3. Обмеження сторонніх API (rate limits)
4. Конкуренція (але УТП сильне)

**Q: Як монетизувати?**
A: SaaS підписка ($49-499/міс залежно від плану). LTV/CAC ratio дуже хороший (4-12x).

---

## Підсумок

### Ключові рішення:
1. ✅ **Web application** (НЕ desktop)
2. ✅ **BYOK модель** (користувачі підключають свої API)
3. ✅ **AI як центральний мозок** (не додаток)
4. ✅ **Multi-tenancy** (Organization-based)
5. ✅ **Свій task manager** (заміна Jira/Trello)

### Технології:
- Frontend: **Next.js 14** + shadcn/ui + Tailwind
- Backend: **NestJS** + Prisma + BullMQ
- Database: **PostgreSQL** (Supabase) + Redis
- AI: **Claude API** (Anthropic)
- Crawler: **Crawlee** + Playwright
- Deploy: **Vercel** + Railway

### Timeline:
- MVP: **2-3 місяці**
- Phase 2: **+3 місяці**
- Phase 3: **+6 місяців**

### Вартість запуску:
- Infrastructure: **~$10-100/міс**
- API витрати: **$0** (користувачі платять)
- Break-even: **1-3 платні користувачі**

### Прогноз:
- Рік 1: **$50K-180K revenue** (консервативний-оптимістичний)
- LTV/CAC: **4-12x** (відмінний показник)

---

**Версія документа:** 1.0  
**Остання зміна:** 01.11.2025  
**Автор:** SEO AI Platform Team  
**Статус:** ✅ Затверджено для старту розробки