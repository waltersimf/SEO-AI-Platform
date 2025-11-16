# 🔧 Google OAuth Integration - Troubleshooting Guide

**Дата:** 16.11.2025 (оновлено)  
**Версія:** v0.2  
**Статус:** ✅ ПОВНІСТЮ ПРАЦЮЄ

---

## 📋 Загальна Інформація

### Що зроблено:
- ✅ Google Cloud Console OAuth client
- ✅ NestJS GoogleStrategy з Passport
- ✅ OAuth flow end-to-end
- ✅ **Refresh tokens працюють** (authorizationParams method)
- ✅ Tokens збережені в БД
- ✅ GSC API integration

### Що працює:
- User клікає "Connect Google" → перенаправляється на Google
- User дає дозвіл → Google повертає на callback
- Backend отримує **access_token + refresh_token**
- Backend зберігає tokens → перенаправляє на dashboard
- Dashboard показує success message
- **GscService може робити запити до Google Search Console API**

---

## 🐛 Проблеми та Рішення (детально)

### 1️⃣ redirect_uri_mismatch

**Повна помилка:**
```
Error 400: redirect_uri_mismatch
The redirect_uri passed in the authorization request does not match 
an authorized redirect URI for the OAuth client ID.
```

**Діагностика:**
1. Backend логує: `🔍 GOOGLE_CALLBACK_URL: http://localhost:4000/api/integrations/google/callback`
2. Google повертає помилку з деталями:
   ```
   redirect_uri=http://localhost:4000/api/integrations/google/callback
   flowName=GeneralOAuthFlow
   ```
3. В Google Console було: `http://localhost:4000/integrations/google/callback` (БЕЗ `/api`)

**Причина:**
- NestJS має global prefix `/api` встановлений в `main.ts`
- `.env` файл містив URL БЕЗ цього префіксу
- GoogleStrategy читав з `.env`, але URL не співпадав з реальним

**Рішення:**

**Крок 1:** Оновити `.env` в ROOT проекту:
```bash
# Root: SEO-AI-Platform/.env

# Було:
GOOGLE_CALLBACK_URL=http://localhost:4000/integrations/google/callback

# Стало:
GOOGLE_CALLBACK_URL=http://localhost:4000/api/integrations/google/callback
```

**Крок 2:** Оновити `apps/api/src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env', // ← КРИТИЧНО для монорепо!
    }),
    // ... інші модулі
  ],
})
export class AppModule {}
```

**Крок 3:** Google Cloud Console:
- Перейти: APIs & Services → Credentials → Forgeline Web App
- Authorized redirect URIs → Додати ОБА:
  - `http://localhost:4000/api/integrations/google/callback`
  - `https://localhost:4000/api/integrations/google/callback`
- **ВАЖЛИВО:** Натиснути SAVE і зачекати 1-2 хвилини

**Крок 4:** Перезапустити backend:
```bash
# З root проекту:
cd SEO-AI-Platform
pnpm dev
```

**Перевірка що спрацювало:**
```bash
# В логах backend має з'явитись:
🔍 GOOGLE_CALLBACK_URL: http://localhost:4000/api/integrations/google/callback
```

---

### 2️⃣ OAuth2Strategy requires a clientID option

**Повна помилка:**
```
Error [ExceptionsHandler] OAuth2Strategy requires a clientID option
at Strategy.OAuth2Strategy (/node_modules/passport-oauth2/lib/strategy.js:87:34)
at new Strategy (/node_modules/passport-google-oauth20/lib/strategy.js:52:18)
```

**Причина:**
- `GoogleStrategy` не був доданий до `providers` в `IntegrationsModule`
- Passport не міг створити strategy instance

**Рішення:**

**Файл:** `apps/api/src/integrations/integrations.module.ts`

```typescript
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { PrismaModule } from '../prisma/prisma.module';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { GoogleStrategy } from './google.strategy'; // ← Import

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'google' }), // ← Додати
  ],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    GoogleStrategy, // ← КРИТИЧНО! Додати в providers
  ],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
```

