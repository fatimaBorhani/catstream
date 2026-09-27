import { Router } from 'express'
import bcrypt from 'bcryptjs'
import prisma from '../lib/prisma.js'
import { signToken } from '../lib/jwt.js'
import requireAuth from '../middleware/requireAuth.js'

const router = Router()

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  // تو دیپلوی واقعی (https) باید secure: true بشه؛ رو لوکال (http) باید false بمونه
  secure: false,
  maxAge: 7 * 24 * 60 * 60 * 1000, // ۷ روز
  path: '/',
}

// محدودیت طول اسم و بیو - همین اعداد تو فرم فرانت هم استفاده می‌شن، ولی چک اصلی
// باید اینجا (سمت سرور) باشه چون کسی می‌تونه مستقیم به API درخواست بزنه
const MAX_NAME_LENGTH = 50
const MAX_BIO_LENGTH = 200
const MIN_PASSWORD_LENGTH = 6

// چندتا گربه‌ی پیش‌فرض تو public/avatars فرانت هست؛ موقع ثبت‌نام یکیشون رو بهش می‌دیم.
// انتخاب بر اساس حروف یوزرنیمه (نه تصادفی) تا اگه همون یوزر دوباره ساخته بشه، همون گربه
// رو بگیره و نتیجه قابل‌پیش‌بینی بمونه
const DEFAULT_AVATAR_COUNT = 8

function pickDefaultAvatar(username) {
  let sum = 0
  for (const character of username) {
    sum += character.codePointAt(0)
  }
  return `/avatars/cat-${(sum % DEFAULT_AVATAR_COUNT) + 1}.png`
}

// هیچ‌وقت passwordHash رو تو جواب API برنمی‌گردونیم
function sanitizeUser(user) {
  const { passwordHash, ...safeUser } = user
  return safeUser
}

router.post('/signup', async (req, res) => {
  const { username, email, name, password } = req.body

  if (!username?.trim() || !email?.trim() || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' })
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({ error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` })
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: {
        username: username.trim(),
        email: email.trim().toLowerCase(),
        name: name?.trim() || null,
        passwordHash,
        avatarImage: pickDefaultAvatar(username.trim()),
      },
    })

    const token = signToken(user.id)
    res.cookie('token', token, COOKIE_OPTIONS)
    res.status(201).json({ user: sanitizeUser(user) })
  } catch (error) {
    // P2002 یعنی یونیک کانسترینت (username یا email) نقض شده
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Username or email is already taken' })
    }
    console.error(error)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

router.post('/login', async (req, res) => {
  const { username, password } = req.body

  if (!username?.trim() || !password) {
    return res.status(400).json({ error: 'Username and password are required' })
  }

  const user = await prisma.user.findUnique({ where: { username: username.trim() } })

  // عمداً یه پیام یکسان برای «کاربر نیست» و «پسورد غلطه» برمی‌گردونیم -
  // که کسی نتونه با آزمون‌وخطا بفهمه یه یوزرنیم وجود داره یا نه
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash)
  if (!passwordMatches) {
    return res.status(401).json({ error: 'Invalid username or password' })
  }

  const token = signToken(user.id)
  res.cookie('token', token, COOKIE_OPTIONS)
  res.json({ user: sanitizeUser(user) })
})

router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...COOKIE_OPTIONS, maxAge: undefined })
  res.json({ ok: true })
})

router.get('/me', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) {
    return res.status(401).json({ error: 'Not logged in' })
  }
  res.json({ user: sanitizeUser(user) })
})

// ویرایش پروفایل. فقط همین سه فیلد قابل تغییرن:
// یوزرنیم و ایمیل عمداً اینجا نیستن چون یونیک‌ان (باید خطای تکراری بودن هندل بشه) و
// یوزرنیم تو آدرس صفحه‌ها هم استفاده می‌شه - عوض کردنشون یه کار جدا با چک‌های خودشه.
// requireAuth یعنی فقط خود کاربرِ لاگین‌شده می‌تونه پروفایل خودشو عوض کنه (id از توکن میاد،
// نه از body - وگرنه هرکسی می‌تونست id یکی دیگه رو بفرسته و پروفایل اونو دست بزنه)
router.patch('/me', requireAuth, async (req, res) => {
  const { name, bio, avatarImage } = req.body
  const data = {}

  // هر فیلد فقط وقتی آپدیت می‌شه که تو body فرستاده شده باشه - اینجوری فرم می‌تونه
  // فقط همون چیزی که عوض شده رو بفرسته و بقیه دست‌نخورده بمونن
  if (name !== undefined) {
    const trimmedName = String(name).trim()
    if (trimmedName.length > MAX_NAME_LENGTH) {
      return res.status(400).json({ error: `Name must be ${MAX_NAME_LENGTH} characters or fewer` })
    }
    // رشته‌ی خالی رو null می‌کنیم نه "" - تو دیتابیس "نداره" با "خالیه" یکی حساب بشه
    data.name = trimmedName || null
  }

  if (bio !== undefined) {
    const trimmedBio = String(bio).trim()
    if (trimmedBio.length > MAX_BIO_LENGTH) {
      return res.status(400).json({ error: `Bio must be ${MAX_BIO_LENGTH} characters or fewer` })
    }
    data.bio = trimmedBio || null
  }

  if (avatarImage !== undefined) {
    const trimmedAvatar = String(avatarImage).trim()
    // یا یکی از آواتارهای خود سایت (مسیر داخلی مثل /avatars/cat-3.png)، یا یه لینک https.
    // هرچی غیر این دوتا رد می‌شه - جلوی چیزهایی مثل javascript: رو می‌گیره که اگه مستقیم
    // تو src یه تگ img بشینه می‌تونه دردسر امنیتی بشه
    const isSiteAvatar = trimmedAvatar.startsWith('/avatars/')
    if (!isSiteAvatar && !trimmedAvatar.startsWith('https://')) {
      return res.status(400).json({ error: 'Avatar must be an https image link' })
    }
    data.avatarImage = trimmedAvatar
  }

  if (Object.keys(data).length === 0) {
    return res.status(400).json({ error: 'Nothing to update' })
  }

  try {
    const user = await prisma.user.update({ where: { id: req.userId }, data })
    res.json({ user: sanitizeUser(user) })
  } catch (error) {
    console.error(error)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// فاز ۶: تغییر پسورد. جدا از PATCH /me چون اینجا اول باید پسورد فعلی رو چک کنیم - وگرنه
// اگه یکی یه لحظه به گوشی/لپ‌تاپ بازِ کاربر دسترسی پیدا کنه (بدون دونستن پسورد قبلی)
// می‌تونست پسورد رو عوض کنه و عملاً حسابو قاپ بزنه
router.patch('/password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Current and new password are required' })
  }
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return res
      .status(400)
      .json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters` })
  }

  const user = await prisma.user.findUnique({ where: { id: req.userId } })
  if (!user) {
    return res.status(401).json({ error: 'Not logged in' })
  }

  const currentMatches = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!currentMatches) {
    return res.status(401).json({ error: 'Current password is incorrect' })
  }

  const passwordHash = await bcrypt.hash(newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
  res.json({ ok: true })
})

export default router
