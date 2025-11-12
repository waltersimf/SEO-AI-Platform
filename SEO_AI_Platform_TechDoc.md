# SEO AI Platform - Технічна документація

**Версія:** 1.4  
**Дата:** 07 листопада 2025  
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


### 5.8. Module: Messaging System + AI Teammate

**Концепція:**
Повноцінний team messenger з унікальною фішкою — AI як член команди, що бере участь в обговореннях.

**🔥 Killer Feature:** AI Teammate — перше в SEO індустрії рішення де AI природньо інтегрований в командні обговорення через @mention.

---

#### 5.8.1. Chat Types

```
MVP Types:
├─ Direct (1-on-1)
│   └─ Приватні розмови між користувачами
│
├─ Group
│   └─ Командні обговорення (користувачі створюють самі)
│
└─ AI Assistant (special)
    └─ Окремий чат тільки з AI
```

**AI Integration:**
- **MVP:** Окремий AI чат + AI в групових чатах через @mention
- **Phase 2:** AI auto-analysis (опціонально)

---

#### 5.8.2. AI Integration — Killer Feature!

**Як працює AI Teammate:**

**Сценарій 1: Окремий AI чат**
```
User обирає "🤖 AI Assistant" в списку:
├─ Пише питання
├─ AI відповідає з контекстом всіх проектів
├─ Історія зберігається
└─ Як особистий SEO консультант 24/7
```

**Сценарій 2: AI в групових чатах (@mention)** 🚀

```
Команда обговорює проблему:

Ivan: "У нас впав трафік на 20%"
Anna: "Я бачила в GSC багато помилок"
Ivan: "@AI що ти думаєш про це?"

🤖 AI: "Проаналізував дані site-a.com за тиждень.
      Бачу 3 причини падіння:
      
      1. 15 нових 404 помилок (з 15.10)
      2. Core Update від Google (14.10)
      3. Competitor запустив 8 нових статей
      
      📊 Metrics:
      • Clicks: 450 → 350 (-22%)
      • Impressions: -15%
      
      ✅ Рекомендації:
      1. Виправити 404 (список в задачах)
      2. Перевірити якість контенту
      3. Competitor analysis
      
      Створити задачі?"
```

**Use Cases:**
- 🔍 **Фактчек:** "@AI перевір реальні цифри"
- 📊 **Аналіз:** "@AI що впливає на LCP?"
- 🔎 **Пошук:** "@AI що ми вирішили про redirects?"
- 💡 **Рекомендації:** "@AI що порадиш?"
- 📝 **Створення контенту:** "@AI створи ТЗ на 404"

**Чому це унікально:**

| Конкурент | Team Chat | AI Integration |
|-----------|-----------|----------------|
| Ahrefs | ❌ | AI окремо |
| Semrush | ❌ | AI окремо |
| Screaming Frog | ❌ | No AI |
| **SEO AI Platform** | ✅ | ✅ AI Teammate! 🏆 |

---

#### 5.8.3. Database Schema

```prisma
model User {
  id             String   @id @default(cuid())
  email          String   @unique
  name           String
  avatar         String?
  
  // AI flag
  isAI           Boolean  @default(false)
  aiModel        String?  // "claude-sonnet-4"
  
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  role           String
  
  // Messaging
  sentMessages   Message[] @relation("sender")
  chatMembers    ChatMember[]
  
  // Status
  isOnline       Boolean   @default(false)
  lastSeenAt     DateTime?
  
  createdAt      DateTime @default(now())
}

model Chat {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  type           String   // "direct" | "group" | "ai"
  name           String?
  avatar         String?
  
  projectId      String?
  project        Project? @relation(fields: [projectId], references: [id])
  
  members        ChatMember[]
  messages       Message[]
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([organizationId])
  @@index([projectId])
}

model ChatMember {
  id       String @id @default(cuid())
  chatId   String
  chat     Chat   @relation(fields: [chatId], references: [id], onDelete: Cascade)
  userId   String
  user     User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  lastReadAt DateTime?
  isMuted    Boolean @default(false)
  
  joinedAt   DateTime @default(now())
  
  @@unique([chatId, userId])
  @@index([userId])
  @@index([chatId])
}

model Message {
  id       String   @id @default(cuid())
  chatId   String
  chat     Chat     @relation(fields: [chatId], references: [id], onDelete: Cascade)
  
  senderId String
  sender   User     @relation("sender", fields: [senderId], references: [id])
  
  content  String   @db.Text
  type     String   @default("text")
  
  attachments Json?
  
  // AI specific
  isAIResponse Boolean @default(false)
  aiContext    Json?
  aiModel      String?
  
  mentions     String[]
  
  isEdited     Boolean  @default(false)
  editedAt     DateTime?
  
  createdAt    DateTime @default(now())
  
  @@index([chatId, createdAt])
  @@index([senderId])
}
```

---

#### 5.8.4. Real-time (WebSockets)

**Tech Stack:**
- Backend: Socket.io (NestJS)
- Frontend: Socket.io client
- Redis: Online presence

**Key Events:**

```typescript
// Connect
socket.on('join_organization', async (orgId) => {
  socket.join(`org:${orgId}`);
  await updateUserStatus(userId, true);
});

// Send message
socket.on('send_message', async (data) => {
  const message = await saveMessage(data);
  socket.to(`chat:${data.chatId}`).emit('new_message', message);
  
  // Check @AI
  if (data.content.includes('@AI')) {
    await handleAIResponse(data.chatId, message);
  }
});

// Typing
socket.on('typing', (chatId) => {
  socket.to(`chat:${chatId}`).emit('user_typing', { userId, chatId });
});
```

**AI Handler:**

```typescript
async function handleAIResponse(chatId, message) {
  socket.to(`chat:${chatId}`).emit('ai_typing');
  
  const history = await getRecentMessages(chatId, 50);
  const context = await buildAIContext(chatId);
  
  const response = await claude.messages.create({
    model: "claude-sonnet-4-20250514",
    messages: [
      { role: "system", content: context },
      ...history.map(m => ({
        role: m.isAIResponse ? "assistant" : "user",
        content: `${m.sender.name}: ${m.content}`
      }))
    ]
  });
  
  const aiMessage = await saveMessage({
    chatId,
    senderId: "ai-assistant-id",
    content: response.content[0].text,
    isAIResponse: true
  });
  
  socket.to(`chat:${chatId}`).emit('new_message', aiMessage);
}
```

---

#### 5.8.5. AI Context

```typescript
async function buildAIContext(chatId) {
  const chat = await getChat(chatId);
  const projects = await getUserProjects();
  
  let projectContext = '';
  if (chat.projectId) {
    const project = await getProject(chat.projectId);
    const data = await getLatestDataSnapshot(project.id);
    
    projectContext = `
      Project: ${project.domain}
      Traffic: ${data.gscMetrics.clicks} clicks
      Tasks: ${await getActiveTasks(project.id).length}
    `;
  }
  
  return `
    AI SEO Expert in team chat.
    
    User: ${user.name} (${user.role})
    Organization: ${org.name}
    Projects: ${projects.length}
    ${projectContext}
    
    Instructions:
    - Analyze data when asked
    - Give actionable recommendations
    - Offer to create tasks
    - Be concise but thorough
    - Respond only on @mention
  `;
}
```

---

#### 5.8.6. Features

**MVP:**
```
✅ 1-on-1 chats
✅ Group chats
✅ AI Assistant (окремий + @mention в групах)
✅ Real-time (WebSocket)
✅ Full history
✅ Online status
✅ Typing indicators
✅ Text + images + files
```

**Phase 2:**
```
✅ Reactions (emoji)
✅ Reply threads
✅ Message search
✅ Rich text / markdown
✅ Voice messages
```

---

#### 5.8.7. Витрати (BYOK)

```
AI response cost:
├─ Input: ~2,500 tokens = $0.0075
├─ Output: ~500 tokens = $0.0075
└─ Total: ~$0.015 per response

Monthly (20 queries/day):
└─ ~$9/міс (acceptable!)
```

---

#### 5.8.8. Відповідальність

```
Terms: "We integrate third-party AI using your 
API credentials. Not responsible for AI accuracy. 
Always verify important decisions."
```

Standard: Cursor, GitHub Copilot, Notion AI.

---

#### 5.8.9. Marketing

**Tagline:** "Your AI Teammate, Always in Context"

**Demo:** Team discussing → @AI → instant analysis → wow!

---

### 5.9. Module: Notifications System

**Концепція:**
In-app notifications з floating button та sidebar panel (як в CK3). Всі нотіфікації спливають, групуються, інтерактивні.

**🎯 Focus:** Тільки in-app для MVP (Telegram/Email - Phase 2)

---

#### 5.9.1. Architecture

**Концепція:** Floating stack нотіфікацій справа (як в Crusader Kings 3)

**НЕ floating button! НЕ sidebar panel!**

```
Components:
├─ Notification Stack (floating, bottom-right)
│   ├─ Нотіфікації з'являються знизу
│   ├─ Нова нотіфікація = розгорнута
│   ├─ Попередні згортаються до заголовка
│   ├─ Утворюється вертикальний стек
│   └─ Клік на згорнуту → розгортається
│
└─ (Опціонально) Popup Toast (top-right)
    ├─ Дублює критичні нотіфікації
    ├─ Auto-dismiss через 5-10 сек
    └─ Sound effects
```

**Відмінність від старої концепції:**
- ❌ Було: Floating button + Sidebar panel
- ✅ Тепер: Floating stack (як в CK3)

**Переваги:**
- Простіше UX (не треба клікати на button)
- Нотіфікації одразу видно
- Історія завжди на екрані (згорнута)
- Як в знайомих іграх (CK3, Europa Universalis)

---

#### 5.9.2. Floating Stack Behavior

**Position:** Fixed, bottom-right corner

```css
.notification-stack {
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 350px;
  max-height: 80vh;
  z-index: 1000;
  display: flex;
  flex-direction: column-reverse; /* Нові знизу */
  gap: 8px;
}
```

**Як з'являються нотіфікації:**

**1. Перша нотіфікація (розгорнута):**
```
                              ┌─────────────────────┐
                              │ 🔴 site-a.com       │
                              │ Traffic -35%!       │
                              │                     │
                              │ Clicks: 450 → 290   │
                              │ Impressions: -15%   │
                              │                     │
                              │ [View] [Fix] [×]    │
                              └─────────────────────┘
```