---

### 3️⃣ Foreign key constraint violated

**Повна помилка:**
```
PrismaClientKnownRequestError:
Invalid `this.prisma.integration.create()` invocation
Foreign key constraint violated: `integrations_organizationId_fkey (index)`
Argument `organization` is missing.
```

**Причина:**
- Controller використовував `organizationId = '1'` (integer як string)
- В БД organizationId - це UUID
- Організації з таким ID не існувало

**Рішення:**

**Крок 1:** Знайти реальний organizationId:
```bash
cd packages/db
npx prisma studio
```
Відкриється http://localhost:5555 → Organization → скопіювати повний UUID

**Крок 2:** Оновити controller:

**Файл:** `apps/api/src/integrations/integrations.controller.ts`

```typescript
@Get('google/callback')
@UseGuards(AuthGuard('google'))
async googleCallback(@Req() req, @Res() res) {
  const { accessToken, refreshToken, email, name } = req.user;

  // Було:
  // const organizationId = '1'; // ❌ НЕПРАВИЛЬНО
  
  // Стало:
  const organizationId = 'cmi03mh7f0001nuvzjw3w1oq8'; // ✅ Реальний UUID
  // TODO: get from state param or JWT session

  // Save integration to DB
  await this.integrationsService.create({
    organizationId,
    provider: 'google',
    accessToken,
    refreshToken,
    scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    metadata: { email, name },
  });

  // Redirect back to frontend
  res.redirect(`${process.env.FRONTEND_URL}/dashboard?google=connected`);
}
```

**TODO для production:**
- Передавати organizationId через OAuth `state` parameter
- Або витягувати з JWT session (req.user.organizationId)

---

### 4️⃣ Access Denied (403: access_denied)

**Повна помилка:**
```
Доступ заблоковано: додаток Forgeline не пройшов 
процедуру підтвердження від Google
```

**Причина:**
- OAuth app в Testing mode
- Test users не додані
- Навіть власник проекту не може авторизуватись без додавання в test users

**Рішення:**

**Google Cloud Console:**
1. APIs & Services → OAuth consent screen → Audience
2. Test users → "+ ADD USERS"
3. Додати email: `waltersimf@gmail.com` (або будь-який інший)
4. Save changes

**Обмеження Testing Mode:**
- Максимум 100 test users
- Працює тільки для доданих users
- Для production треба пройти Google verification

**Для Production:**
1. Publishing status → "In Production"
2. Submit for verification
3. Пройти Google review process (2-6 тижнів)

---

### 5️⃣ Port Already in Use (EADDRINUSE)

**Повна помилка:**
```
Error: listen EADDRINUSE: address already in use :::4000
```

**Причина:**
- Старий NestJS процес все ще працює
- Ctrl+C не завжди вбиває процес повністю
- В монорепо з turbo можуть залишатись zombie процеси

**Рішення:**

**Спосіб 1:** Kill port (швидко):
```bash
npx kill-port 4000

# Або обидва порти разом:
npx kill-port 3000 4000
```

**Спосіб 2:** Вручну в Windows:
1. Task Manager (Ctrl+Shift+Esc)
2. Details tab → Знайти node.exe
3. End task

**Спосіб 3:** PowerShell:
```powershell
# Знайти процес на порту:
netstat -ano | findstr :4000

# Kill процес (замінити PID):
taskkill /PID 12345 /F
```

**Після kill:**
```bash
cd SEO-AI-Platform
pnpm dev
```

---

### 6️⃣ refreshToken = NULL (КРИТИЧНА ПРОБЛЕМА!) 🔥

**Повна помилка:**
```
Prisma Studio → Integration table:
- accessToken: "ya29.a0ARW..." ✅
- refreshToken: NULL ❌
- tokenExpiry: NULL
```

