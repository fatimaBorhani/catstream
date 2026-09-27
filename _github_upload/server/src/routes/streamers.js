import { Router } from 'express'
import prisma from '../lib/prisma.js'
import requireAuth from '../middleware/requireAuth.js'
import { emitToChannel } from '../lib/chat.js'

const router = Router()

const MAX_TITLE_LENGTH = 140
const MAX_DESCRIPTION_LENGTH = 500
// فاز ۱۷: کانال تازه‌ساخته هنوز هیچ تصویر بنری نداره - همون باکس رنگی ساده‌ای که
// videos.js هم برای تامبنیل پیش‌فرض استفاده می‌کنه. کاربر بعداً از تنظیمات عوضش می‌کنه
const DEFAULT_CHANNEL_THUMBNAIL = 'https://placehold.co/640x360/1e293b/1e293b'
const DEFAULT_DESCRIPTION = 'This channel has not written an about section yet.'
const MAX_GOAL_TITLE_LENGTH = 100
const MAX_SOCIAL_LINKS_LENGTH = 300

// فاز ۱۱: نوار پیشرفتِ هدف تو فرانت به تعداد واقعیِ فالوورها نیاز داره. این خودِ عدد رو
// جایی ذخیره نمی‌کنیم (بالای schema.prisma توضیح داده چرا) - همیشه لحظه‌ای از شمارشِ
// ردیف‌های Follow حساب می‌شه، همینجا با _count. شکل خامِ _count.followers یه جزئیات
// پیاده‌سازیِ Prisma است، برای همین قبل از فرستادن به فرانت به یه فیلد تخت تبدیلش می‌کنیم
function sanitizeStreamer(streamer) {
  const { _count, ...rest } = streamer
  return { ...rest, followerCount: _count ? _count.followers : 0 }
}

// orderBy: createdAt تا ترتیب همون ترتیب seed (و در نتیجه پیش‌بینی‌پذیر) بمونه
router.get('/', async (req, res) => {
  const streamers = await prisma.streamer.findMany({
    orderBy: { createdAt: 'asc' },
    include: { _count: { select: { followers: true } } },
  })
  res.json({ streamers: streamers.map(sanitizeStreamer) })
})

// کانالِ خودِ کاربر لاگین‌شده رو پیدا می‌کنه - سه روت پایین همه از همین استفاده می‌کنن
// چون هرکس فقط باید بتونه کانال خودشو ویرایش کنه، نه با فرستادن یه id دلخواه کانال یکی دیگه رو
async function getMyStreamer(userId) {
  return prisma.streamer.findUnique({ where: { userId } })
}

