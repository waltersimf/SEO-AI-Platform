# Forgeline - SEO AI Platform

**v0.1 - Foundation & Auth** ✅

Team collaboration platform with AI teammate for SEO agencies.

## 📋 Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **TypeScript**
- **shadcn/ui** + Tailwind CSS
- **NextAuth.js** (Authentication)

### Backend
- **NestJS**
- **PostgreSQL** + Prisma ORM
- **JWT** (Passport.js)
- **Redis** (BullMQ для черг)

### Infrastructure
- **Docker Compose** (local dev)
- **pnpm** (workspaces)

---

## 🚀 Quick Start

### Prerequisites

Переконайся що встановлено:
- **Node.js** >= 20.0.0
- **pnpm** >= 8.0.0
- **Docker Desktop** (для PostgreSQL + Redis)

### Installation

1. **Clone repository:**
```bash
git clone <your-repo-url>
cd forgeline
```

2. **Install dependencies:**
```bash
pnpm install
```

3. **Setup environment:**
```bash
# Copy .env.example
cp .env.example .env

# Відредагуй .env якщо потрібно
# За замовчуванням PostgreSQL: localhost:5432
# JWT_SECRET змінюй для production!
```

4. **Start Docker services:**
```bash
# Запустити PostgreSQL + Redis
docker-compose up -d

# Перевірити що працюють
docker ps
```

5. **Run database migrations:**
```bash
# Generate Prisma Client
cd packages/db
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev --name init
```

6. **Start development servers:**
```bash
# Повернутись в root
cd ../..

# Запустити frontend + backend разом
pnpm dev

# Або окремо:
pnpm dev:web    # Next.js на http://localhost:3000
pnpm dev:api    # NestJS на http://localhost:4000
```

---

## 📁 Project Structure

```
forgeline/
├── apps/
│   ├── web/              # Next.js 14 Frontend
│   │   ├── src/
│   │   │   ├── app/      # App Router pages
│   │   │   ├── components/
│   │   │   └── lib/
│   │   ├── package.json
│   │   └── next.config.js
│   │
│   └── api/              # NestJS Backend
│       ├── src/
│       │   ├── auth/
│       │   ├── prisma/
│       │   └── main.ts
│       └── package.json
│
├── packages/
│   └── db/               # Prisma Schema
│       └── schema.prisma
│
├── docker-compose.yml    # PostgreSQL + Redis
├── pnpm-workspace.yaml
└── package.json
```

---

## 🧪 Testing

### E2E Test (v0.1 Acceptance Criteria)

1. **Signup:**
```
✅ Відкрити http://localhost:3000/auth/signup
✅ Заповнити форму:
   - Name: Test User
   - Email: test@example.com
   - Organization: Test Agency
   - Password: password123
✅ Натиснути "Create Account"
✅ Перевірити redirect на /onboarding або /dashboard
```

2. **Login:**
```
✅ Відкрити http://localhost:3000/auth/login
✅ Ввести:
   - Email: test@example.com
   - Password: password123
✅ Натиснути "Sign In"
✅ Перевірити що JWT token збережено в localStorage
✅ Перевірити redirect на /dashboard
```

3. **Database Check:**
```bash
# Перевірити що User + Organization створені
cd packages/db
pnpm prisma studio

# Відкриється http://localhost:5555
# Дивись таблиці users та organizations
```

---

## 🗄️ Database

### Prisma Commands

```bash
# Generate Prisma Client після змін schema
pnpm db:generate

# Create migration
pnpm db:migrate

# Open Prisma Studio (GUI)
pnpm db:studio
```

### Reset Database

```bash
cd packages/db
pnpm prisma migrate reset
```

---

## 🔧 Development Commands

```bash
# Install dependencies
pnpm install

# Development (all)
pnpm dev

# Development (separate)
pnpm dev:web    # Frontend only
pnpm dev:api    # Backend only

# Build
pnpm build

# Lint
pnpm lint

# Type check
pnpm type-check
```

---

## 🐳 Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Reset volumes (видалить всі дані!)
docker-compose down -v
```

---

## ✅ v0.1 Acceptance Criteria

- [x] Next.js 14 setup (App Router)
- [x] shadcn/ui + Tailwind CSS
- [x] Auth pages (Login, Signup)
- [x] NestJS backend
- [x] PostgreSQL + Prisma
- [x] JWT authentication
- [x] Docker Compose
- [x] Monorepo structure
- [ ] **Test:** User signup → login → dashboard (manually test!)

---

## 🚦 Next Steps (v0.2)

- Google OAuth integration
- Google Search Console API
- Dashboard з GSC metrics
- Data collection module

---

## 📝 Notes

### Security
- ⚠️ `JWT_SECRET` змінюй для production!
- ⚠️ Passwords hashed з bcrypt (salt rounds: 10)
- ⚠️ CORS enabled тільки для `FRONTEND_URL`

### Development
- Hot reload працює для frontend + backend
- Prisma Client auto-regenerates після schema changes
- Environment variables завантажуються з `.env`

---

## 🆘 Troubleshooting

**Problem:** `Docker postgres not starting`
```bash
# Check logs
docker-compose logs postgres

# Reset volumes
docker-compose down -v
docker-compose up -d
```

**Problem:** `Prisma Client not found`
```bash
cd packages/db
pnpm prisma generate
```

**Problem:** `Port 3000/4000 already in use`
```bash
# Kill process на порті
# Mac/Linux:
lsof -ti:3000 | xargs kill -9
lsof -ti:4000 | xargs kill -9

# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

---

## 📚 Documentation

- [Next.js Docs](https://nextjs.org/docs)
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [shadcn/ui](https://ui.shadcn.com)

---

**Made with 💙 by Forgeline Team**