**2. Друга нотіфікація → перша згортається:**
```
                              ┌─────────────────────┐
                              │ 🔴 site-a.com...    │ ← Згорнута (header only)
                              ├─────────────────────┤
                              │ ⚠️ 404 errors!      │ ← Нова (розгорнута)
                              │                     │
                              │ 15 pages with 404   │
                              │ • /old-page-1       │
                              │ • /old-page-2       │
                              │                     │
                              │ [View] [Fix] [×]    │
                              └─────────────────────┘
```

**3. Третя → утворюється стек:**
```
                              ┌─────────────────────┐
                              │ 🔴 site-a.com...    │ ← Згорнута
                              ├─────────────────────┤
                              │ ⚠️ 404 errors...    │ ← Згорнута
                              ├─────────────────────┤
                              │ 🟡 PageSpeed bad    │ ← Нова (розгорнута)
                              │                     │
                              │ Mobile: 78 → 45     │
                              │ LCP: 4.2s ❌        │
                              │                     │
                              │ [View] [Test] [×]   │
                              └─────────────────────┘
```

**4. Клік на згорнуту → розгортається:**
```
                              ┌─────────────────────┐
                              │ 🔴 site-a.com       │ ← РОЗГОРНУТА
                              │ Traffic -35%!       │
                              │                     │
                              │ Clicks: 450 → 290   │
                              │ [View] [Fix] [×]    │
                              ├─────────────────────┤
                              │ ⚠️ 404 errors...    │ ← Згорнута
                              ├─────────────────────┤
                              │ 🟡 PageSpeed...     │ ← Згорнута
                              └─────────────────────┘
```

**States:**

```typescript
interface NotificationState {
  id: string;
  isExpanded: boolean; // Тільки одна = true (найнова)
  isRead: boolean;
  isDismissed: boolean;
}

// Logic:
// - Нова нотіфікація: isExpanded = true
// - Всі інші: isExpanded = false
// - Клік на згорнуту: expand цю, collapse інші
```

**Max visible:** 5-7 нотіфікацій одночасно

**Overflow:** Scroll всередині stack (якщо >7)

---

#### 5.9.3. Notification Card Structure

**Згорнута (collapsed):**
```
┌─────────────────────────────────┐
│ 🔴 site-a.com traffic -35%      │ ← Header (клікабельний)
└─────────────────────────────────┘
```

**CSS для згорнутої:**
```css
.notification-collapsed {
  padding: 12px 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  background: white;
  transition: all 0.2s;
}

.notification-collapsed:hover {
  border-color: #3b82f6;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.1);
}
```

---

**Розгорнута (expanded):**
```
┌─────────────────────────────────┐
│ 🔴 site-a.com traffic -35%      │ ← Header
├─────────────────────────────────┤
│                                 │ ← Body
│ Critical drop detected!         │
│                                 │
│ 📊 Metrics:                     │
│ • Clicks: 450 → 290 (-160)      │
│ • Impressions: 12K → 11K        │
│ • CTR: 3.75% → 2.64%            │
│                                 │
│ 🤖 AI Analysis:                 │
│ Likely causes:                  │
│ • Google Core Update (Oct 15)   │
│ • Competitor activity           │
│                                 │
├─────────────────────────────────┤
│ [View Dashboard] [Create Tasks] │ ← Footer (actions)
│ [Ask AI] [×]                    │
└─────────────────────────────────┘
```

**CSS для розгорнутої:**
```css
.notification-expanded {
  padding: 16px;
  border: 2px solid #ef4444; /* Колір залежить від типу */
  border-radius: 12px;
  background: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

---

**Component Structure:**

```tsx
// components/NotificationStack.tsx
export function NotificationStack() {
  const { notifications } = useNotifications();
  
  return (
    
      {notifications.map((notif, index) => {
        const isLatest = index === 0; // Найнова знизу
        
        return (
          <NotificationCard
            key={notif.id}
            notification={notif}
            isExpanded={isLatest}
            onClick={() => expandNotification(notif.id)}
          />
        );
      })}
    
  );
}

// components/NotificationCard.tsx
interface Props {
  notification: Notification;
  isExpanded: boolean;
  onClick: () => void;
}

export function NotificationCard({ 
  notification, 
  isExpanded, 
  onClick 
}: Props) {
  if (!isExpanded) {
    return (
      
        {notification.icon} {notification.title}
      
    );
  }
  
  return (
    
      {/* Header */}
      
        {notification.icon} {notification.title}
      
      
      {/* Body */}
      
        {notification.content}
        {notification.metadata && (
          
        )}
      
      
      {/* Footer */}
      
        {notification.actions.map(action => (
          
            {action.label}
          
        ))}
        
          ×
        
      
    
  );
}
```

---

**Animation при появі:**

```typescript
// Нова нотіфікація
function showNotification(notification: Notification) {
  // 1. Додати в стек (знизу)
  addToStack(notification);
  
  // 2. Згорнути всі інші
  collapseAll();
  
  // 3. Розгорнути нову (з анімацією)
  expandWithAnimation(notification.id);
  
  // 4. Sound effect (якщо enabled)
  playSound(notification.type);
  
  // 5. Auto-dismiss (для success/info)
  if (notification.type === 'success') {
    setTimeout(() => dismiss(notification.id), 10000);
  }
}
```

---

**Детальний опис UI дивись в розділі 9.5 (UI/UX концепція)**

---

#### 5.9.4. Auto-Grouping

```typescript
interface NotificationGroup {
  type: 'critical' | 'message' | 'task' | 'success';
  title: string;
  icon: string;
  count: number;
  isCollapsed: boolean;
  notifications: Notification[];
}

// Grouping logic:
├─ By type (critical/message/task/success)
├─ By project (в межах типу)
├─ Auto-collapse якщо >5 items
└─ Critical завжди зверху
```

---

#### 5.9.5. Expandable Details

**Collapsed:**
```
📉 site-a.com traffic -35%
3 хв тому
[▼ Show details]
```

**Expanded:**
```
📉 site-a.com traffic -35%
3 хв тому
[▲ Hide details]

━━━━━━━━━━━━━━━━━
📊 Metrics:
• Clicks: 450 → 290 (-160)
• Impressions: 12K → 11K
• CTR: 3.75% → 2.64%

🤖 AI Analysis:
• Core Update (15.10)
• 23 нові 404
• Competitor activity ↑

✅ Actions:
1. Fix 404 errors
2. Check content
3. Monitor 7 days

[Create tasks] [View report]
━━━━━━━━━━━━━━━━━
```

---

#### 5.9.6. Popup Toasts

**Position:** Top-right (не блокує floating button)

**ВСІ типи спливають:**

```
Critical (червоний):
┌──────────────────┐
│ 🔴 site-a.com    │
│ Traffic -35%     │
│ [View] [Dismiss] │
└──────────────────┘

Message (@mention):
┌──────────────────┐
│ 💬 @Ivan         │
│ "Треба виправ.." │
│ [Reply] [Dismiss]│
└──────────────────┘

Task:
┌──────────────────┐
│ ✅ New task      │
│ Fix 404 errors   │
│ [Accept] [View]  │
└──────────────────┘

Success:
┌──────────────────┐
│ 🎉 site-d.com    │
│ Traffic +25%     │
│ [View] [Dismiss] │
└──────────────────┘
```

**Multiple popups stack vertically:**
```
          ┌──────────┐
          │ Popup 1  │
          └──────────┘
          ┌──────────┐
          │ Popup 2  │
          └──────────┘
          ┌──────────┐
          │ Popup 3  │
          └──────────┘
            (max 3)
```

---

#### 5.9.7. Sound System

```typescript
const sounds = {
  critical: {
    file: '/sounds/alert-critical.mp3',
    volume: 1.0
  },
  message: {
    file: '/sounds/message.mp3',
    volume: 0.7
  },
  mention: {
    file: '/sounds/mention.mp3',
    volume: 0.8
  },
  task: {
    file: '/sounds/task.mp3',
    volume: 0.6
  },
  success: {
    file: '/sounds/success.mp3',
    volume: 0.7
  }
};

function playSound(type: string) {
  if (!settings.enableSounds) return;
  
  const sound = sounds[type];
  const audio = new Audio(sound.file);
  audio.volume = sound.volume * settings.soundVolume;
  audio.play();
}
```

**Settings:**
```
☑️ Enable sounds
Volume: [▓▓▓▓▓▓▓▓░░] 80%

Preview:
🔴 Critical  [▶️ Play]
💬 Message   [▶️ Play]
✅ Task      [▶️ Play]
🎉 Success   [▶️ Play]
```

---

#### 5.9.8. Notification Types

**Всі типи що спливають:**

```typescript
// Critical (🔴 червоний + гучний)
├─ traffic_drop_critical     // -30%+
├─ indexing_errors_massive   // 50+ errors
├─ site_down                 // 500 errors
└─ cwv_critical              // всі червоні

// Important (🟡 помаранчевий + середній)
├─ traffic_drop_warning      // -15%
├─ position_drop_major       // top 3 → 10+
├─ new_404_errors           // 10+
└─ task_overdue             // прострочена

// Messages (💬 синій + м'який)
├─ direct_message           // 1-on-1
├─ group_message            // в групі
├─ mention                  // @user
└─ ai_response              // @AI відповів

// Tasks (✅ жовтий + нейтральний)
├─ task_assigned            // нова
├─ task_due_soon           // 24 год
├─ task_accepted           // прийнята
├─ task_declined           // відхилена
└─ task_commented          // коментар

// Success (🎉 зелений + позитивний)
├─ traffic_increase        // +20%
├─ audit_completed         // краулінг готовий
├─ scheduled_task_done     // відкладена виконана
└─ report_generated        // звіт готовий
```

---

#### 5.9.9. Database Schema

```prisma
model Notification {
  id       String   @id @default(cuid())
  userId   String
  user     User     @relation(fields: [userId], references: [id])
  
  // Type
  type     String   // "critical" | "important" | "message" | "task" | "success"
  category String   // "traffic_drop_critical" | "mention" | etc
  
  // Display
  title    String
  message  String   @db.Text
  icon     String   // emoji
  color    String   // hex
  
  // Rich content
  metadata Json?    // metrics, analysis, recommendations
  
  // Actions
  actions  Json?    // [{ label, url, action }]
  
  // Related
  projectId String?
  chatId    String?
  taskId    String?
  
  // State
  isRead      Boolean  @default(false)
  isDismissed Boolean  @default(false)
  wasShownInPopup Boolean @default(false)
  
  readAt      DateTime?
  dismissedAt DateTime?
  
  // Grouping
  groupKey String?   // "site-a.com-traffic"
  
  createdAt DateTime @default(now())
  
  @@index([userId, isRead, createdAt])
  @@index([type, category])
}

