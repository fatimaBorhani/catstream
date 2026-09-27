# StreamHub Server

بک‌اند پروژه‌ی StreamHub. تا فاز ۱: یه سرور Express با health-check، و لاگین/ساین‌آپ
واقعی (SQLite + Prisma + bcrypt + JWT تو یه کوکی httpOnly).

## راه‌اندازی

1. `.env.example` رو کپی کن و اسمش رو بذار `.env`. مقدار `JWT_SECRET` رو با یه رشته‌ی
   تصادفی دلخواه عوض کن (هرچی باشه کافیه، فقط جایی به اشتراک نذارش). `DATABASE_URL`
   رو دست نزن - یه فایل SQLite لوکاله، نیازی به نصب/اکانت جایی نداره.

2. پکیج‌ها رو نصب کن:
   ```
   npm install
   ```

3. Prisma Client رو بساز (از رو `schema.prisma` کد JS می‌سازه):
   ```
   npx prisma generate
   ```

4. دیتابیس رو واقعاً بساز (این دستور فایل `dev.db` رو با جدول `User` می‌سازه؛
   هر بار مدلی به schema اضافه شد، دوباره همین دستور رو با یه اسم جدید می‌زنیم):
   ```
   npx prisma migrate dev --name init
   ```

5. سرور رو بالا بیار:
   ```
   npm run dev
   ```

   اگه همه‌چی درست بود، تو ترمینال می‌بینی `StreamHub API running on http://localhost:4000`،
   و تو مرورگر `http://localhost:4000/health` باید `{"status":"ok"}` بده.

## endpoint های لاگین (فاز ۱)

- `POST /api/auth/signup` — بدنه: `{ username, email, name, password }`
- `POST /api/auth/login` — بدنه: `{ username, password }`
- `POST /api/auth/logout`
- `GET /api/auth/me` — کاربر لاگین‌کرده‌ی فعلی رو از رو کوکی برمی‌گردونه

## ساختار پوشه‌ها

```
server/
  prisma/
    schema.prisma        ← مدل‌های دیتابیس (User)
  src/
    app.js                ← تنظیمات Express (middleware، route ها)
    index.js               ← نقطه‌ی شروع، بالا آوردن سرور رو پورت
    lib/
      prisma.js            ← نمونه‌ی واحد PrismaClient
      jwt.js                ← امضا/چک کردن توکن
    middleware/
      requireAuth.js        ← چک کردن کوکی لاگین رو route های محافظت‌شده
    routes/
      auth.js                ← signup/login/logout/me
  .env                    ← خودت می‌سازی، تو گیت نمی‌ره
  .env.example            ← نمونه‌ی .env
```