// فاز ۱۷: ساخت کانال برای کاربر لاگین‌شده. تا قبل از این، هیچ راهی برای «استریمر شدن»
// از تو خود سایت نبود - فقط حساب‌هایی که تو seed بهشون Streamer وصل شده بود کانال داشتن
// و بقیه تو داشبورد به یه بن‌بست می‌خوردن.
//
// username کانال عمداً از خودِ یوزرنیم کاربر برداشته می‌شه، نه یه فیلد جدا تو فرم: اینجوری
// آدرس کانال (/channel/:username) و آدرس پروفایل عمومی (/user/:username) یکی می‌مونن و
// کاربر لازم نیست دوتا اسم یکتا انتخاب کنه. تنها حالت شکست وقتیه که یه کانال seed شده از
// قبل همون اسم رو گرفته باشه، که پایین‌تر با P2002 جواب داده می‌شه
router.post('/me', requireAuth, async (req, res) => {
  // @@unique رو userId هم همینو تضمین می‌کنه، ولی اینجا زودتر و با یه پیام واضح‌تر
  // جوابش رو می‌دیم - نه با یه خطای دیتابیسی مبهم
  const existing = await getMyStreamer(req.userId)
  if (existing) {
    return res.status(409).json({ error: 'You already have a channel' })
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }

  const { streamTitle, categoryId, description } = req.body
  const trimmedTitle = String(streamTitle || '').trim()
  const trimmedDescription = String(description || '').trim()

  if (!trimmedTitle || trimmedTitle.length > MAX_TITLE_LENGTH) {
    return res.status(400).json({ error: `Title must be 1-${MAX_TITLE_LENGTH} characters` })
  }
  if (!categoryId) {
    return res.status(400).json({ error: 'Category is required' })
  }
  if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
    return res
      .status(400)
      .json({ error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer` })
  }

  try {
    const streamer = await prisma.streamer.create({
      data: {
        userId: user.id,
        username: user.username,
        // آواتار کانال همون آواتار خود کاربره - کانال تازه هنوز هویت بصری جدا نداره
        avatarImage: user.avatarImage,
        streamTitle: trimmedTitle,
        categoryId,
        thumbnailImage: DEFAULT_CHANNEL_THUMBNAIL,
        description: trimmedDescription || DEFAULT_DESCRIPTION,
      },
      include: { _count: { select: { followers: true } } },
    })
    res.status(201).json({ streamer: sanitizeStreamer(streamer) })
  } catch (error) {
    // P2002 یعنی یه کانال دیگه (احتمالاً seed شده) از قبل همین username رو داره
    if (error.code === 'P2002') {
      return res
        .status(409)
        .json({ error: 'A channel with your username already exists' })
    }
    // P2003 یعنی categoryId ی فرستاده‌شده تو جدول Category نیست
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid category' })
    }
    console.error(error)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// فاز ۴: ویرایش اطلاعات کانال (عنوان استریم، دسته‌بندی، توضیحات). قبلاً این فرم فقط تو
// localStorage مرورگر ذخیره می‌شد چون فاز ۱ هنوز Streamer به User وصل نبود؛ حالا که وصله،
// واقعاً رو دیتابیس ذخیره می‌شه - عین PATCH /api/auth/me برای پروفایل کاربر
router.patch('/me', requireAuth, async (req, res) => {
  const streamer = await getMyStreamer(req.userId)
  if (!streamer) {
    return res.status(404).json({ error: 'You do not have a channel yet' })
  }

  const { streamTitle, categoryId, description, socialLinks, goalTitle, goalTarget } = req.body
  const data = {}

  if (streamTitle !== undefined) {
    const trimmedTitle = String(streamTitle).trim()
    if (!trimmedTitle || trimmedTitle.length > MAX_TITLE_LENGTH) {
      return res.status(400).json({ error: `Title must be 1-${MAX_TITLE_LENGTH} characters` })
    }
    data.streamTitle = trimmedTitle
  }

  if (categoryId !== undefined) {
    data.categoryId = categoryId
  }

  if (description !== undefined) {
    const trimmedDescription = String(description).trim()
    if (trimmedDescription.length > MAX_DESCRIPTION_LENGTH) {
      return res
        .status(400)
        .json({ error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or fewer` })
    }
    data.description = trimmedDescription
  }

  // فاز ۱۱: رشته‌ی جداشده با کاما - عین Category.tags. رشته‌ی خالی یعنی «همه‌شونو پاک کن»،
  // برای همین null ذخیره می‌شه نه یه رشته‌ی خالی (تا ChannelAbout بتونه با یه if ساده تشخیص بده)
  if (socialLinks !== undefined) {
    const trimmedSocialLinks = String(socialLinks).trim()
    if (trimmedSocialLinks.length > MAX_SOCIAL_LINKS_LENGTH) {
      return res
        .status(400)
        .json({ error: `Social links must be ${MAX_SOCIAL_LINKS_LENGTH} characters or fewer` })
    }
    data.socialLinks = trimmedSocialLinks || null
  }

  // فاز ۱۱: عنوان خالی یعنی «هدف رو کلاً حذف کن» - چون یه goalTarget بدون عنوان معنی
  // نداره، هردو با هم null می‌شن. اگه عنوان پره، goalTarget تو همین درخواست اجباریه
  // (فرانت همیشه هردو رو با هم تو یه فرم می‌فرسته، نه جدا)
  if (goalTitle !== undefined) {
    const trimmedGoalTitle = String(goalTitle).trim()
    if (!trimmedGoalTitle) {
      data.goalTitle = null
      data.goalTarget = null
    } else {
      if (trimmedGoalTitle.length > MAX_GOAL_TITLE_LENGTH) {
        return res
          .status(400)
          .json({ error: `Goal title must be ${MAX_GOAL_TITLE_LENGTH} characters or fewer` })
      }
      const targetNumber = Number(goalTarget)
      if (!Number.isInteger(targetNumber) || targetNumber <= 0) {
        return res.status(400).json({ error: 'Goal target must be a positive whole number' })
      }
      data.goalTitle = trimmedGoalTitle
      data.goalTarget = targetNumber
    }
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' })
  }

  try {
    const updated = await prisma.streamer.update({ where: { id: streamer.id }, data })
    res.json({ streamer: updated })
  } catch (error) {
    // P2003 یعنی categoryId فرستاده‌شده تو جدول Category وجود نداره
    if (error.code === 'P2003') {
      return res.status(400).json({ error: 'Invalid category' })
    }
    console.error(error)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// فاز ۴: شروع لایو. liveSince رو با زمان الان پر می‌کنیم تا فرانت بتونه بعداً «چند وقته
// لایوعه» رو از روش حساب کنه - عین همون الگوی uploadedDaysAgo برای ویدیوها
router.post('/me/go-live', requireAuth, async (req, res) => {
  const streamer = await getMyStreamer(req.userId)
  if (!streamer) {
    return res.status(404).json({ error: 'You do not have a channel yet' })
  }

  const updated = await prisma.streamer.update({
    where: { id: streamer.id },
    data: { isLive: true, liveSince: new Date() },
  })

  // فاز ۲۳: عکسِ همون خبررسانیِ go-offline - کسی که صفحه‌ی این کانال رو باز نگه داشته
  // (آفلاین بوده) بدون رفرش باید ببینه الان لایو شده
  emitToChannel(streamer.id, 'stream:status', { isLive: true })

  res.json({ streamer: updated })
})

router.post('/me/go-offline', requireAuth, async (req, res) => {
  const streamer = await getMyStreamer(req.userId)
  if (!streamer) {
    return res.status(404).json({ error: 'You do not have a channel yet' })
  }

  const updated = await prisma.streamer.update({
    where: { id: streamer.id },
    data: { isLive: false, liveSince: null },
  })

  // فاز ۲۳: قبلاً بیننده‌ای که همون لحظه صفحه‌ی کانال رو باز داشت، تا رفرش نمی‌کرد
  // نمی‌فهمید لایو تموم شده - چت و پلیر همون‌جوری روشن می‌موندن. حالا همون سوکتی که
  // چت/تعداد بیننده رو رد و بدل می‌کنه این خبر رو هم می‌رسونه
  emitToChannel(streamer.id, 'stream:status', { isLive: false })

  res.json({ streamer: updated })
})

router.get('/:username', async (req, res) => {
  const streamer = await prisma.streamer.findUnique({
    where: { username: req.params.username },
    include: { _count: { select: { followers: true } } },
  })
  if (!streamer) {
    return res.status(404).json({ error: 'Streamer not found' })
  }
  res.json({ streamer: sanitizeStreamer(streamer) })
})

export default router
