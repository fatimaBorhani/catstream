import { Router } from 'express'
import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import prisma from '../lib/prisma.js'
import requireAuth from '../middleware/requireAuth.js'

const router = Router()

const MS_PER_DAY = 24 * 60 * 60 * 1000

// اگه کاربر موقع آپلود لینک تامبنیل نذاره، یه باکس رنگی ساده مثل بقیه‌ی ویدیوهای seed شده می‌ذاریم
const DEFAULT_THUMBNAIL = 'https://placehold.co/640x360/1e293b/1e293b'

// چون سرور رو لوکاله (دقیقاً همون الگوی API_BASE تو فرانت)، آدرسش رو مستقیم می‌سازیم -
// این پیشوند جلوی videoUrl ذخیره‌شده تو دیتابیس می‌شینه تا فرانت مستقیم بتونه بهش <video src> بده
const SERVER_ORIGIN = 'http://localhost:4000'

// فایل‌های واقعی ویدیو این‌جا ذخیره می‌شن - کنار prisma/، نه تو src/، که قاطی کد نشه
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const UPLOADS_DIR = path.join(__dirname, '../../uploads/videos')
fs.mkdirSync(UPLOADS_DIR, { recursive: true })

// چون این یه دموعه نه یه سرویس واقعی، یه سقف رو حجم فایل می‌ذاریم که دیسک سرور با
// چندتا آپلود بزرگ پر نشه - همین عدد تو فرانت (UploadVideoForm) هم برای پیام خطای
// زودهنگام (قبل از فرستادن کل فایل) تکرار شده
const MAX_VIDEO_BYTES = 200 * 1024 * 1024

