import { Router } from 'express'
import prisma from '../lib/prisma.js'
import requireAuth from '../middleware/requireAuth.js'

const router = Router()

// همه‌جا فقط requireAuth داریم چون فالو کردن معنی نداره بدون لاگین بودن - و req.userId
// از توکن کوکی میاد (نه از body)، دقیقاً همون الگوی auth.js

// لیست id ی استریمرهایی که کاربر لاگین‌شده فالو کرده - AuthContext یه‌بار موقع بالا اومدن
// اپ (و بعد از هر لاگین) این رو می‌گیره تا بدونه چی رو "فالو شده" نشون بده
router.get('/', requireAuth, async (req, res) => {
  const follows = await prisma.follow.findMany({
    where: { userId: req.userId },
    select: { streamerId: true },
  })
  res.json({ streamerIds: follows.map((follow) => follow.streamerId) })
})

// فالو کردن. از upsert استفاده می‌کنیم نه create ساده، چون اگه کاربر دوبار پشت‌سرهم کلیک
// کنه (مثلاً قبل از جواب اولی) نباید خطای "قبلاً فالو کردی" بگیره - همون رکورد قبلی می‌مونه
router.post('/:streamerId', requireAuth, async (req, res) => {
  // فالو کردن کانال خودت بی‌معنیه (و عدد فالوور رو الکی بالا می‌بره). این چک سمت سرور
  // انجام می‌شه نه فقط تو UI - چون مخفی کردن یه دکمه جلوی درخواست مستقیم به API رو
  // نمی‌گیره، و همین ردیف بی‌معنی بعداً تو نوار پیشرفتِ هدف (فاز ۱۱) هم اثر می‌ذاشت
  const ownChannel = await prisma.streamer.findUnique({
    where: { id: req.params.streamerId },
    select: { userId: true },
  })
  if (ownChannel && ownChannel.userId === req.userId) {
    return res.status(400).json({ error: 'You cannot follow your own channel' })
  }

  try {
    await prisma.follow.upsert({
      where: {
        userId_streamerId: { userId: req.userId, streamerId: req.params.streamerId },
      },
      update: {},
      create: { userId: req.userId, streamerId: req.params.streamerId },
    })
    res.status(201).json({ ok: true })
  } catch (error) {
    // P2003 یعنی streamerId ی فرستاده‌شده اصلاً تو دیتابیس وجود نداره (foreign key نقض شده)
    if (error.code === 'P2003') {
      return res.status(404).json({ error: 'Streamer not found' })
    }
    console.error(error)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// آنفالو کردن. deleteMany به‌جای delete چون اگه اصلاً فالو نکرده بود هم خطا نده - آنفالوِ
// چیزی که فالو نیستی باید بی‌خطر باشه، نه یه 404 عجیب برگردونه
router.delete('/:streamerId', requireAuth, async (req, res) => {
  await prisma.follow.deleteMany({
    where: { userId: req.userId, streamerId: req.params.streamerId },
  })
  res.json({ ok: true })
})

export default router