model NotificationSettings {
  id     String @id @default(cuid())
  userId String @unique
  
  // Sounds
  enableSounds Boolean @default(true)
  soundVolume  Float   @default(0.8)
  
  // Popups
  enablePopups    Boolean @default(true)
  popupDuration   Int     @default(10)  // seconds
  maxPopups       Int     @default(3)
  
  // Grouping
  autoCollapse    Boolean @default(true)
  collapseAfter   Int     @default(5)
  
  // Archive
  autoArchiveDays Int     @default(30)
  
  // Mobile
  enableVibration Boolean @default(true)
  
  updatedAt DateTime @updatedAt
}
```

---

#### 5.9.10. WebSocket Integration

```typescript
// Backend → Frontend
socket.on('notification', (notification) => {
  // 1. Add to state
  addNotification(notification);
  
  // 2. Update badge
  incrementUnreadCount();
  
  // 3. Show popup (для ВСІХ типів)
  showPopup(notification);
  
  // 4. Play sound
  playNotificationSound(notification.category);
  
  // 5. Vibrate (mobile)
  if (isMobile && settings.enableVibration) {
    navigator.vibrate([200, 100, 200]);
  }
});
```

---

#### 5.9.11. Interactive Actions

**Приклади:**

```
Task assigned:
├─ [Accept] → status = "accepted"
├─ [Decline] → show reason form
└─ [View] → open task

Traffic drop:
├─ [View dashboard] → redirect
├─ [Create tasks] → task creator
└─ [Dismiss] → mark read

@mention:
├─ [Reply] → open chat + pre-fill
├─ [Open chat] → jump to message
└─ [×] → dismiss

AI responded:
├─ [View answer] → open chat
├─ [Ask follow-up] → reply field
└─ [×] → dismiss
```

---

#### 5.9.12. Time Grouping

```
Today:
├─ site-a.com traffic -35% (3 хв тому)
├─ @mention from Ivan (15 хв тому)
└─ Task assigned (1 год тому)

Yesterday:
├─ Audit completed (вчора, 18:30)
└─ Report generated (вчора, 09:15)

This week:
└─ [Show 12 notifications...]

Older:
└─ [Show 48 notifications...]

Archive (auto after 30 днів):
└─ [View archive...]
```

---

#### 5.9.13. Filtering

```
Top bar:
┌─────────────────────────────┐
│ 🔔 Notifications            │
│ [All] [Unread] [Critical]   │ ← Quick filters
│ [Messages] [Tasks] [Projects]│
└─────────────────────────────┘

Клік → показує тільки цей тип
```

---

#### 5.9.14. Features Summary

**MVP (in-app only):**
```
✅ Floating button (bottom-right)
✅ Badge counter
✅ Sidebar panel (slide-in)
✅ Auto-grouping (type + project)
✅ Popups для ВСІХ типів
✅ Sound effects (optional)
✅ Expandable details
✅ Interactive actions
✅ Mark as read/dismiss
✅ Time grouping
✅ Filtering
✅ Real-time (WebSocket)
```

**Phase 2:**
```
✅ Telegram integration
✅ Email notifications
✅ Slack webhooks
✅ Advanced filtering
✅ Custom sounds
```

---

#### 5.9.15. Timeline

**1 тиждень:**

```
День 1-2: Backend
├─ Notification model
├─ Settings model
├─ WebSocket events
└─ Triggers

День 3-4: Frontend UI
├─ FloatingButton
├─ NotificationPanel
├─ Popup component
└─ Grouping logic

День 5: Sounds & animations
├─ Sound system
├─ Animations (slide/fade/shake)
└─ Button states

День 6-7: Integration
├─ Messaging → notifications
├─ Tasks → notifications
├─ Data collection → notifications
└─ Testing
```

---
### 5.10. Module: Reports & Export

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

## 6.2. Authentication Methods (OAuth vs API Keys)

### OAuth Support

**Концепція:**  
Де можливо використовуємо OAuth 2.0 для кращого UX. User бачить знайому кнопку "Connect with [Service]" замість копіювання API keys.

**Які сервіси підтримують OAuth:**

| Сервіс | OAuth Support | Authentication Method | UI Pattern |
|--------|---------------|----------------------|------------|
| **Google APIs** | ✅ YES | OAuth 2.0 | [🔵 Sign in with Google] |
| **Ahrefs** | ✅ YES | OAuth 2.0 | [🟠 Connect with Ahrefs] + fallback manual |
| **SEMrush** | ✅ YES | OAuth 2.0 (Device flow) | [🟢 Connect with SEMrush] + fallback manual |
| **Serpstat** | ❌ NO | API Token only | [Enter API Token] |
| **Claude (Anthropic)** | ❌ NO | API Key only | [Enter API Key] |
| **SendGrid** | ❌ NO | API Key only | [Enter API Key] |
| **PageSpeed Insights** | ❌ NO | API Key (public) | Auto-configured |

---

### OAuth Implementation Details

#### Google OAuth (Organization-level)

**Scopes запитуємо одночасно:**
```typescript
const scopes = [
  // Google Search Console
  'https://www.googleapis.com/auth/webmasters.readonly',
  
  // Google Analytics GA4
  'https://www.googleapis.com/auth/analytics.readonly',
  
  // Google Drive
  'https://www.googleapis.com/auth/drive.file',
  
  // Google Docs
  'https://www.googleapis.com/auth/documents',
  
  // Google Sheets
  'https://www.googleapis.com/auth/spreadsheets',
  
  // User profile
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile'
];
```

**Результат:**  
Один `access_token` працює для ВСІХ Google сервісів одночасно!

**Exceptions:**
- PageSpeed Insights не потребує OAuth (public API key)

---

#### Ahrefs OAuth

**Endpoints:**
```
Authorization: https://app.ahrefs.com/api/auth
Token Exchange: https://app.ahrefs.com/api/token
Subscription Info: https://apiv2.ahrefs.com (для usage tracking)
```

**Flow:**
```typescript
// 1. Redirect to Ahrefs
const authUrl = new URL('https://app.ahrefs.com/api/auth');
authUrl.searchParams.set('client_id', process.env.AHREFS_CLIENT_ID);
authUrl.searchParams.set('redirect_uri', 'https://your-app.com/auth/ahrefs/callback');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('state', generateState());

// 2. Handle callback
const tokens = await axios.post('https://app.ahrefs.com/api/token', {
  code: req.query.code,
  client_id: process.env.AHREFS_CLIENT_ID,
  client_secret: process.env.AHREFS_CLIENT_SECRET,
  grant_type: 'authorization_code',
  redirect_uri: 'https://your-app.com/auth/ahrefs/callback'
});

// Response:
{
  access_token: "...",
  refresh_token: "...",
  expires_in: 3600
}
```

**Setup Required:**
1. Contact Ahrefs Developer Relations
2. Register OAuth Application
3. Get Client ID + Secret
4. Set redirect URI

---

#### SEMrush OAuth

**Flow:** Device Authorization Grant (рекомендовано SEMrush)

**Endpoints:**
```
Device Code: https://oauth.semrush.com/dag/device/code
Token: https://oauth.semrush.com/dag/device/token
```

**Flow:**
```typescript
// 1. Get device code
const deviceCode = await axios.post('https://oauth.semrush.com/dag/device/code', {
  client_id: process.env.SEMRUSH_CLIENT_ID
});

// Response:
{
  device_code: "xxx",
  user_code: "YYYY",
  verification_uri: "https://oauth.semrush.com/dag/auth/verify_code?code=ZZZ",
  expires_in: 300,
  interval: 5
}

// 2. User opens verification_uri and approves
// 3. Poll for token
const tokens = await axios.post('https://oauth.semrush.com/dag/device/token', {
  device_code: deviceCode.device_code,
  grant_type: 'urn:ietf:params:oauth:grant-type:device_code'
});

// Response:
{
  access_token: "...",
  refresh_token: "...",
  expires_in: 604800, // 7 days
  token_type: "Bearer"
}
```

**Setup Required:**
1. Contact SEMrush Tech Support
2. Request client_id + client_secret
3. Specify redirect URI

---

### UI Patterns

#### Pattern A: OAuth-First (Ahrefs, SEMrush)

```
┌──────────────────────────────────────────┐
│ Connect Ahrefs                           │
├──────────────────────────────────────────┤
│                                          │
│ Підключіть Ahrefs для:                  │
│ • Backlinks analysis                     │
│ • Domain Rating                          │
│ • Keywords research                      │
│                                          │
│ 🔒 Secure OAuth 2.0 authentication      │
│                                          │
│ [🟠 Connect with Ahrefs] ← BIG          │
│                                          │
│ ────────── або ──────────                │
│                                          │
│ Advanced: Manual API Token              │
│ [Enter token manually] ← small          │
└──────────────────────────────────────────┘
```

**Переваги OAuth:**
- ✅ Знайомий UX (як "Login with Google")
- ✅ Не треба копіювати токени
- ✅ Автоматичний refresh tokens
- ✅ Ревокація доступу через provider UI

**Fallback Manual:**
- Для advanced users
- Якщо OAuth registration ще не готова
- Для testing/development

---

#### Pattern B: API Key Only (Claude, Serpstat, SendGrid)

```
┌──────────────────────────────────────────┐
│ Anthropic Claude                         │
├──────────────────────────────────────────┤
│                                          │
│ API Key *                                │
│ ┌──────────────────────────────────────┐│
│ │ sk-ant-api03-xxxxx                   ││
│ └──────────────────────────────────────┘│
│                                          │
│ 📝 How to get API key:                  │
│ 1. Go to console.anthropic.com          │
│ 2. Settings → API Keys                  │
│ 3. Create Key → Copy here               │
│                                          │
│ 🔒 Encrypted with AES-256               │
│                                          │
│ [Test Connection] [Save]                │
└──────────────────────────────────────────┘
```

**Коли використовувати:**
- OAuth не підтримується provider'ом
- Simple API key authentication
- Public APIs (PageSpeed)

---

### Backend OAuth Handlers

```typescript
// auth/oauth.controller.ts

