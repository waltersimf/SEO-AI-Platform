# 🔧 Google OAuth Integration - Troubleshooting Guide

**Дата:** 15.11.2025  
**Версія:** v0.2  
**Статус:** ✅ Працює

---

## 📋 Загальна Інформація

### Що зроблено:
- ✅ Google Cloud Console OAuth client
- ✅ NestJS GoogleStrategy з Passport
- ✅ OAuth flow end-to-end
- ✅ Tokens збережені в БД

### Що працює:
- User клікає "Connect Google" → перенаправляється на Google
- User дає дозвіл → Google повертає на callback
- Backend зберігає tokens → перенаправляє на dashboard
- Dashboard показує success message

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
    });
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
```

4. **Тестувати OAuth:**
- Incognito window: `http://localhost:4000/api/integrations/google/connect`
- Вибрати test user акаунт
- Дати дозвіл
- Має перенаправити на: `http://localhost:3000/dashboard?google=connected`

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

**6. Prisma Studio для перевірки:**
```bash
cd packages/db
npx prisma studio
# http://localhost:5555
# Integration table → після успішного OAuth має з'явитись запис
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
   - Encrypt refresh tokens at rest
   - Implement token rotation
   - Setup token refresh cron job

4. **Error Handling:**
   - Don't expose error details to client
   - Log errors properly (Winston/Pino)
   - Setup error monitoring (Sentry)

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
│   │       └── integrations/
│   │           ├── integrations.module.ts  ← GoogleStrategy в providers
│   │           ├── integrations.controller.ts ← OAuth endpoints
│   │           ├── integrations.service.ts
│   │           └── google.strategy.ts      ← Passport GoogleStrategy
│   └── web/                                ← Next.js frontend
└── packages/
    └── db/
        └── prisma/
            └── schema.prisma               ← Integration model
```

---

## 🚀 Quick Commands Reference

```bash
# Kill port
npx kill-port 4000

# Start dev (from root!)
pnpm dev

# Prisma Studio
cd packages/db && npx prisma studio

# Check logs
# Terminal → Backend api tab

# Test OAuth
# Browser Incognito: http://localhost:4000/api/integrations/google/connect
```

---

## 💡 Key Learnings

1. **Монорепо .env:**
   - Файл в root
   - NestJS в `apps/api` потребує `envFilePath: '../../.env'`

2. **Global Prefix:**
   - NestJS має `/api` prefix
   - Всі URLs включають цей префікс
   - Google OAuth callback URL теж має включати

3. **Passport Strategies:**
   - Треба додавати в `providers` модуля
   - PassportModule.register() потрібен
   - @Injectable() обов'язково на Strategy класі

4. **Google Testing Mode:**
   - Test users треба додавати вручну
   - Limit 100 users
   - Для production треба verification

5. **UUID vs Integer:**
   - Prisma models використовують UUID для ID
   - Не можна використовувати '1', '2', etc
   - Завжди копіювати реальний UUID з БД

---

## 📞 Next Steps

**Для наступного чату:**

1. **Продовжити v0.2:**
   - Dashboard UI з integrations management
   - Socket.io для real-time notifications
   - Toast notifications для OAuth events

2. **Виправити TODOs:**
   - organizationId через state parameter
   - Token refresh mechanism
   - Error handling improvements

3. **Testing:**
   - Тестувати з різними Google accounts
   - Перевірити token expiry scenarios
   - Edge cases handling

**Готовність до v0.3:**
- OAuth infrastructure готова ✅
- Можна додавати більше providers (Ahrefs, SEMrush)
- Task Management може використовувати integrations
