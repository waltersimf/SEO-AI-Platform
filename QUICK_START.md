# ⚡ Forgeline - Quick Start (v0.1)

**Для тих хто хоче швидко побачити результат! 🚀**

---

## 📥 Download Files

Всі файли в `/mnt/user-data/outputs/`

**Важливо:** Файли мають "flat" структуру з префіксами.  
Потрібно організувати. Див. `FILE_ORGANIZATION_GUIDE.md`

---

## 🏃‍♂️ Quick Commands

```bash
# 1. Організуй файли (ручно або через скрипт)
# Див. FILE_ORGANIZATION_GUIDE.md

# 2. Install
cd forgeline
pnpm install

# 3. Environment
cp .env.example .env

# 4. Docker
docker-compose up -d

# 5. Database
cd packages/db
pnpm prisma generate
pnpm prisma migrate dev --name init

# 6. Run
cd ../..
pnpm dev

# 7. Test
# Відкрий http://localhost:3000
# Signup → Login → Dashboard
```

---

## ✅ Success Criteria

Якщо бачиш:

1. ✅ Signup працює → Organization створена
2. ✅ Login працює → JWT в localStorage
3. ✅ Dashboard з sidebar
4. ✅ Mobile responsive

**Готово! v0.1 Complete! 🎉**

---

## 📚 Детальні інструкції

Повний гайд: `V0.1_TESTING_GUIDE.md`

---

## 🆘 Help

**Docker не працює:**
```bash
docker-compose down
docker-compose up -d
```

**Port зайнятий:**
```bash
# Mac/Linux
lsof -ti:3000 | xargs kill -9
lsof -ti:4000 | xargs kill -9
```

**Prisma помилка:**
```bash
cd packages/db
pnpm prisma generate
```

---

**Time to first run:** ~15 хвилин  
**Next:** v0.2 Google OAuth (6 днів)

**Let's ship! 🚀**
