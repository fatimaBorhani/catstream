import { Router } from 'express'
import prisma from '../lib/prisma.js'
import requireAuth from '../middleware/requireAuth.js'

const router = Router()

const MAX_TITLE_LENGTH = 100

// author رو به یه یوزرنیم ساده تبدیل می‌کنیم - عین همون کاری که comments.js با author می‌کنه؛
// فرانت نیازی به کل شیء User نداره
function sanitizeClip(clip) {
  const { creator, video, ...rest } = clip
  const sanitized = { ...rest, creatorUsername: creator.username }

  // فقط روت لیستِ کشف (فاز ۱۸) ویدیو رو include می‌کنه، چون اونجا کلیپ‌ها از چند ویدیوی
  // مختلف میان و کاربر باید بفهمه هرکدوم مال کدوم ویدیوئه. بقیه‌ی روت‌ها که همه‌ی
  // کلیپ‌هاشون مال یه ویدیوی معلومن، این بلاک رو رد می‌کنن
  if (video) {
    sanitized.videoTitle = video.title
    sanitized.videoThumbnail = video.thumbnailImage
  }
  return sanitized
}

// لیست کلیپ‌ها به‌صورت مجموعه‌ای (نه زیر یه ویدیوی مشخص). ?streamerId= یعنی «فقط
// کلیپ‌های این کانال»؛ بدون اون، همه‌ی کلیپ‌های سایت. فیلتر از راه رابطه‌ی
// video.streamerId انجام می‌شه چون خودِ Clip مستقیم به استریمر وصل نیست، از طریق ویدیوش.
//
// مصرف‌کننده‌ی اولیه‌ش تب Clips صفحه‌ی کانال بود که بعداً حذف شد (کلیپ یه ویژگیِ ویدیوئه،
// نه یه بخش مستقل کانال). خود روت عمداً نگه داشته شد چون هزینه‌ای نداره و اگه بعداً یه
// صفحه‌ی کشف کلیپ خواستیم، آماده‌ست.
// عمداً قبل از GET /:videoId تعریف شده - وگرنه Express مسیر خالی رو هم ممکنه اشتباه بگیره
router.get('/', async (req, res) => {
  const { streamerId } = req.query

  const clips = await prisma.clip.findMany({
    // تازه‌ترین کلیپ‌ها اول - برخلاف لیست زیر یه ویدیو که به ترتیب زمانِ خود ویدیو مرتبه،
    // اینجا ترتیب «تازگی» معنی می‌ده چون کلیپ‌ها از ویدیوهای مختلفن
    where: streamerId ? { video: { streamerId } } : undefined,
    orderBy: { createdAt: 'desc' },
    include: {
      creator: { select: { username: true } },
      video: { select: { title: true, thumbnailImage: true } },
    },
  })
  res.json({ clips: clips.map(sanitizeClip) })
})

// کلیپ‌های یه ویدیوی خاص، به ترتیب زمانی (نه ترتیب ساخت) - عمومیه، خوندنش لاگین
// نمی‌خواد، عین کامنت‌ها
router.get('/:videoId', async (req, res) => {
  const clips = await prisma.clip.findMany({
    where: { videoId: req.params.videoId },
    orderBy: { timestampSeconds: 'asc' },
    include: { creator: { select: { username: true } } },
  })
  res.json({ clips: clips.map(sanitizeClip) })
})

// ساختن یه کلیپ. هر کاربر لاگین‌شده‌ای می‌تونه رو هر ویدیویی کلیپ بسازه - نه فقط صاحب
// کانال. timestampSeconds رو فرانت از رو لحظه‌ی واقعی پخش پلیر می‌فرسته (نه یه عدد دستی)
router.post('/:videoId', requireAuth, async (req, res) => {
  const video = await prisma.video.findUnique({ where: { id: req.params.videoId } })
  if (!video) {
    return res.status(404).json({ error: 'Video not found' })
  }

  const trimmedTitle = String(req.body.title || '').trim()
  const timestampSeconds = Number(req.body.timestampSeconds)

  if (!trimmedTitle || trimmedTitle.length > MAX_TITLE_LENGTH) {
    return res.status(400).json({ error: `Title must be 1-${MAX_TITLE_LENGTH} characters` })
  }
  if (!Number.isFinite(timestampSeconds) || timestampSeconds < 0) {
    return res.status(400).json({ error: 'Invalid timestamp' })
  }

  const clip = await prisma.clip.create({
    data: {
      title: trimmedTitle,
      timestampSeconds: Math.floor(timestampSeconds),
      videoId: video.id,
      creatorId: req.userId,
    },
    include: { creator: { select: { username: true } } },
  })
  res.status(201).json({ clip: sanitizeClip(clip) })
})

// حذف: هم خودِ سازنده‌ی کلیپ می‌تونه پاکش کنه، هم صاحب کانالی که ویدیوش زیرشه - عین
// همون الگوی حذف کامنت (comments.js)
router.delete('/:id', requireAuth, async (req, res) => {
  const clip = await prisma.clip.findUnique({
    where: { id: req.params.id },
    include: { video: { include: { streamer: { select: { userId: true } } } } },
  })
  if (!clip) {
    return res.status(404).json({ error: 'Clip not found' })
  }

  const isCreator = clip.creatorId === req.userId
  const isChannelOwner = clip.video.streamer.userId === req.userId
  if (!isCreator && !isChannelOwner) {
    return res.status(403).json({ error: 'You cannot delete this clip' })
  }

  await prisma.clip.delete({ where: { id: clip.id } })
  res.json({ ok: true })
})

export default router