@Controller('auth')
export class OAuthController {
  
  // Generic OAuth initiator
  @Get(':provider/connect')
  async initiateOAuth(
    @Param('provider') provider: string,
    @Req() req
  ) {
    const state = generateRandomState();
    await this.redis.set(`oauth:${state}`, req.user.id, 'EX', 600);
    
    const config = this.getProviderConfig(provider);
    const authUrl = new URL(config.authEndpoint);
    
    authUrl.searchParams.set('client_id', config.clientId);
    authUrl.searchParams.set('redirect_uri', config.redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);
    
    if (config.scopes) {
      authUrl.searchParams.set('scope', config.scopes.join(' '));
    }
    
    return { redirectUrl: authUrl.toString() };
  }
  
  // Generic OAuth callback
  @Get(':provider/callback')
  async handleCallback(
    @Param('provider') provider: string,
    @Query('code') code: string,
    @Query('state') state: string
  ) {
    // Verify state
    const userId = await this.redis.get(`oauth:${state}`);
    if (!userId) throw new UnauthorizedException();
    
    // Exchange code for tokens
    const config = this.getProviderConfig(provider);
    const tokens = await this.exchangeCodeForTokens(provider, code, config);
    
    // Encrypt and save
    const encrypted = await this.encryption.encrypt(tokens);
    await this.saveIntegration(userId, provider, encrypted);
    
    return { success: true };
  }
  
  private getProviderConfig(provider: string) {
    const configs = {
      google: {
        authEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenEndpoint: 'https://oauth2.googleapis.com/token',
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        redirectUri: `${process.env.APP_URL}/auth/google/callback`,
        scopes: [
          'https://www.googleapis.com/auth/webmasters.readonly',
          'https://www.googleapis.com/auth/analytics.readonly',
          // ... all scopes
        ]
      },
      ahrefs: {
        authEndpoint: 'https://app.ahrefs.com/api/auth',
        tokenEndpoint: 'https://app.ahrefs.com/api/token',
        clientId: process.env.AHREFS_CLIENT_ID,
        clientSecret: process.env.AHREFS_CLIENT_SECRET,
        redirectUri: `${process.env.APP_URL}/auth/ahrefs/callback`
      },
      semrush: {
        authEndpoint: 'https://oauth.semrush.com/oauth2/authorize',
        tokenEndpoint: 'https://oauth.semrush.com/oauth2/token',
        clientId: process.env.SEMRUSH_CLIENT_ID,
        clientSecret: process.env.SEMRUSH_CLIENT_SECRET,
        redirectUri: `${process.env.APP_URL}/auth/semrush/callback`,
        scopes: ['user.id', 'domains.info', 'url.info']
      }
    };
    
    return configs[provider];
  }
}
```

---

### 6.3. Список API та їх вартість

*(Оновлено з OAuth інформацією)*

#### Обов'язкові (безкоштовні):

**1. Google Search Console API**
- Вартість: ✅ $0
- Authentication: OAuth 2.0 (organization-level)
- Ліміти: 1,200 req/хв
- Дані: Покази, кліки, CTR, помилки індексації

**2. Google Analytics Data API (GA4)**
- Вартість: ✅ $0
- Authentication: OAuth 2.0 (same token as GSC)
- Ліміти: 25,000 req/день
- Дані: Трафік, bounce rate, conversions

**3. Google Drive API**
- Вартість: ✅ $0
- Authentication: OAuth 2.0 (same token)
- Ліміти: 20,000 req/день

**4. Google Docs API**
- Вартість: ✅ $0
- Authentication: OAuth 2.0 (same token)

**5. Google Sheets API**
- Вартість: ✅ $0
- Authentication: OAuth 2.0 (same token)

**6. PageSpeed Insights API**
- Вартість: ✅ $0
- Authentication: Public API Key (no OAuth)
- Ліміти: 25,000 req/день

#### Обов'язкові (платні):

**7. Anthropic Claude API**
- Вартість: 💰 $3/1M input + $15/1M output
- Authentication: API Key (manual)
- Typical usage: $10-50/міс
- Для чого: AI аналіз, генерація звітів, чат

#### Опціональні (платні SEO tools):

**8. Ahrefs API**
- Вартість: 💰 $500-1000/міс
- Authentication: OAuth 2.0 ✅ (preferred) or API Token
- Usage tracking: через API
- Дані: Backlinks, DR, organic keywords

**9. Serpstat API**
- Вартість: 💰 $69-299/міс
- Authentication: API Token (no OAuth)
- Usage tracking: через API
- Дані: Keywords, rankings, competitors

**10. SEMrush API**
- Вартість: 💰 $200-800/міс
- Authentication: OAuth 2.0 ✅ (Device flow) or API Key
- Usage tracking: API Units
- Дані: Keywords, traffic, backlinks

#### Опціональні (notifications):

**11. SendGrid**
- Вартість: ✅ $0 для базового (100 emails/день)
- Authentication: API Key
- Для: Email notifications

---

## 6.4. Cost Tracking System

### Концепція

Показувати користувачу скільки API usage витрачено та alertи при наближенні до лімітів.

**Мета:**
- Прозорість витрат (особливо для Claude API)
- Попередження про наближення до лімітів
- Допомога в плануванні бюджету

---

### 6.4.1. Що відслідковуємо

| API | Tracking Metrics | Limits Source | Alerts |
|-----|------------------|---------------|--------|
| **Google GSC/GA4** | Requests count | Known (25K/day) | At 20K (80%) |
| **Ahrefs** | Rows used | From API response | At 80% of plan |
| **Serpstat** | Requests count | From API | At 80% |
| **SEMrush** | API Units | From API | At 80% |
| **Claude** | Tokens + Cost | Calculated | Optional budget alert |
| **SendGrid** | Emails sent | From API | At 80% |

---

### 6.4.2. UI Components

#### Variant A: Integration Card с Usage

```
┌──────────────────────────────────────────────┐
│ 🟠 Ahrefs                                    │
│ ✅ Connected                                 │
├──────────────────────────────────────────────┤
│                                              │
│ 108 / 600 credits used                       │
│ ▓▓▓░░░░░░░░░░░░░░░░░ 18%                    │
│                                              │
│ Resets: December 1, 2025                     │
│                                              │
│ ⚡ Your plan: Professional                   │
│ (detected from API)                          │
│                                              │
│ [View Details]                               │
└──────────────────────────────────────────────┘
```

#### Variant B: Claude (без лімітів, тільки cost)

```
┌──────────────────────────────────────────────┐
│ 🤖 Anthropic Claude                          │
│ ✅ Connected                                 │
├──────────────────────────────────────────────┤
│                                              │
│ 📊 November 2025:                            │
│                                              │
│ • 1,247 requests                             │
│ • 2.4M input tokens                          │
│ • 890K output tokens                         │
│                                              │
│ 💰 Estimated cost: $20.85                    │
│                                              │
│ ℹ️  Paid directly to Anthropic              │
│                                              │
│ [View Details] [Anthropic Console →]        │
└──────────────────────────────────────────────┘
```

---

### 6.4.3. Database Schema

```prisma
model ApiUsage {
  id             String   @id @default(cuid())
  organizationId String
  organization   Organization @relation(fields: [organizationId], references: [id])
  
  provider       String   // 'anthropic', 'ahrefs', 'google_gsc', etc
  
  // Metrics (JSON для гнучкості)
  metrics        Json     // { requests: 10, tokens: { input: 1000, output: 500 }, cost: 0.15 }
  
  // Time period
  period         String   // '2025-11', '2025-11-07', '2025-11-07T10'
  periodType     String   // 'month', 'day', 'hour'
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@unique([organizationId, provider, period])
  @@index([organizationId, provider, periodType])
}
```

---

### 6.4.4. Tracking Service

```typescript
@Injectable()
export class UsageTrackingService {
  
  // Track API call after execution
  async trackApiCall(params: {
    organizationId: string;
    provider: string;
    metrics: {
      requests?: number;
      tokens?: { input: number; output: number };
      rows?: number;
      units?: number;
      cost?: number;
    };
  }) {
    const { organizationId, provider, metrics } = params;
    const period = format(new Date(), 'yyyy-MM');
    
    await this.prisma.apiUsage.upsert({
      where: {
        organizationId_provider_period: {
          organizationId,
          provider,
          period
        }
      },
      update: {
        metrics: {
          // Increment values
          requests: { increment: metrics.requests || 0 },
          // ... інші поля
        }
      },
      create: {
        organizationId,
        provider,
        period,
        periodType: 'month',
        metrics
      }
    });
    
    // Check limits and send alerts
    await this.checkLimitsAndAlert(organizationId, provider);
  }
  
  // Calculate Claude cost
  calculateClaudeCost(inputTokens: number, outputTokens: number): number {
    const INPUT_COST = 3 / 1_000_000;   // $3 per 1M
    const OUTPUT_COST = 15 / 1_000_000; // $15 per 1M
    
    return (inputTokens * INPUT_COST) + (outputTokens * OUTPUT_COST);
  }
  
  // Token counting
  async countTokens(text: string): Promise {
    // Using tiktoken or similar
    const encoding = encodingForModel('claude-sonnet-4');
    const tokens = encoding.encode(text);
    return tokens.length;
  }
  
  // Check limits
  async checkLimitsAndAlert(organizationId: string, provider: string) {
    const usage = await this.getCurrentUsage(organizationId, provider);
    const limits = await this.getProviderLimits(organizationId, provider);
    
    if (!limits) return;
    
    const percentage = (usage.current / limits.max) * 100;
    
    // Alert at 80%, 90%, 95%
    if (percentage >= 80 && !usage.alerted80) {
      await this.sendUsageAlert(organizationId, provider, percentage);
      await this.markAlertSent(usage.id, '80');
    }
  }
}
```

---

### 6.4.5. Real-time Updates (WebSocket)

```typescript
// После кожного API call відправляємо update
socket.emit('usage-update', {
  provider: 'ahrefs',
  usage: {
    current: 109,
    limit: 600,
    percentage: 18.2
  }
});

