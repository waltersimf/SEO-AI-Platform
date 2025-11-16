# Google OAuth Troubleshooting Guide

**Проект:** Forgeline  
**Версія:** 1.1  
**Дата:** 16.11.2025

---

## 📋 Table of Contents

1. [redirect_uri_mismatch](#1-redirect_uri_mismatch)
2. [OAuth2Strategy requires clientID](#2-oauth2strategy-requires-clientid)
3. [Foreign key constraint failed](#3-foreign-key-constraint-failed)
4. [Access denied (403)](#4-access-denied-403)
5. [refreshToken = NULL](#5-refreshtoken--null)
6. [EADDRINUSE port 4000](#6-eaddrinuse-port-4000)
7. [Unique constraint failed](#7-unique-constraint-failed-new)
8. [Next.js caching issues](#8-nextjs-caching-issues)
9. [Debug Checklist](#9-debug-checklist)

---

## 1. redirect_uri_mismatch

### Проблема:

```
Error 400: redirect_uri_mismatch

The redirect URI in the request: http://localhost:4000/integrations/google/callback
does not match a registered redirect URI
```

### Причина:

- NestJS додає глобальний prefix `/api` до всіх routes
- Redirect URI в Google Cloud Console НЕ співпадає з фактичним

### Рішення:

**1. Перевір яка фактична URL:**

Backend логує OAuth redirect:
```typescript
@Get('google/callback')
googleCallback() {
  console.log('Callback URL:', req.url); // /api/integrations/google/callback
}
```

**2. Оновити .env:**

```bash
# НЕПРАВИЛЬНО:
GOOGLE_CALLBACK_URL=http://localhost:4000/integrations/google/callback

# ПРАВИЛЬНО (з /api):
GOOGLE_CALLBACK_URL=http://localhost:4000/api/integrations/google/callback
```

**3. Оновити Google Cloud Console:**

```
https://console.cloud.google.com/apis/credentials

→ OAuth 2.0 Client ID
→ Authorized redirect URIs:
   http://localhost:4000/api/integrations/google/callback  ← ДОДАЙ /api!
```

**4. Перезапустити backend:**

```bash
npx kill-port 4000
cd SEO-AI-Platform
pnpm dev
```

---

## 2. OAuth2Strategy requires clientID

### Проблема:

```bash
[Nest] ERROR [ExceptionHandler] OAuth2Strategy requires a clientID option
```

### Причина:

`GoogleStrategy` не в providers масиві `IntegrationsModule`.

### Рішення:

**Файл:** `apps/api/src/integrations/integrations.module.ts`

```typescript
import { GoogleStrategy } from './google.strategy';

@Module({
  imports: [PrismaModule],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    GoogleStrategy,  // ← ДОДАЙ ЦЕЙ РЯДОК!
  ],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
```

**Restart backend після зміни!**

---

## 3. Foreign key constraint failed

### Проблема:

```bash
[Nest] ERROR Foreign key constraint failed on the field: `Integration_organizationId_fkey`
```

### Причина:

```typescript
// Hardcoded organizationId не існує в БД:
const organizationId = '1'; // ❌ НЕ існує
```

### Рішення:

**1. Знайти РЕАЛЬНИЙ organizationId в БД:**

```bash
cd packages/db
npx prisma studio
# → http://localhost:5555
```

Відкрити таблицю `Organization`, скопіювати `id`:
```
cmi03mh7f0001nuvzjw3w1oq8
```

**2. Використати реальний UUID:**

```typescript
// apps/api/src/integrations/integrations.controller.ts

@Get('google/connect')
googleConnect() {
  // Використати UUID з БД:
  const organizationId = 'cmi03mh7f0001nuvzjw3w1oq8'; // ✅
  
  // АБО через req.user (якщо JWT працює):
  const organizationId = req.user.organizationId; // ✅ КРАЩЕ!
}
```

**TODO для production:**
- Передавати через OAuth state parameter
- Або брати з JWT (req.user.organizationId)

---

## 4. Access denied (403)

### Проблема:

```
403. That's an error.

Error: access_denied
The developer has limited access to this app.
```

### Причина:

OAuth app у **test mode**, а user не доданий до **Test Users**.

### Рішення:

**1. Відкрити Google Cloud Console:**

```
https://console.cloud.google.com/apis/credentials/consent
```

**2. Натиснути "OAuth consent screen"**

**3. Секція "Test users" → ADD USERS:**

```
Email: waltersimf@gmail.com  ← ТВІЙ TEST EMAIL
```

**4. Save**

**5. Спробувати OAuth знову**

**NOTE:** Limit: 100 test users, якщо потрібно більше → publish app.

---

## 5. refreshToken = NULL

### Проблема:

```typescript
{
  accessToken: 'ya29.a0...',
  refreshToken: null,  // ❌ NULL!
  profile: {...}
}
```

### Причина:

Google не повертає `refresh_token` якщо:
- Параметри OAuth неправильні
- User вже давав дозвіл (re-auth without force)

### Рішення:

**1. Використати `authorizationParams()` method:**

```typescript
// apps/api/src/integrations/google.strategy.ts

export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: ['email', 'profile', 'https://www.googleapis.com/auth/webmasters.readonly'],
    });
  }

  // ← ДОДАЙ ЦЕЙ METHOD!
  authorizationParams(): { [key: string]: string } {
    return {
      access_type: 'offline',  // ← CRITICAL!
      prompt: 'consent',       // ← FORCE re-consent
    };
  }

  async validate(accessToken, refreshToken, profile, done) {
    // refreshToken тепер працює! ✅
    done(null, { accessToken, refreshToken, profile });
  }
}
```

**2. Revoke access (якщо все ще NULL):**

```
https://myaccount.google.com/permissions

→ Знайти "Forgeline" → Remove Access
→ Спробувати OAuth знову
```

**3. Restart backend після змін!**

---

## 6. EADDRINUSE port 4000

### Проблема:

```bash
[Nest] ERROR Error: listen EADDRINUSE: address already in use :::4000
```

### Причина:

Старий backend процес не вбитий (zombie process).

### Рішення:

**Option 1: Kill port (швидко):**

```bash
npx kill-port 4000
```

**Option 2: Manual kill (Windows):**

```bash
# Знайти PID:
netstat -ano | findstr :4000

# Kill process:
taskkill /PID <PID> /F
```

**Option 3: Manual kill (Linux/Mac):**

```bash
# Знайти PID:
lsof -i :4000

# Kill process:
kill -9 <PID>
```

**Після kill → restart:**

```bash
cd SEO-AI-Platform
pnpm dev
```

---

## 7. Unique constraint failed **[NEW!]**

### Проблема:

```bash
[Nest] ERROR Invalid `this.prisma.integration.create()` invocation
Unique constraint failed on the fields: (`organizationId`,`provider`)
```

### Причина:

При повторній спробі OAuth → Integration record **вже існує** в БД для цієї `(organizationId, provider)` комбінації.

### Чому це відбувається:

```typescript
// integrations.service.ts
async create(data) {
  return this.prisma.integration.create({ data }); // ← ЗАВЖДИ CREATE!
}
```

Якщо user відключив і знову підключає Google → падає на unique constraint.

### Рішення:

**Варіант A: Видалити старі records (для dev):**

```bash
# 1. Відкрити Prisma Studio:
cd packages/db
npx prisma studio

# 2. Таблиця "Integration"
# 3. Видалити всі записи (або конкретний Google record)
# 4. Спробувати OAuth знову
```

**Варіант B: Змінити логіку на upsert (production):**

```typescript
// apps/api/src/integrations/integrations.service.ts

async createOrUpdate(organizationId: string, provider: string, data: any) {
  return this.prisma.integration.upsert({
    where: {
      organizationId_provider: { organizationId, provider },
    },
    update: {
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      tokenExpiry: data.tokenExpiry,
      scopes: data.scopes,
    },
    create: data,
  });
}
```

**Варіант C: Додати "Disconnect" функціонал (TODO v0.3):**

```typescript
// Frontend: Button "Disconnect"
<Button onClick={handleDisconnect}>Disconnect Google</Button>

// Backend: DELETE /api/integrations/:provider
@Delete(':provider')
async delete(@Req() req, @Param('provider') provider) {
  const organizationId = req.user.organizationId;
  return this.integrationsService.delete(organizationId, provider);
}
```

**Поточний workaround (dev):**

Просто видаляти records через Prisma Studio перед повторним тестом OAuth.

---

## 8. Next.js caching issues

### Проблема:

Зміни в коді не застосовуються, старі компоненти рендеряться.

### Причина:

Next.js кешує `.next` build folder.

### Рішення:

```bash
# 1. Зупинити dev server (Ctrl+C)

# 2. Видалити .next:
cd apps/web
rm -rf .next

# 3. Restart:
cd ../..
pnpm dev
```

**Auto-fix (додати в package.json):**

```json
{
  "scripts": {
    "dev": "rm -rf apps/web/.next && turbo run dev",
    "clean": "rm -rf apps/web/.next node_modules/.cache"
  }
}
```

---

## 9. Debug Checklist

### Коли OAuth не працює, перевір:

**Backend:**
- [ ] Docker containers running? (`docker ps`)
- [ ] Backend на port 4000? (`http://localhost:4000/api`)
- [ ] `.env` файл існує в root? (НЕ в `apps/api`)
- [ ] `GOOGLE_CLIENT_ID` правильний?
- [ ] `GOOGLE_CLIENT_SECRET` правильний?
- [ ] `GOOGLE_CALLBACK_URL` з `/api` prefix?
- [ ] `GoogleStrategy` в providers?
- [ ] `authorizationParams()` method є?
- [ ] Prisma migrations applied? (`prisma migrate dev`)

**Google Cloud Console:**
- [ ] OAuth 2.0 Client створений?
- [ ] Redirect URI має `/api` prefix?
- [ ] Test user доданий? (якщо test mode)
- [ ] Scopes правильні?

**Database:**
- [ ] PostgreSQL container працює?
- [ ] Organization record існує?
- [ ] `organizationId` правильний UUID?
- [ ] Integration table має unique constraint?

**OAuth Flow:**
- [ ] User redirects на Google?
- [ ] User бачить consent screen?
- [ ] Callback URL правильний?
- [ ] `refreshToken` не NULL?
- [ ] Tokens зберігаються в БД?

**Security (v0.2+):**
- [ ] Tokens зашифровані? (AES-256-GCM)
- [ ] `ENCRYPTION_KEY` в .env? (32+ chars)
- [ ] `JWT_SECRET` без fallback?
- [ ] `organizationId` через req.user?

---

## 🔧 Quick Commands

```bash
# Kill backend port:
npx kill-port 4000

# Start dev:
cd SEO-AI-Platform
pnpm dev

# Prisma Studio (view DB):
cd packages/db
npx prisma studio

# Test OAuth (browser):
http://localhost:4000/api/integrations/google/connect

# Clear Next.js cache:
cd apps/web && rm -rf .next

# Check running containers:
docker ps

# Restart Docker:
docker-compose down && docker-compose up -d
```

---

## 📝 Notes

- Завжди перевіряй backend logs при помилках
- Google може cache старі credentials → revoke access
- Test mode має limit 100 users
- `access_type: 'offline'` критичний для refresh tokens
- Unique constraints → треба upsert logic
- Token encryption обов'язковий для production

---

**Останнє оновлення:** 16.11.2025  
**Версія:** 1.1 (додано Unique constraint issue)

**Happy debugging! 🐛🔧**