const storage = multer.diskStorage({
  destination: UPLOADS_DIR,
  // اسم فایل اورجینال رو نگه نمی‌داریم (ممکنه تکراری باشه یا کاراکتر عجیب داشته باشه)،
  // فقط پسوندش رو حفظ می‌کنیم و بقیه‌ی اسم رو یه شناسه‌ی یکتا می‌سازیم
  filename: (req, file, callback) => {
    const extension = path.extname(file.originalname) || '.mp4'
    callback(null, `${crypto.randomUUID()}${extension}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: MAX_VIDEO_BYTES },
  fileFilter: (req, file, callback) => {
    if (!file.mimetype.startsWith('video/')) {
      callback(new Error('INVALID_FILE_TYPE'))
      return
    }
    callback(null, true)
  },
})

// فرانت (VideoCard، NotificationsMenu) قبلاً یه uploadedDaysAgo ثابت تو دیتای mock داشت؛
// چون createdAt الان واقعیه، همون شکل قبلی رو با محاسبه از رو تاریخ الان می‌سازیم -
// اینجوری بقیه‌ی کد فرانت که به این فیلد وابسته‌ست دست‌نخورده می‌مونه
function sanitizeVideo(video) {
  const { streamer, _count, ...rest } = video
  return {
    ...rest,
    streamerUsername: streamer.username,
    // فاز ۱۶: دقیقاً همون الگوی followerCount تو streamers.js - تعداد لایک هیچ‌وقت جدا
    // ذخیره نمی‌شه، همیشه لحظه‌ای از شمارش واقعی ردیف‌های Like میاد، وگرنه با هر
    // لایک/آنلایک باید یه عدد جدا رو هم دستی همگام نگه می‌داشتیم که جای خطا داره.
    // روت ساخت ویدیو _count رو include نمی‌کنه (ویدیوی تازه قطعاً صفر لایک داره)
    likeCount: _count ? _count.likes : 0,
    uploadedDaysAgo: Math.floor((Date.now() - new Date(video.createdAt).getTime()) / MS_PER_DAY),
  }
}

// آدرسی که تو دیتابیس ذخیره شده کامله (http://localhost:4000/uploads/videos/xxx.mp4)، ولی
// برای پاک کردن، مسیر فایل رو دیسک لازمه. فقط اسم فایل رو از آدرس برمی‌داریم و کنار
// UPLOADS_DIR می‌ذاریم - اینجوری حتی اگه یه videoUrl دستکاری‌شده مسیر عجیبی داشته باشه،
// هیچ‌وقت چیزی بیرون همین پوشه پاک نمی‌شه.
// ویدیوهای seed شده اصلاً videoUrl ندارن، پس فایلی هم برای حذف ندارن
function removeVideoFile(videoUrl) {
  if (!videoUrl) return

  const filePath = path.join(UPLOADS_DIR, path.basename(videoUrl))
  // force یعنی «نبودنِ فایل خطا نیست» - ممکنه قبلاً دستی پاک شده باشه، و این نباید
  // درخواست حذفی که ردیف دیتابیسش همین الان موفق بوده رو بشکنه
  fs.rm(filePath, { force: true }, (error) => {
    if (error) console.error(error)
  })
}

// همه‌ی ویدیوها با هم می‌گیریمشون (مثل streamers/categories) چون تعدادشون کمه و
// DataContext یه‌بار موقع بالا اومدن اپ همه رو می‌گیره، بعد هرجا لازم بود لوکال فیلتر می‌کنه
router.get('/', async (req, res) => {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      streamer: { select: { username: true } },
      _count: { select: { likes: true } },
    },
  })
  res.json({ videos: videos.map(sanitizeVideo) })
})

// فاز ۱۶: id ویدیوهایی که کاربر لاگین‌شده لایک کرده - عیناً همون الگوی GET /api/follows،
// و AuthContext هم دقیقاً مثل فالوها یه‌بار موقع بالا اومدن اپ می‌گیردش تا دکمه‌ی لایک
// بدونه پر باشه یا خالی.
// این روت عمداً قبل از روت‌های /:id تعریف شده - وگرنه Express «me» رو یه id معمولی
// حساب می‌کرد و درخواست به روت اشتباه می‌رسید
router.get('/me/likes', requireAuth, async (req, res) => {
  const likes = await prisma.like.findMany({
    where: { userId: req.userId },
    select: { videoId: true },
  })
  res.json({ videoIds: likes.map((like) => like.videoId) })
})

// فاز ۴ + فاز آپلود واقعی: ساختن یه ویدیوی جدید برای کانال خودِ کاربر لاگین‌شده (دکمه‌ی
// Upload video تو داشبورد). streamerId رو از body نمی‌گیریم، از رو کوکی کاربر پیدا
// می‌کنیم - وگرنه هرکسی می‌تونست با فرستادن یه streamerId دلخواه، ویدیو رو زیر کانال
// یکی دیگه بسازه.
// requireAuth قبل میاد چون احراز هویت با کوکیه، ربطی به آپلود فایل نداره؛ ولی خودِ
// upload.single رو دستی (نه به‌عنوان یه middleware مستقیم رو روت) صدا می‌زنیم که
// بتونیم خطاهای multer (فایل خیلی بزرگ، نوع فایل غلط) رو با یه پیام تمیز جواب بدیم
router.post('/', requireAuth, (req, res) => {
  upload.single('video')(req, res, async (uploadError) => {
    if (uploadError) {
      if (uploadError.code === 'LIMIT_FILE_SIZE') {
        return res
          .status(400)
          .json({ error: `Video must be ${MAX_VIDEO_BYTES / (1024 * 1024)}MB or smaller` })
      }
      if (uploadError.message === 'INVALID_FILE_TYPE') {
        return res.status(400).json({ error: 'File must be a video' })
      }
      console.error(uploadError)
      return res.status(500).json({ error: 'Could not process the uploaded file' })
    }

    if (!req.file) {
      return res.status(400).json({ error: 'A video file is required' })
    }

    const streamer = await prisma.streamer.findUnique({ where: { userId: req.userId } })
    if (!streamer) {
      fs.unlinkSync(req.file.path)
      return res.status(404).json({ error: 'You do not have a channel yet' })
    }

    const { title, thumbnailImage, durationMinutes } = req.body
    const trimmedTitle = String(title || '').trim()
    const duration = Number(durationMinutes)

    if (!trimmedTitle) {
      fs.unlinkSync(req.file.path)
      return res.status(400).json({ error: 'Title is required' })
    }
    if (!Number.isInteger(duration) || duration <= 0) {
      fs.unlinkSync(req.file.path)
      return res
        .status(400)
        .json({ error: 'Duration must be a whole number of minutes greater than 0' })
    }

    try {
      const video = await prisma.video.create({
        data: {
          title: trimmedTitle,
          streamerId: streamer.id,
          thumbnailImage: String(thumbnailImage || '').trim() || DEFAULT_THUMBNAIL,
          durationMinutes: duration,
          videoUrl: `${SERVER_ORIGIN}/uploads/videos/${req.file.filename}`,
        },
        include: { streamer: { select: { username: true } } },
      })
      res.status(201).json({ video: sanitizeVideo(video) })
    } catch (error) {
      // اگه ذخیره تو دیتابیس شکست خورد، فایلی که همین الان رو دیسک نوشتیم رو یتیم
      // نمی‌ذاریم، پاکش می‌کنیم
      fs.unlinkSync(req.file.path)
      // P2002 یعنی همین کانال قبلاً یه ویدیو با همین عنوان داره (@@unique تو schema)
      if (error.code === 'P2002') {
        return res.status(409).json({ error: 'You already have a video with this title' })
      }
      console.error(error)
      res.status(500).json({ error: 'Something went wrong' })
    }
  })
})

// فاز ۹: حذف یه ویدیوی خودت (از تب Videos داشبورد). قبل از حذف خودِ ویدیو، هر ردیفی که
// بهش وابسته‌ست (لایک‌ها، کلیپ‌ها، جایگاهش تو پلی‌لیست‌ها) هم باید حذف بشه - وگرنه Foreign Key
// اجازه نمی‌ده (همون‌جوری که SQL Server هم با یه FK constraint جلوی حذف یتیم‌ساز رو می‌گیره)
router.delete('/:id', requireAuth, async (req, res) => {
  const streamer = await prisma.streamer.findUnique({ where: { userId: req.userId } })
  const video = await prisma.video.findUnique({ where: { id: req.params.id } })

  if (!video || !streamer || video.streamerId !== streamer.id) {
    return res.status(404).json({ error: 'Video not found' })
  }

  await prisma.$transaction([
    prisma.like.deleteMany({ where: { videoId: video.id } }),
    // فاز ۱۲ جدول Clip رو اضافه کرد ولی این تراکنش اون‌موقع به‌روز نشد؛ چون رابطه‌ی
    // Clip.video از نوع RESTRICT ـه، تا وقتی حتی یه کلیپ رو این ویدیو مونده باشه، خودِ
    // خط حذف ویدیو با خطای Foreign Key برمی‌گشت و کاربر فقط یه ارور مبهم می‌دید
    prisma.clip.deleteMany({ where: { videoId: video.id } }),
    prisma.playlistVideo.deleteMany({ where: { videoId: video.id } }),
    prisma.video.delete({ where: { id: video.id } }),
  ])

  // فایل واقعی رو دیسک عمداً بعد از تراکنش پاک می‌شه، نه قبلش - اگه حذف دیتابیس شکست
  // بخوره، ویدیو هنوز سر جاشه و نباید فایلش رو از دست داده باشیم
  removeVideoFile(video.videoUrl)

  res.json({ ok: true })
})

// فاز ۱۶: شمردن یه بازدید. تا قبل از این، viewCount فقط همون عدد ثابتِ seed بود و
// هیچ‌وقت تکون نمی‌خورد - یعنی عددی که کنار ویدیو نشون می‌دادیم واقعی نبود.
// requireAuth عمداً نداره: بازدیدِ مهمون هم بازدیده، عین یوتیوب.
// increment (نه خوندن عدد و بعد نوشتن عدد+۱) چون این کار رو خودِ دیتابیس اتمیک انجام
// می‌ده - اگه دو نفر هم‌زمان صفحه رو باز کنن، هیچ‌کدوم بازدید اون یکی رو پاک نمی‌کنه
router.post('/:id/view', async (req, res) => {
  try {
    await prisma.video.update({
      where: { id: req.params.id },
      data: { viewCount: { increment: 1 } },
    })
    res.json({ ok: true })
  } catch (error) {
    // P2025 یعنی ویدیویی با این id نیست (مثلاً همین الان حذف شده)
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Video not found' })
    }
    console.error(error)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// لایک کردن یه ویدیو
router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    await prisma.like.upsert({
      where: { userId_videoId: { userId: req.userId, videoId: req.params.id } },
      update: {},
      create: { userId: req.userId, videoId: req.params.id },
    })
    res.status(201).json({ ok: true })
  } catch (error) {
    if (error.code === 'P2003') {
      return res.status(404).json({ error: 'Video not found' })
    }
    console.error(error)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.delete('/:id/like', requireAuth, async (req, res) => {
  await prisma.like.deleteMany({
    where: { userId: req.userId, videoId: req.params.id },
  })
  res.json({ ok: true })
})

export default router