socket.emit('usage-update', {
  provider: 'anthropic',
  usage: {
    requests: 1248,
    cost: 20.87
  }
});
```

Frontend автоматично оновлює progress bar! 🔄

---

### 6.4.6. Usage Details Page

```
/settings/integrations/anthropic/usage

┌────────────────────────────────────────────┐
│ Anthropic Claude - Usage Details          │
├────────────────────────────────────────────┤
│                                            │
│ 📊 Current Month (November 2025)          │
│                                            │
│ Total Requests: 1,247                      │
│ Input Tokens: 2,451,000                    │
│ Output Tokens: 891,000                     │
│ Estimated Cost: $20.85                     │
│                                            │
│ [Line Chart: Daily usage]                  │
│                                            │
│ 📅 Usage by Day:                           │
│ Nov 7  │ 150 req │ $2.50                   │
│ Nov 6  │ 120 req │ $1.80                   │
│ ...                                        │
│                                            │
│ 📤 Export: [CSV] [JSON] [PDF]             │
└────────────────────────────────────────────┘
```

---

### 6.4.7. Alerts System

**Коли відправляти:**

```typescript
// Ahrefs/Serpstat/SEMrush (з API limits)
if (usagePercentage >= 80) {
  notification = {
    type: 'usage_warning',
    title: 'Ahrefs usage at 80%',
    message: 'You've used 480/600 credits',
    actions: ['View Details', 'Upgrade Plan']
  };
}