**Діагностика (спроба #1-5):**

Спробували різні підходи що **НЕ спрацювали**:

1. ❌ Додати `access_type: 'offline'` і `prompt: 'consent'` в `super()` конструктора GoogleStrategy
   - Результат: Параметри ігнорувались

2. ❌ Додати як окремі властивості в GoogleStrategy:
   ```typescript
   super({
     // ...
     accessType: 'offline',
     prompt: 'consent'
   })
   ```
   - Результат: TypeScript помилка, параметри не підтримуються

3. ❌ Передати через scope:
   ```typescript
   scope: [
     'email',
     'profile',
     'https://www.googleapis.com/auth/webmasters.readonly',
     'access_type=offline' // ❌ НЕ ПРАЦЮЄ
   ]
   ```

4. ❌ Використати `passReqToCallback: true`:
   - Результат: Не впливає на OAuth параметри

5. ❌ Очистити кеш Google OAuth дозволів та повторити:
   - https://myaccount.google.com/permissions
   - Результат: refreshToken все ще NULL

**Причина (знайдено після пошуку):**

В **NestJS з PassportStrategy** параметри `access_type` і `prompt` треба передавати **НЕ в super()**, а через **окремий метод `authorizationParams()`**!

Це documented behavior в passport-google-oauth20, але не очевидно для NestJS.

**ПРАВИЛЬНЕ РІШЕННЯ:**

**Файл:** `apps/api/src/integrations/google.strategy.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    console.log('🔍 GOOGLE_CALLBACK_URL:', configService.get('GOOGLE_CALLBACK_URL'));
    
    super({
      clientID: configService.get('GOOGLE_CLIENT_ID'),
      clientSecret: configService.get('GOOGLE_CLIENT_SECRET'),
      callbackURL: configService.get('GOOGLE_CALLBACK_URL'),
      scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/webmasters.readonly',
      ],
      // ❌ НЕ ТУТ:
      // access_type: 'offline',
      // prompt: 'consent',
    });
  }

  // ✅ ДОДАЙ ЦЕЙ МЕТОД:
  authorizationParams(): { [key: string]: string } {
    return {
      access_type: 'offline',
      prompt: 'consent',
    };
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, emails, displayName } = profile;

    const user = {
      googleId: id,
      email: emails[0].value,
      name: displayName,
      accessToken,
      refreshToken,
    };

    done(null, user);
  }
}
```

**Що робить `authorizationParams()`:**

1. Passport викликає цей метод при формуванні OAuth redirect URL
2. Параметри додаються до query string:
   ```
   https://accounts.google.com/o/oauth2/v2/auth?
   client_id=...&
   redirect_uri=...&
   scope=...&
   access_type=offline&      ← Додається з authorizationParams()
   prompt=consent            ← Додається з authorizationParams()
   ```

3. `access_type=offline` → Google видає refresh_token
4. `prompt=consent` → Google показує consent screen кожен раз (гарантує refresh_token)

**Перевірка після фіксу:**

1. Видалити старий запис з Integration table (Prisma Studio)
2. Відкликати доступ в Google: https://myaccount.google.com/permissions
3. Перезапустити backend:
   ```bash
   npx kill-port 4000
   pnpm dev
   ```
4. OAuth flow в Incognito:
   ```
   http://localhost:4000/api/integrations/google/connect
   ```
5. Перевірити Prisma Studio:
   ```
   accessToken: "ya29.a0ARW..." ✅
   refreshToken: "1//09QhrWZj..." ✅  ← ПРАЦЮЄ!
   tokenExpiry: null
   ```

**Результат:**
```
✅ Integration found: { hasAccessToken: true, hasRefreshToken: true }
```

**Важливі примітки:**

- **НЕ** використовувати `approvalPrompt: 'force'` - застарілий параметр
- Використовувати `prompt: 'consent'` замість цього
- Google може НЕ видати refresh_token якщо користувач вже давав дозвіл раніше
- Для гарантованого refresh_token: відкликати доступ + `prompt: 'consent'`

**Джерела:**
- https://github.com/jaredhanson/passport-google-oauth2/issues/115
- https://stackoverflow.com/questions/56209863/no-refresh-token-with-nestjs-and-passportjs

---

### 7️⃣ Next.js кешування (.next не оновлюється)

**Проблема:**
```
Frontend показує старий код після змін
Файли оновлені, але браузер бачить старий код
Hard refresh не допомагає
```

**Причина:**
- Next.js кешує білд в папці `.next`
- При змінах коду іноді кеш не інвалюється
- Особливо після великих рефакторингів

**Рішення:**

**Спосіб 1:** Видалити `.next` папку:
```bash
# Зупинити dev server (Ctrl+C)

# Windows (PowerShell):
cd apps/web
Remove-Item -Recurse -Force .next

# Або через провідник:
apps/web/.next → Видалити папку

# Перезапустити:
cd ../../
pnpm dev
```

**Спосіб 2:** Clean restart скрипт:
```json
// package.json
{
  "scripts": {
    "clean": "rm -rf apps/web/.next",
    "dev:clean": "pnpm clean && pnpm dev"
  }
}
```

**Коли це потрібно:**
- Після змін в `next.config.js`
- Після великих рефакторингів
- Коли hard refresh не допомагає
- При дивних помилках кешування

---

### 8️⃣ PrismaService not found in GscService

**Повна помилка:**
```
src/gsc/gsc.service.ts:12:34 - error TS2339: 
Property 'prisma' does not exist on type 'GscService'.
```

**Причина:**
- `PrismaService` не було ін'єктовано в конструктор
- Спроба використати `this.prisma` без декларації

**Рішення:**

**Файл:** `apps/api/src/gsc/gsc.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { IntegrationsService } from '../integrations/integrations.service';
import { PrismaService } from '../prisma/prisma.service'; // ← Import

@Injectable()
export class GscService {
  constructor(
    private integrationsService: IntegrationsService,
    private prisma: PrismaService, // ← Додати в constructor
  ) {}

  async getMetrics(organizationId: string, siteUrl: string, ...) {
    // Тепер this.prisma працює ✅
    const integration = await this.prisma.integration.findUnique({...});
  }
}
```

**Шлях до PrismaService:**
- З `src/gsc/` до `src/prisma/` = `../prisma/prisma.service`
- НЕ `../../prisma/` (дві крапки - забагато)
- НЕ `./prisma/` (одна крапка - замало)

---

### 9️⃣ Frontend fetch URL issues

**Проблема:**
```
Browser Console:
Failed to load resource: http://localhost:4000/api/gsc/metric...ps://forgeline.io:1
500 (Internal Server Error)
```

**Причина:**
- URL параметри неправильно кодувались
- Спецсимволи `://` в `https://` ламали URL
- Проблема з конкатенацією strings

**Невдалі спроби:**

1. ❌ Пряма конкатенація:
   ```typescript
   fetch('http://localhost:4000/api/gsc/metrics?siteUrl=https://forgeline.io')
   ```
   Результат: URL ламався через `://`

2. ❌ Manual encoding:
   ```typescript
   const encoded = encodeURIComponent('https://forgeline.io')
   fetch(`...?siteUrl=${encoded}`)
   ```
   Результат: Працює, але не elegant

**ПРАВИЛЬНЕ РІШЕННЯ:**

**Файл:** `apps/web/src/components/dashboard/gsc-metrics-card.tsx`

```typescript
const fetchMetrics = async () => {
  try {
    const token = localStorage.getItem('token');
    
    // ✅ Використовуємо URLSearchParams:
    const params = new URLSearchParams({
      siteUrl: 'https://forgeline.io'
    });

    const url = `http://localhost:4000/api/gsc/metrics?${params.toString()}`;
    
    const response = await fetch(url, {
      headers: { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch metrics');
    }

    const result = await response.json();
    setData(result.rows || []);
  } catch (err) {
    console.error('GSC Metrics Error:', err);
    setError(err instanceof Error ? err.message : 'Something went wrong');
  }
};
```

**Чому URLSearchParams:**
- Автоматично кодує спецсимволи
- Правильно обробляє `://`, `?`, `&`, etc
- Standard Web API
- Type-safe з TypeScript

---

## 🎯 Правильний Workflow OAuth

### Startup Sequence:

1. **Перевірити .env:**
```bash
cat .env | grep GOOGLE
```
Має бути:
```
GOOGLE_CLIENT_ID=505446410132-...
GOOGLE_CLIENT_SECRET=GOCSPX-...
GOOGLE_CALLBACK_URL=http://localhost:4000/api/integrations/google/callback
```

2. **Запустити з root:**
```bash
# ЗАВЖДИ з root проекту!
cd SEO-AI-Platform
pnpm dev
```

3. **Перевірити логи:**
```
🔍 GOOGLE_CALLBACK_URL: http://localhost:4000/api/integrations/google/callback
✅ Database connected
🚀 Server running on http://localhost:4000/api
▲ Next.js running on http://localhost:3000
```

4. **Тестувати OAuth:**
- Incognito window: `http://localhost:4000/api/integrations/google/connect`
- Вибрати test user акаунт
- Дати дозвіл
- Має перенаправити на: `http://localhost:3000/dashboard?google=connected`

5. **Перевірити результат:**
```bash
cd packages/db
npx prisma studio
# http://localhost:5555
# Integration table → має бути запис з обома токенами ✅
```

---

## 📊 Debug Checklist

### Якщо OAuth не працює:

**1. Backend запущено?**
```bash
curl http://localhost:4000/api
# Має повернути: Cannot GET /api
```

**2. .env правильний?**
```bash
# Перевірити шлях:
cat .env | grep GOOGLE_CALLBACK_URL
# Має бути: http://localhost:4000/api/integrations/google/callback
```

**3. Google Console налаштовано?**
- Redirect URIs включають `/api` префікс?
- Test users додані?
- OAuth client enabled?

**4. Backend читає .env?**
```bash
# В логах backend має бути:
🔍 GOOGLE_CALLBACK_URL: http://localhost:4000/api/integrations/google/callback
```

**5. organizationId існує?**
```bash
cd packages/db
npx prisma studio
# Organization table → має бути хоча б 1 запис
```

**6. refreshToken працює?**
```bash
# Prisma Studio → Integration table:
# refreshToken: "1//09Qhr..." ← Має бути НЕ NULL!
```

**7. GoogleStrategy має authorizationParams()?**
```typescript
// apps/api/src/integrations/google.strategy.ts
authorizationParams(): { [key: string]: string } {
  return {
    access_type: 'offline',
    prompt: 'consent',
  };
}
```

**8. Frontend URL кодується правильно?**
```typescript
// Використовувати URLSearchParams, а не пряму конкатенацію
const params = new URLSearchParams({ siteUrl: 'https://...' });
```

---

## 🔐 Security Notes

### Production TODOs:

1. **Environment Variables:**
   - Never commit .env to git
   - Use secrets manager (Vercel/Railway/AWS)
   - Rotate credentials regularly

2. **OAuth State Parameter:**
   - Implement CSRF protection
   - Pass organizationId через state
   - Verify state on callback

3. **Token Storage:**
   - ⚠️ **Encrypt refresh tokens at rest (AES-256)**
   - Implement token rotation
   - Setup token refresh cron job

4. **Error Handling:**
   - Don't expose error details to client
   - Log errors properly (Winston/Pino)
   - Setup error monitoring (Sentry)

5. **JWT Secret:**
   - ⚠️ Remove fallback from jwt.strategy.ts
   - Require explicit JWT_SECRET in production
   - Use strong random secret (min 32 chars)

---

## 📁 File Structure Reference

```
SEO-AI-Platform/
├── .env                                    ← Environment variables (root)
├── apps/
│   ├── api/
│   │   └── src/
│   │       ├── app.module.ts               ← ConfigModule з envFilePath
│   │       ├── main.ts                     ← app.setGlobalPrefix('api')
│   │       ├── integrations/
│   │       │   ├── integrations.module.ts  ← GoogleStrategy в providers
│   │       │   ├── integrations.controller.ts ← OAuth endpoints
│   │       │   ├── integrations.service.ts
│   │       │   └── google.strategy.ts      ← authorizationParams() method
│   │       ├── gsc/
│   │       │   ├── gsc.module.ts
│   │       │   ├── gsc.controller.ts       ← /api/gsc/metrics
│   │       │   └── gsc.service.ts          ← getMetrics, refreshAccessToken
│   │       └── prisma/
│   │           ├── prisma.module.ts
│   │           └── prisma.service.ts
│   └── web/
│       └── src/
│           └── components/dashboard/
│               └── gsc-metrics-card.tsx    ← URLSearchParams
└── packages/
    └── db/
        └── prisma/
            └── schema.prisma               ← Integration model
```

---

## 🚀 Quick Commands Reference

```bash
# Kill ports
npx kill-port 3000 4000

# Start dev (from root!)
cd SEO-AI-Platform
pnpm dev

# Prisma Studio
cd packages/db && npx prisma studio

# Clean Next.js cache
cd apps/web && rm -rf .next

# Full restart
npx kill-port 3000 4000 && cd SEO-AI-Platform && pnpm dev

# Check logs
# Terminal → Backend api tab + Frontend web tab
```

---

## 💡 Key Learnings

1. **authorizationParams() method:**
   - В NestJS PassportStrategy параметри OAuth треба передавати через цей метод
   - НЕ в super() конструктора
   - Це documented behavior, але не очевидно

2. **Refresh Token вимагає:**
   - `access_type: 'offline'` в authorizationParams()
   - `prompt: 'consent'` для гарантованого видачі
   - Користувач має НЕ мати попереднього активного дозволу

3. **Монорепо .env:**
   - Файл в root
   - NestJS в `apps/api` потребує `envFilePath: '../../.env'`

4. **Global Prefix:**
   - NestJS має `/api` prefix
   - Всі URLs включають цей префікс
   - Google OAuth callback URL теж має включати

5. **Passport Strategies:**
   - Треба додавати в `providers` модуля
   - PassportModule.register() потрібен
   - @Injectable() обов'язково на Strategy класі

6. **Google Testing Mode:**
   - Test users треба додавати вручну
   - Limit 100 users
   - Для production треба verification

7. **UUID vs Integer:**
   - Prisma models використовують UUID для ID
   - Не можна використовувати '1', '2', etc
   - Завжди копіювати реальний UUID з БД

8. **URLSearchParams для fetch:**
   - Автоматично кодує спецсимволи
   - Уникає проблем з `:`, `/`, `?` в параметрах
   - Standard Web API

9. **Next.js кешування:**
   - `.next` папку треба видаляти при дивних проблемах
   - Hard refresh не завжди допомагає
   - Clean restart - найнадійніший спосіб

10. **Dependency Injection в NestJS:**
    - PrismaService треба явно ін'єктувати в constructor
    - Import path має бути правильний (`../` vs `../../`)
    - TypeScript не дозволить забути про це

---

## 📞 Next Steps

**Для наступного чату:**

1. **Критичні TODO v0.2:**
   - ⚠️ Token encryption (AES-256) - 40 хв
   - ⚠️ Fix hardcoded organizationId - 30 хв
   - ⚠️ Remove JWT_SECRET fallback - 5 хв

2. **Продовжити v0.2:**
   - Dashboard UI improvements
   - Better error messages
   - Loading states

3. **v0.3 Planning:**
   - Task Manager models
   - AI Claude integration
   - Socket.io notifications

**Готовність до v0.3:**
- OAuth infrastructure повністю готова ✅
- Refresh tokens працюють ✅
- GscService базово працює ✅
- Можна додавати більше providers (Ahrefs, SEMrush)
- Task Management може використовувати integrations

---

**Версія гайду:** 2.0  
**Останнє оновлення:** 16.11.2025, 14:30  
**Статус:** ✅ Всі відомі проблеми вирішені