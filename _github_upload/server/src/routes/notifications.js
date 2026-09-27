import { Router } from 'express'
import prisma from '../lib/prisma.js'
import requireAuth from '../middleware/requireAuth.js'

const router = Router()

// از هر منبع حداکثر این تعداد رویداد می‌گیریم، و آخرش کل لیست به همین تعداد بریده می‌شه.
// بیشتر از این، هم منو رو بی‌خودی بلند می‌کنه هم کوئری‌ها رو سنگین
const MAX_ITEMS = 8

// ویدیوی قدیمی‌تر از این چند روز دیگه «خبر» نیست، حتی اگه هنوز سین نشده باشه
const NEW_VIDEO_DAYS = 7

// فاز ۲۲: نوتیفیکیشن‌ها از خودِ رویدادهای واقعیِ موجود ساخته می‌شن، نه از یه جدول جدا
// (دلیلش کنار notificationsSeenAt تو schema.prisma توضیح داده شده).
//
// سه منبع داریم و رفتار «سین شدن»شون یکی نیست:
//   کامنت و ویدیو - رویدادهای نقطه‌ایِ گذشته‌ن، createdAt دارن و تا وقتی سین نشدن ناخونده‌ن
//   لایو - یه حالتِ جاریه، نه یه رویداد گذشته: تا وقتی کانال لایوعه تو لیست می‌مونه و به
//   محض آفلاین شدن خودش از لیست غیب می‌شه، بدون اینکه لازم باشه جایی پاکش کنیم
router.get('/', requireAuth, async (req, res) => {
  const me = await prisma.user.findUnique({
    where: { id: req.userId },
    select: { notificationsSeenAt: true },
  })
  if (!me) {
    return res.status(404).json({ error: 'User not found' })
  }

  const seenAt = me.notificationsSeenAt
  // اگه هیچ‌وقت زنگوله رو باز نکرده، همه‌چی ناخونده‌ست
  function isUnread(happenedAt) {
    return !seenAt || new Date(happenedAt) > new Date(seenAt)
  }

  const myStreamer = await prisma.streamer.findUnique({
    where: { userId: req.userId },
    select: { id: true, username: true },
  })

  const follows = await prisma.follow.findMany({
    where: { userId: req.userId },
    select: { streamerId: true },
  })
  const followedIds = follows.map((follow) => follow.streamerId)

  // کامنت‌های زیر کانال خودت. کامنت‌های خودت کنار گذاشته می‌شن - خبر دادن به کسی از
  // کاری که همین الان خودش کرده بی‌معنیه
  const comments = myStreamer
    ? await prisma.comment.findMany({
        where: { streamerId: myStreamer.id, authorId: { not: req.userId } },
        orderBy: { createdAt: 'desc' },
        take: MAX_ITEMS,
        include: { author: { select: { username: true, avatarImage: true } } },
      })
    : []

  // ویدیوهای تازه‌ی کانال‌هایی که فالو کردی
  const cutoff = new Date(Date.now() - NEW_VIDEO_DAYS * 24 * 60 * 60 * 1000)
  const videos =
    followedIds.length > 0
      ? await prisma.video.findMany({
          where: { streamerId: { in: followedIds }, createdAt: { gte: cutoff } },
          orderBy: { createdAt: 'desc' },
          take: MAX_ITEMS,
          include: { streamer: { select: { username: true, avatarImage: true } } },
        })
      : []

  // کانال‌های فالوشده‌ای که همین الان لایون
  const liveStreamers =
    followedIds.length > 0
      ? await prisma.streamer.findMany({
          where: { id: { in: followedIds }, isLive: true },
          select: {
            id: true,
            username: true,
            avatarImage: true,
            streamTitle: true,
            liveSince: true,
          },
        })
      : []

  const liveItems = liveStreamers.map((streamer) => ({
    id: `live-${streamer.id}`,
    type: 'live',
    title: `${streamer.username} is live now`,
    detail: streamer.streamTitle,
    avatarImage: streamer.avatarImage,
    link: `/channel/${streamer.username}`,
    // liveSince ممکنه رو دیتای seed خالی باشه؛ اون‌وقت به‌عنوان خبرِ خونده‌شده رفتار می‌کنه
    createdAt: streamer.liveSince,
    isUnread: streamer.liveSince ? isUnread(streamer.liveSince) : false,
  }))

  const commentItems = comments.map((comment) => ({
    id: `comment-${comment.id}`,
    type: 'comment',
    title: `${comment.author.username} commented on your channel`,
    detail: comment.content,
    avatarImage: comment.author.avatarImage,
    link: `/channel/${myStreamer.username}`,
    createdAt: comment.createdAt,
    isUnread: isUnread(comment.createdAt),
  }))

  const videoItems = videos.map((video) => ({
    id: `video-${video.id}`,
    type: 'video',
    title: `${video.streamer.username} posted a new video`,
    detail: video.title,
    avatarImage: video.streamer.avatarImage,
    link: `/watch/${video.id}`,
    createdAt: video.createdAt,
    isUnread: isUnread(video.createdAt),
  }))

  // لایوها اول چون همین الان دارن اتفاق می‌افتن؛ بقیه بر اساس تازگی
  const rest = [...commentItems, ...videoItems].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  )
  const items = [...liveItems, ...rest].slice(0, MAX_ITEMS)

  // شمارش رو همون لیستِ بریده‌شده انجام می‌شه، نه رو کل رویدادها - وگرنه بج عددی نشون
  // می‌داد که کاربر با باز کردن منو هیچ‌وقت پیداش نمی‌کرد
  res.json({
    items,
    unreadCount: items.filter((item) => item.isUnread).length,
  })
})

// باز کردن منو یعنی «همه‌ی اینا رو دیدم». فقط یه تایم‌استمپ جلو می‌ره - نه به‌روزرسانی
// تک‌تک رویدادها
router.post('/seen', requireAuth, async (req, res) => {
  await prisma.user.update({
    where: { id: req.userId },
    data: { notificationsSeenAt: new Date() },
  })
  res.json({ ok: true })
})

export default router