// Claude (опціонально, якщо user встановив budget)
if (userBudget && costPercentage >= 80) {
  notification = {
    type: 'budget_warning',
    title: 'Claude API budget at 80%',
    message: 'You've spent $400 of your $500 monthly budget',
    actions: ['View Usage', 'Increase Budget']
  };
}
```

**Канали:**
- In-app notification (floating button)
- Email (при >95%)

---

### 6.4.8. Implementation Priority

**Phase 1 (MVP):**
- ✅ Tracking для Claude (найважливіше, бо платний)
- ✅ Progress bars як у Ahrefs
- ✅ Basic alerts (80%)

**Phase 2:**
- ✅ Ahrefs/Serpstat/SEMrush tracking
- ✅ Usage details page
- ✅ Export reports
- ✅ Budget management UI

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

### 9.1. Загальна структура інтерфейсу

**Рішення:** Sidebar navigation (ліва панель)

**Обґрунтування:**
- ✅ Більше items в навігації (Projects, Tasks, Messaging, etc)
- ✅ Sidebar можна collapse на мобілці
- ✅ Standard для B2B SaaS (Slack, Linear, Notion)
- ✅ Постійно видима навігація
- ✅ Швидкий доступ до всіх секцій

**Layout:**
```
┌──────────┬─────────────────────────────────┐
│          │                                 │
│ Sidebar  │  Main Content Area              │
│ (200px)  │  (flexible width)               │
│          │                                 │
│ Projects │  ┌───────────────────────────┐  │
│ Tasks    │  │                           │  │
│ Messages │  │  Current Page Content     │  │
│ Reports  │  │                           │  │
│ Settings │  │                           │  │
│          │  └───────────────────────────┘  │
│          │                                 │
└──────────┴─────────────────────────────────┘
```

**Mobile (< 640px):**
- Sidebar collapse до hamburger menu
- Full-width content
- Bottom navigation bar (опціонально)

---

### 9.2. Повна структура екранів

#### 🔐 Auth & Onboarding (поза sidebar)

**1. `/login` - Login Page**
```
┌────────────────────────────────┐
│ 🎯 SEO AI Platform             │
├────────────────────────────────┤
│                                │
│ Email:    [_____________]      │
│ Password: [_____________]      │
│                                │
│ [🔵 Sign In with Google]       │
│ [Login]                        │
│                                │
│ Don't have account? [Sign up]  │
└────────────────────────────────┘
```

**2. `/signup` - Registration**
```
┌────────────────────────────────┐
│ Create Account                 │
├────────────────────────────────┤
│                                │
│ Name:          [_____________] │
│ Email:         [_____________] │
│ Password:      [_____________] │
│ Organization:  [_____________] │
│                                │
│ [Create Account]               │
│                                │
│ Already have? [Login]          │
└────────────────────────────────┘
```

**3. `/onboarding` - Onboarding Wizard (4 steps)**

**Step 1: Connect Google**
```
┌────────────────────────────────┐
│ Welcome! Let's set up (1/4)    │
├────────────────────────────────┤
│                                │
│ Connect Google Services        │
│                                │
│ We need access to:             │
│ ✅ Google Search Console       │
│ ✅ Google Analytics GA4        │
│ ✅ Google Drive/Docs/Sheets    │
│                                │
│ [🔵 Connect with Google]       │
│                                │
│ [Skip for now] [Next →]        │
└────────────────────────────────┘
```

**Step 2: Add First Project**
```
┌────────────────────────────────┐
│ Add your first project (2/4)   │
├────────────────────────────────┤
│                                │
│ Project Name: [___________]    │
│ Domain: [https://___________]  │
│ CMS: [WordPress ▼]             │
│                                │
│ [Add Project]                  │
│                                │
│ [← Back] [Skip] [Next →]       │
└────────────────────────────────┘
```

**Step 3: Connect Claude API**
```
┌────────────────────────────────┐
│ Connect AI Assistant (3/4)     │
├────────────────────────────────┤
│                                │
│ Claude API Key:                │
│ [sk-ant-___________________]   │
│                                │
│ 💡 Get your key at:            │
│ console.anthropic.com          │
│                                │
│ [Test & Save]                  │
│                                │
│ [← Back] [Skip] [Next →]       │
└────────────────────────────────┘
```

**Step 4: Done!**
```
┌────────────────────────────────┐
│ All set! (4/4) 🎉              │
├────────────────────────────────┤
│                                │
│ ✅ Google connected            │
│ ✅ Project added               │
│ ✅ AI ready                    │
│                                │
│ What's next?                   │
│ • Run your first audit         │
│ • Invite team members          │
│ • Explore dashboard            │
│                                │
│ [Go to Dashboard →]            │
└────────────────────────────────┘
```

---

#### 📊 Main App (з sidebar)

**Sidebar Navigation:**
```
┌────────────────┐
│ [Logo]         │
│ ACME Agency ▼  │ ← Organization selector
├────────────────┤
│ 🏠 Dashboard   │
│ 📁 Projects    │
│ ✅ Tasks       │
│ 💬 Messages    │
│ 📊 Reports     │
│ ⚙️  Settings   │
├────────────────┤
│ [@User]        │
│ [🌙]           │ ← Theme toggle
└────────────────┘
```

---

**4. `/dashboard` - Home (Morning Brief)**
```
┌──────────────────────────────────────────────┐
│ 🌅 Good Morning, Ivan!                       │
│ Tuesday, November 12, 2025                   │
├──────────────────────────────────────────────┤
│                                               │
│ 📊 Your Projects Overview (5 active)         │
│                                               │
│ ┌──────────────────────────────────────────┐ │
│ │ 🔴 site-a.com                    CRITICAL│ │
│ │ Traffic: -35% (last 7 days) ⚠️           │ │
│ │ Issues: 15 new 404 errors found          │ │
│ │ [View Details] [Create Tasks]            │ │
│ └──────────────────────────────────────────┘ │
│                                               │
│ ┌──────────────────────────────────────────┐ │
│ │ 🟢 site-b.com                    ALL GOOD│ │
│ │ Traffic: +12% ✅                         │ │
│ │ Everything looks great!                  │ │
│ │ [View Details]                           │ │
│ └──────────────────────────────────────────┘ │
│                                               │
│ ┌──────────────────────────────────────────┐ │
│ │ 🟡 site-c.com                    WARNING │ │
│ │ PageSpeed: 45/100 (was 78)               │ │
│ │ Core Web Vitals degraded                 │ │
│ │ [View Details] [Run Audit]               │ │
│ └──────────────────────────────────────────┘ │
│                                               │
│ 💬 AI Quick Chat                             │
│ "Ask me anything about your projects..."     │
│ [____________________________________] [Send]│
│                                               │
│ ✅ Tasks Summary                             │
│ • 3 critical tasks (due today)               │
│ • 12 tasks in progress                       │
│ • 8 completed this week                      │
│ [View All Tasks →]                           │
└──────────────────────────────────────────────┘
```

---

**5. `/projects` - Projects List**
```
┌──────────────────────────────────────────────┐
│ Projects                       [+ New Project]│
├──────────────────────────────────────────────┤
│ [🔍 Search] [Filter: All ▼] [Sort: Name ▼]  │
├──────────────────────────────────────────────┤
│                                               │
│ ┌─────────────┬─────────────┬─────────────┐  │
│ │ site-a.com  │ site-b.com  │ site-c.com  │  │
│ │ 🔴 Critical │ 🟢 Good     │ 🟡 Warning  │  │
│ │ -35% ⚠️     │ +12% ✅     │ 45 PageSpd  │  │
│ │ 15 issues   │ 0 issues    │ 3 issues    │  │
│ │ 8 tasks     │ 2 tasks     │ 5 tasks     │  │
│ └─────────────┴─────────────┴─────────────┘  │
│                                               │
│ [Load more...]                                │
└──────────────────────────────────────────────┘
```

---

**6. `/projects/[id]` - Project Detail 🔥 (ГОЛОВНИЙ ЕКРАН)**

**Концепція:** Це основний екран де команда проводить більшість часу!

**Структура:**
```
┌─────────┬─────────────────────────────────────────┐
│         │ ← Projects | site-a.com   [⚙️] [Audit] │
│ Sidebar ├─────────────────────────────────────────┤
│         │                                         │
│         │ 📊 Widget Dashboard (customizable grid) │
│         │                                         │
│         │ ┌───────────┬───────────┬───────────┐   │
│         │ │ GSC       │ Ahrefs    │ Serpstat  │   │
│         │ │ Widget    │ Widget    │ Widget    │   │
│         │ └───────────┴───────────┴───────────┘   │
│         │                                         │
│         │ ┌───────────┬───────────┬───────────┐   │
│         │ │ GA4       │ PageSpeed │ [+add]    │   │
│         │ │ Widget    │ Widget    │           │   │
│         │ └───────────┴───────────┴───────────┘   │
│         │                                         │
│         ├─────────────────────────────────────────┤
│         │ 💬 Chat (Ivan, Anna, @AI)         (2)   │
│         │ Ivan: "Check traffic drop"              │
│         │ @AI: "Analyzed. 3 causes found..."      │
│         │ [Type message...] [Send]                │
│         └─────────────────────────────────────────┘
└─────────┴─────────────────────────────────────────┘

                       Notifications (справа):
                       ┌──────────────────────┐
                       │ site-a.com traffic   │ ← Згорнута
                       ├──────────────────────┤
                       │ 404 errors found     │ ← Згорнута
                       ├──────────────────────┤
                       │ PageSpeed degraded   │ ← Розгорнута
                       │                      │
                       │ Mobile: 45/100 🔴    │
                       │ Desktop: 78/100 🟡   │
                       │                      │
                       │ LCP: 4.2s (bad)      │
                       │ [View] [Fix] [×]     │
                       └──────────────────────┘
```

**Пояснення елементів:**

1. **Header** - назва проекту, кнопки дій
2. **Widget Dashboard** - customizable grid з віджетами
3. **Chat Area** - компактна зона для швидкої комунікації (знизу)
4. **Notifications Stack** - floating справа (як в CK3)

---

### 9.3. Widget System 🧩

**Концепція:** Project Detail = Widget Dashboard (головна площа) + Chat (знизу) + Notifications (floating справа)

#### 9.3.1. MVP Phase (Fixed Layout)

**Підхід для MVP:** 
- Fixed grid layout (не customizable)
- 6-8 предефайнених widgets
- 3 колонки на desktop, 2 на tablet, 1 на mobile
- Користувач НЕ може змінювати (але бачить все важливе)

**Переваги fixed layout для MVP:**
- ✅ Швидше розробити (1 тиждень vs 3-4 тижні)
- ✅ Простіше підтримувати
- ✅ Користувачі не губляться (все на місцях)
- ✅ Можна запустити раніше

**Default Grid Layout (desktop):**
```
┌─────────────┬─────────────┬─────────────┐
│ GSC Widget  │ GA4 Widget  │ PageSpeed   │
│ (medium)    │ (medium)    │ Widget      │
│             │             │ (small)     │
├─────────────┼─────────────┼─────────────┤
│ Crawl       │ Tasks       │ Ahrefs      │
│ Status      │ Widget      │ Widget      │
│ (small)     │ (medium)    │ (optional)  │
├─────────────┴─────────────┴─────────────┤
│ AI Insights Widget (full width)         │
│ "Traffic -35% due to Google Update..."  │
└─────────────────────────────────────────┘
```

**Responsive behavior:**
```
Desktop (1200+):  3 columns
Tablet (768-1199): 2 columns
Mobile (0-767):    1 column (stack)
```

---

#### 9.3.2. Widget Examples (MVP набір)

**1. GSC Widget (Google Search Console)**
```
┌──────────────────────────────┐
│ 🔍 Search Console (Last 30d) │
├──────────────────────────────┤
│ Clicks: 1,247 (↓ 12%)        │
│ Impressions: 45K (↓ 8%)      │
│ CTR: 2.77% (↓ 0.1%)          │
│ Avg Position: 18.4 (↑ 1.2)   │
│                               │
│ [Line Chart]                  │
│                               │
│ ⚠️ New Issues (3)            │
│ • 15 pages with 404          │
│ • 8 pages not indexed        │
│                               │
│ [View in GSC →]               │
└──────────────────────────────┘
```

**Що показує:**
- Основні метрики (clicks, impressions, CTR, position)
- Графік динаміки
- Нові проблеми з індексацією
- Лінк на GSC для деталей

**Джерело даних:** Google Search Console API

---

**2. GA4 Widget (Google Analytics)**
```
┌──────────────────────────────┐
│ 📊 Analytics (Last 30d)       │
├──────────────────────────────┤
│ Sessions: 3,890 (↑ 15%)       │
│ Organic: 2,145 (↑ 18%)        │
│ Bounce: 42.3% (↓ 2.1%)        │
│ Avg Time: 2:34 (↑ 0:15)       │
│                               │
│ [Area Chart]                  │
│                               │
│ Top Pages:                    │
│ 1. /blog/seo-guide (450)      │
│ 2. /services (320)            │
│                               │
│ [View in GA4 →]               │
└──────────────────────────────┘
```

**Що показує:**
- Сесії (загальні + органічні)
- Bounce rate, avg time
- Графік трафіку
- Top landing pages
- Лінк на GA4

**Джерело даних:** Google Analytics Data API

---

**3. PageSpeed Widget**
```
┌──────────────────────────────┐
│ ⚡ PageSpeed Insights         │
├──────────────────────────────┤
│ Mobile:   45/100 🔴           │
│ Desktop:  78/100 🟡           │
│                               │
│ Core Web Vitals:              │
│ LCP: 4.2s 🔴 (target <2.5s)  │
│ FID: 180ms 🟡                 │
│ CLS: 0.05 🟢                  │
│                               │
│ [Run New Test]                │
│ Last: 2h ago                  │
└──────────────────────────────┘
```

**Що показує:**
- Mobile/Desktop scores
- Core Web Vitals breakdown
- Статус кожної метрики (🔴🟡🟢)
- Коли останній раз тестили
- Кнопка Run Test

**Джерело даних:** PageSpeed Insights API

---

**4. Crawl Status Widget**
```
┌──────────────────────────────┐
│ 🕷️ Latest Crawl               │
├──────────────────────────────┤
│ Status: ✅ Completed          │
│ Pages: 1,247 / 1,500          │
│ Time: 45 min                  │
│ Date: Nov 11, 10:30           │
│                               │
│ Issues Found: 23              │
│ 🔴 Critical: 5                │
│ 🟡 Warning: 18                │
│                               │
│ [View Report] [Run Again]     │
└──────────────────────────────┘
```

**Що показує:**
- Статус останнього краулінгу
- Скільки сторінок проскановано
- Час виконання
- Кількість знайдених проблем
- Кнопки View/Run

**Джерело даних:** Audit table (database)

---

**5. Tasks Widget**
```
┌──────────────────────────────┐
│ ✅ Active Tasks (12)          │
├──────────────────────────────┤
│ 🔴 Fix 404 errors (@ivan)     │
│    Due: Today                 │
│                               │
│ 🟡 Meta descriptions (@anna)  │
│    Due: Tomorrow              │
│                               │
│ 🟢 Internal links (@petro)    │
│    Due: Nov 15                │
│                               │
│ [+4 more...]                  │
│                               │
│ [View All Tasks →]            │
└──────────────────────────────┘
```

**Що показує:**
- Активні задачі проекту
- Assignee + deadline
- Пріоритет (колір)
- Скільки ще задач
- Лінк на повний task manager

**Джерело даних:** Task table (database)

---

**6. Ahrefs Widget (optional, якщо підключено)**
```
┌──────────────────────────────┐
│ 🔗 Ahrefs                     │
├──────────────────────────────┤
│ DR: 45 (↑ 2)                  │
│ Backlinks: 1,247 (↑ 15)      │
│ Domains: 189 (↑ 3)            │
│                               │
│ New Links (7d): 12            │
│ Lost Links: 3                 │
│                               │
│ Top Anchors:                  │
│ • "seo services" (45)         │
│ • "site.com" (38)             │
│                               │
│ [View in Ahrefs →]            │
└──────────────────────────────┘
```

**Що показує:**
- Domain Rating + зміна
- Backlinks, referring domains
- New/Lost links
- Top anchor texts
- Лінк на Ahrefs

**Джерело даних:** Ahrefs API (опціонально)

---

**7. Serpstat Widget (optional, якщо підключено)**
```
┌──────────────────────────────┐
│ 📈 Serpstat Rankings          │
├──────────────────────────────┤
│ Keywords: 247 total           │
│ Top 3: 15 (↑ 2)              │
│ Top 10: 68 (↑ 5)             │
│ Top 20: 134 (↑ 8)            │
│                               │
│ Visibility: 18.4% (↑ 2.1%)   │
│                               │
│ Top Keywords:                 │
│ • "seo agency" - pos 3        │
│ • "website audit" - pos 7     │
│                               │
│ [View in Serpstat →]          │
└──────────────────────────────┘
```

**Що показує:**
- Загальна кількість keywords
- Розподіл по топах (3/10/20)
- Visibility score
- Top performing keywords
- Лінк на Serpstat

**Джерело даних:** Serpstat API (опціонально)

---

**8. AI Insights Widget (full width, можливо внизу)**
```
┌────────────────────────────────────────────────────┐
│ 🤖 AI Analysis & Recommendations                   │
├────────────────────────────────────────────────────┤
│                                                     │
│ 🔍 Key Findings:                                   │
│ • Traffic drop (-35%) likely caused by Google Core │
│   Update (Oct 15) + seasonal factors               │
│ • 15 new 404 errors affecting user experience      │
│ • PageSpeed degraded (78→45) needs urgent fix      │
│                                                     │
│ ✅ Recommended Actions:                            │
│ 1. Fix 404 errors (high priority)                  │
│ 2. Optimize images (reduce load time)              │
│ 3. Monitor competitor changes (3 new articles)     │
│ 4. Review content quality (post-update)            │
│                                                     │
│ [Create Tasks] [Generate Report] [Ask AI]          │
└────────────────────────────────────────────────────┘
```

**Що показує:**
- AI-generated insights на основі всіх даних
- Ключові знахідки (що сталося)
- Рекомендації (що робити)
- Quick actions

**Джерело даних:** Claude API analysis

---

#### 9.3.3. Phase 2: Customizable Widgets

**Функціонал Phase 2 (not MVP):**

```
✨ Features:
├─ Widget Library (20+ widgets)
├─ Drag & drop positioning
├─ Resize widgets (small, medium, large, full)
├─ Hide/show widgets
├─ Save custom layouts per user
├─ Share layouts з командою
└─ Widget marketplace (community widgets)
```

**Widget Library UI:**
```
┌──────────────────────────────┐
│ Widget Library        [× Close│
├──────────────────────────────┤
│ [🔍 Search widgets...]        │
├──────────────────────────────┤
│                               │
│ 📊 Data Sources:              │
│ ☑️ GSC Widget                 │
│ ☑️ GA4 Widget                 │
│ ☐ Serpstat Rankings          │
│ ☑️ PageSpeed Insights         │
│ ☐ Backlinks (Ahrefs)         │
│                               │
│ 🛠️ Tools:                     │
│ ☑️ Crawl Status               │
│ ☑️ Tasks Summary              │
│ ☐ Team Activity              │
│                               │
│ 🤖 AI:                        │
│ ☑️ AI Insights                │
│ ☐ AI Recommendations         │
│                               │
│ [Apply Changes]               │
└──────────────────────────────┘
```

**Custom Layout Editor:**
```
┌────────────────────────────────────┐
│ [📐 Edit Layout] [💾 Save] [🔙]    │
├────────────────────────────────────┤
│ Drag widgets to reorder            │
│                                    │
│ ┌─────┐ ┌─────┐ ┌─────┐           │
│ │ GSC │ │ GA4 │ │Speed│ [×][↔][↕] │ ← Resize
│ │ ... │ │ ... │ │ ... │           │
│ └─────┘ └─────┘ └─────┘           │
│                                    │
│ ┌───────────────┐                 │
│ │ AI Insights   │ [×][↕]          │
│ └───────────────┘                 │
│                                    │
│ [+ Add Widget from Library]        │
└────────────────────────────────────┘
```

**Timeline:**
- MVP (Phase 1): Fixed layout - Тиждень 11-12
- Phase 2: Customizable - Місяці 4-6

---

#### 9.3.4. Grid Layout System

**CSS Grid базова структура:**

```css
/* Desktop (3 columns) */
.widget-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  padding: 16px;
}

/* Widget sizes */
.widget-small {
  grid-column: span 1;
  height: 200px;
}

.widget-medium {
  grid-column: span 1;
  height: 400px;
}

.widget-large {
  grid-column: span 2;
  height: 400px;
}

.widget-full {
  grid-column: span 3;
  height: auto;
}

/* Tablet (2 columns) */
@media (max-width: 1199px) {
  .widget-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .widget-large,
  .widget-full {
    grid-column: span 2;
  }
}

/* Mobile (1 column) */
@media (max-width: 767px) {
  .widget-grid {
    grid-template-columns: 1fr;
  }
  .widget-small,
  .widget-medium,
  .widget-large,
  .widget-full {
    grid-column: span 1;
  }
}
```

**React Component Structure:**

```tsx
// components/WidgetDashboard.tsx
export function WidgetDashboard({ projectId }: Props) {
  // MVP: Fixed widgets
  const widgets = [
    { id: 'gsc', component: GSCWidget, size: 'medium' },
    { id: 'ga4', component: GA4Widget, size: 'medium' },
    { id: 'pagespeed', component: PageSpeedWidget, size: 'small' },
    { id: 'crawl', component: CrawlStatusWidget, size: 'small' },
    { id: 'tasks', component: TasksWidget, size: 'medium' },
    { id: 'ahrefs', component: AhrefsWidget, size: 'small', optional: true },
    { id: 'ai-insights', component: AIInsightsWidget, size: 'full' }
  ];

  return (
    
      {widgets.map(w => (
        
          
        
      ))}
    
  );
}
```

---

#### 9.3.5. Widget Registry (Phase 2)

**Централізований реєстр widgets:**

```typescript
// lib/widgets/registry.ts
export interface WidgetDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType;
  component: React.ComponentType;
  category: 'data' | 'tools' | 'ai' | 'custom';
  requiredIntegrations?: string[]; // ['gsc', 'ga4']
  defaultSize: 'small' | 'medium' | 'large' | 'full';
  configurable: boolean;
}

export const WIDGET_REGISTRY: WidgetDefinition[] = [
  {
    id: 'gsc',
    name: 'Google Search Console',
    description: 'Search performance metrics',
    icon: Search,
    component: GSCWidget,
    category: 'data',
    requiredIntegrations: ['gsc'],
    defaultSize: 'medium',
    configurable: true
  },
  // ... інші widgets
];
```

---

### 9.4. Chat Area (знизу на Project Detail)

**Концепція:** Компактна зона для швидкої комунікації команди

**Layout:**
```
┌─────────────────────────────────────────────┐
│ 💬 Chat: site-a-team              (2) badge │ ← Непрочитані
├─────────────────────────────────────────────┤
│ Ivan: "Check traffic drop"                  │
│ 10:30                                       │
│                                             │
│ Anna: "I see 404 errors in GSC"             │
│ 10:31                                       │
│                                             │
│ @AI: "Analyzed site-a.com.                  │
│ Found 3 causes:                             │
│ 1. Google Core Update...                    │
│ 2. Competitor activity...                   │
│ 3. Seasonal factors..."                     │
│ 10:32                                       │
│                                             │
│ [Type message...] [@AI] [Send]              │
└─────────────────────────────────────────────┘
```

**Features:**
- Показує останні 5-10 повідомлень
- Badge з кількістю непрочитаних
- @AI mention для швидких питань
- Expand кнопка → відкриває `/messages` (повний чат)

**Height:** Fixed ~250-300px (не займає багато місця)

**НЕ повний чат!** Для повної історії → `/messages`

---

### 9.5. Notification System (Floating Stack) 🔔

**Концепція:** Як в Crusader Kings 3 - стек нотіфікацій справа

#### 9.5.1. Як працює:

**1. З'являється нова нотіфікація:**
```
                              ┌─────────────────────┐
                              │ 🔴 site-a.com       │
                              │ Traffic -35%!       │
                              │                     │
                              │ [Детальний опис...] │
                              │ Clicks: 450 → 290   │
                              │ Impressions: -15%   │
                              │                     │
                              │ [View] [Fix] [×]    │
                              └─────────────────────┘
```

**2. З'являється друга → перша згортається:**
```
                              ┌─────────────────────┐
                              │ 🔴 site-a.com...    │ ← Згорнута
                              ├─────────────────────┤
                              │ ⚠️ 404 errors found!│ ← Нова (розгорнута)
                              │                     │
                              │ 15 pages with 404   │
                              │ • /old-page-1       │
                              │ • /old-page-2       │
                              │                     │
                              │ [View] [Fix] [×]    │
                              └─────────────────────┘
```

**3. Третя → утворюється стек:**
```
                              ┌─────────────────────┐
                              │ 🔴 site-a.com...    │ ← Згорнута
                              ├─────────────────────┤
                              │ ⚠️ 404 errors...    │ ← Згорнута
                              ├─────────────────────┤
                              │ 🟡 PageSpeed degraded│ ← Нова (розгорнута)
                              │                     │
                              │ Mobile: 78 → 45     │
                              │ LCP: 4.2s (target <2.5s) │
                              │                     │
                              │ [View] [Test] [×]   │
                              └─────────────────────┘
```

**4. Клік на згорнуту → розгортається (інші згортаються):**
```
                              ┌─────────────────────┐
                              │ 🔴 site-a.com       │ ← Розгорнута!
                              │ Traffic -35%!       │
                              │                     │
                              │ Clicks: 450 → 290   │
                              │ Impressions: -15%   │
                              │ CTR: 2.77% → 2.64%  │
                              │                     │
                              │ [View] [Fix] [×]    │
                              ├─────────────────────┤
                              │ ⚠️ 404 errors...    │ ← Згорнута
                              ├─────────────────────┤
                              │ 🟡 PageSpeed...     │ ← Згорнута
                              └─────────────────────┘
```

---

#### 9.5.2. Типи нотіфікацій

**Critical (🔴):**
- Traffic drop >30%
- Site down (500 errors)
- Massive indexing errors (50+)
- Core Web Vitals all red

**Warning (🟡):**
- Traffic drop 15-30%
- New 404 errors (10-50)
- PageSpeed degraded >20 points
- Position drops (top 3 → 10+)

**Info (🔵):**
- Task assigned to you
- New message (@mention)
- Audit completed
- Report generated

**Success (🟢):**
- Traffic increase >20%
- All tasks completed
- Indexing issues resolved
- PageSpeed improved

---

#### 9.5.3. Notification Card Structure

```
┌─────────────────────────────────┐
│ 🔴 [Icon] Title                 │ ← Header (завжди видно)
├─────────────────────────────────┤
│                                 │ ← Body (розгортається)
│ [Детальна інформація]           │
│ [Метрики, графіки]              │
│ [Рекомендації AI]               │
│                                 │
├─────────────────────────────────┤
│ [Action 1] [Action 2] [×]       │ ← Footer (кнопки дій)
└─────────────────────────────────┘
```

**Згорнута:**
```
┌─────────────────────────────────┐
│ 🔴 site-a.com traffic -35%      │
└─────────────────────────────────┘
```

**Розгорнута:**
```
┌─────────────────────────────────┐
│ 🔴 site-a.com traffic -35%      │
├─────────────────────────────────┤
│ Critical drop detected!         │
│                                 │
│ Clicks: 450 → 290 (-160)        │
│ Impressions: 12K → 11K          │
│ CTR: 3.75% → 2.64%              │
│                                 │
│ Likely causes:                  │
│ • Google Core Update (Oct 15)   │
│ • Competitor activity           │
│                                 │
│ [View Dashboard] [Create Tasks] │
│ [Ask AI] [×]                    │
└─────────────────────────────────┘
```

---

#### 9.5.4. Auto-dismiss & Persistence

**Auto-dismiss:**
- Success notifications: 10 секунд
- Info notifications: 30 секунд
- Warning notifications: до manual dismiss
- Critical notifications: до manual dismiss

**Persistence:**
- Зберігаються в БД
- Можна переглянути історію
- Групування по проектах
- Archive after 30 days

---

#### 9.5.5. Звуки (optional)

```typescript
const sounds = {
  critical: '/sounds/alert-critical.mp3',  // Гучний
  warning: '/sounds/alert-warning.mp3',    // Середній
  info: '/sounds/notification.mp3',        // Тихий
  success: '/sounds/success.mp3'           // Приємний
};
```

**Settings:**
```
☑️ Enable sounds
Volume: [▓▓▓▓▓▓▓▓░░] 80%

☐ Do not disturb (21:00 - 09:00)
```

---

#### 9.5.6. Database Schema (додати до розділу 5.9)

```prisma
model Notification {
  id       String   @id @default(cuid())
  userId   String
  user     User     @relation(fields: [userId], references: [id])
  
  projectId String?
  project   Project? @relation(fields: [projectId], references: [id])
  
  // Type
  type     String   // "critical" | "warning" | "info" | "success"
  category String   // "traffic_drop" | "404_errors" | "pagespeed" | etc
  
  // Display
  title    String
  message  String   @db.Text
  icon     String   // emoji
  
  // Rich content (для розгорнутого стану)
  metadata Json?    // { metrics, analysis, recommendations }
  
  // Actions
  actions  Json?    // [{ label: "View", url: "/..." }]
  
  // State
  isRead      Boolean  @default(false)
  isDismissed Boolean  @default(false)
  isExpanded  Boolean  @default(true)  // Тільки остання розгорнута
  
  // Position in stack
  stackPosition Int?
  
  createdAt DateTime @default(now())
  
  @@index([userId, createdAt])
  @@index([projectId, type])
}
```

---

### 9.6. Інші важливі екрани

**7. `/tasks` - Global Tasks View**
```
┌──────────────────────────────────────────────┐
│ Tasks                  [@Me ▼] [Filter] [+]   │
├──────────────────────────────────────────────┤
│ [Schedule] [Backlog] [Done]    ← TABS        │
├──────────────────────────────────────────────┤
│                                               │
│ Monday, Nov 11          [7.5h / 7.5h] ✅      │
│ ├─ 🔴 Fix 404 errors (2h) - site-a.com       │
│ ├─ 🟡 Meta tags (4h) - site-b.com            │
│ └─ 🟢 Check indexation (1.5h) - site-c.com   │
│                                               │
│ Tuesday, Nov 12         [8.2h / 7.5h] ⚠️      │
│ ├─ ... (overload warning)                    │
│                                               │
│ [+ Add Task] [AI Schedule Week]               │
└──────────────────────────────────────────────┘
```

**8. `/messages` - Team Messaging (повний)**
```
┌──────────┬───────────────────────────────────┐
│ Chats    │ Chat: "site-a-team"               │
│          │                                   │
│ 🤖 AI    │ [Вся історія повідомлень]         │
│ site-a   │                                   │
│ site-b   │ Ivan: "Traffic dropped 35%"       │
│ general  │ Anna: "I see 404 errors"          │
│          │ @AI: "Analyzed. 3 causes..."      │
│ [+ New]  │                                   │
│          │ [Type message...] [@AI] [Send]    │
└──────────┴───────────────────────────────────┘
```

**9. `/reports` - Reports Hub**
```
┌──────────────────────────────────────────────┐
│ Reports                  [Generate New ▼]     │
├──────────────────────────────────────────────┤
│ [All] [Scheduled] [Manual] [Archived]        │
├──────────────────────────────────────────────┤
│                                               │
│ ┌──────────────────────────────────────────┐ │
│ │ 📊 October Report - site-a.com           │ │
│ │ Generated: Nov 1, 2025 (Scheduled)       │ │
│ │ [View] [Download] [Share]                │ │
│ └──────────────────────────────────────────┘ │
│                                               │
│ Scheduled Reports (3):                        │
│ • Monthly Summary (1st of month, 09:00)      │
│ • Weekly Brief (Mondays, 08:00)              │
│                                               │
│ [Manage Schedules]                            │
└──────────────────────────────────────────────┘
```

**10. `/settings` - Organization Settings**
```
┌──────────────────────────────────────────────┐
│ Settings                                      │
├──────────────────────────────────────────────┤
│ [Profile] [Organization] [Team] [Billing]    │
├──────────────────────────────────────────────┤
│                                               │
│ Organization Settings:                        │
│                                               │
│ Name: [ACME Agency______________]             │
│ Plan: Pro ($49/mo)                            │
│ Projects: 5 / 10                              │
│ Team: 3 / 3 users                             │
│                                               │
│ [Upgrade Plan]                                │
└──────────────────────────────────────────────┘
```

**11. `/settings/integrations`**

Детально описано в розділі 6.2 (OAuth vs API Keys)

---

### 9.7. Design System

**Technology Stack for UI:**

**MVP Approach: shadcn/ui + Tailwind CSS** 🎯

**Чому shadcn/ui для MVP:**
```
✅ Безкоштовно (MIT license)
✅ Високоякісний дизайн (професійно виглядає)
✅ Copy-paste компоненти (швидка розробка)
✅ Tailwind CSS based (гнучкість)
✅ Доступність (accessibility built-in)
✅ Темна/світла тема (out-of-box)
✅ TypeScript підтримка
✅ Активна community
```

**shadcn/ui Components що використаємо:**
```
Layout:
├─ Sidebar
├─ Card (для widgets)
├─ Tabs
└─ Sheet (для modals)

Forms:
├─ Input, Select, Checkbox
├─ Label, Form
└─ Button

Data Display:
├─ Table
├─ Badge
├─ Avatar
└─ Progress

Feedback:
├─ Toast (для notifications popup)
├─ Alert
├─ Dialog
└─ Popover

Navigation:
├─ Breadcrumb
├─ Menu
└─ Command (⌘K)
```

**Колірна палітра:**
```css
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
```

**Spacing:**
```
Base: 4px (Tailwind)
p-2: 8px
p-4: 16px
p-6: 24px
p-8: 32px
```

---

### 9.8. Responsive Design

**Breakpoints:**
```
sm: 640px   (Mobile landscape)
md: 768px   (Tablet)
lg: 1024px  (Desktop small)
xl: 1280px  (Desktop)
2xl: 1536px (Desktop large)
```

**Mobile-first approach:**

**Widget Dashboard (responsive):**
```
Desktop (1200px+):  3 columns
Tablet (768-1199):  2 columns
Mobile (0-767):     1 column (stack)
```

**Notifications (mobile):**
- Повноекранні (overlay)
- Swipe to dismiss
- Simplified actions

---

### 9.9. Оновлений Roadmap з UI/UX

**Phase 1 (Тижні 1-20) — MVP:**

**Тиждень 1-2: Foundation**
- Next.js setup
- shadcn/ui installation
- Sidebar layout
- Auth pages

**Тиждень 3-4: Onboarding**
- 4-step wizard
- Google OAuth
- First project

**Тиждень 5-6: Dashboard**
- Morning Brief page
- Projects list

**Тиждень 7-10: Core Modules**
- Data Collection
- AI Analysis
- Crawler
- APIs

**Тиждень 11-12: Widget System** 🔥
- BaseWidget component
- 6-8 MVP widgets (GSC, GA4, PageSpeed, Crawl, Tasks, Ahrefs, AI)
- Fixed grid layout
- Project Detail page
- Chat Area (компактна, знизу)
- Responsive grid

**Тиждень 13-14: Task Manager**
- Schedule/Backlog/Done views
- CRUD operations
- AI planning
- Drag & drop

**Тиждень 15-16: Messaging + Notifications**
- Chat (WebSocket)
- AI teammate (@mention)
- Notification Stack (floating справа, як CK3) 🎯
- Auto-collapse/expand logic
- Sound system

**Тиждень 17-20: Polish & Testing**
- UI/UX improvements
- Mobile optimization
- Performance
- Beta testing

**Phase 2 (Місяці 4-6) — Widget Customization:**

**Місяць 4:**
- Widget Library UI
- Drag & drop widgets
- Resize widgets
- Save custom layouts

**Місяць 5:**
- 20+ total widgets
- Advanced filtering
- Widget analytics
- Share layouts з командою

**Місяць 6:**
- Custom widgets (user-created)
- Widget marketplace
- A/B testing layouts
- Performance optimization

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

**Тиждень 3-6: Messaging + AI Teammate** 🔥
- [ ] Socket.io WebSocket setup
- [ ] Chat CRUD (create, list, members)
- [ ] Messages (send, receive, attachments)
- [ ] Real-time updates
- [ ] Online status + typing indicators
- [ ] AI user creation (seed)
- [ ] AI в окремому чаті
- [ ] AI в групових чатах (@mention)
- [ ] Context building для AI
- [ ] Frontend UI (ChatList + MessageArea)

**Тиждень 7-8: Google APIs**
- [ ] Google OAuth setup
- [ ] Google Search Console API
- [ ] Google Analytics GA4 API
- [ ] Google Drive/Docs/Sheets API
- [ ] PageSpeed Insights API

**Тиждень 9-10: Data Collection**
- [ ] Cron jobs для щоденного збору даних
- [ ] DataSnapshot model + storage
- [ ] AI Analysis Service
- [ ] Morning Brief генерація
- [ ] Dashboard з графіками (Recharts)

**Тиждень 11-12: Crawler**
- [ ] Crawlee + Playwright setup
- [ ] Audit Service
- [ ] Background jobs queue (BullMQ)
- [ ] Збереження результатів аудиту

**Тиждень 13-14: Task Manager**
- [ ] Task CRUD operations
- [ ] Assignment workflow + acceptance
- [ ] Schedule + Backlog + Done views
- [ ] AI planning (розподіл на тиждень)
- [ ] Drag & drop
- [ ] Time tracking (basic)
- [ ] Integration з чатом

**Тиждень 15-16: Notifications**
- [ ] Notification model + settings
- [ ] WebSocket events
- [ ] Floating button (bottom-right)
- [ ] Notification panel (sidebar)
- [ ] Popup toasts
- [ ] Sound system (optional)
- [ ] Auto-grouping
- [ ] Interactive actions
- [ ] Integration з messaging + tasks

**Тиждень 17-20: Polish & Testing**
- [ ] UI/UX improvements
- [ ] Bug fixes
- [ ] Performance optimization
- [ ] Documentation
- [ ] Beta testing з 5-10 користувачами

**Результат Phase 1:**
Робоча платформа з базовим функціоналом:
- 💬 Team messaging з AI teammate
- 🔔 Smart notifications (in-app)
- 📊 Google APIs інтеграції
- 🤖 AI аналіз даних
- 🕷️ Краулер для аудитів
- ✅ Task Manager
- 📈 Dashboard з метриками
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
- [ ] Messaging Phase 2: Reactions, Reply threads, Message search
- [ ] **Scheduled Tasks (розширена версія)**
  - [ ] Всі типи задач (аудит, конкуренти, звіти)
  - [ ] AI створення задач через чат
  - [ ] Templates для швидких дій

**Місяць 6:**
- [ ] Email notifications (SendGrid)
- [ ] Notifications Phase 2: Telegram integration, Slack webhooks
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