import { Router } from 'express'
import prisma from '../lib/prisma.js'
import requireAuth from '../middleware/requireAuth.js'

const router = Router()

// همون منطق محدودیت طول که تو auth.js برای بیو داریم - یه کامنت خیلی بلند هم تو UI
// زشت می‌شه هم اگه محدودیت نداشت هرکی می‌تونست دیتابیس رو با متن غول‌پیکر پر کنه
const MAX_COMMENT_LENGTH = 500

// author رو از حالت رابطه‌ی پریزما (یه شیء کامل User) به دوتا فیلد ساده تبدیل می‌کنیم -
// دقیقاً همون کاری که videos.js با streamerUsername می‌کنه؛ فرانت نیازی به کل شیء User نداره
function sanitizeComment(comment) {
  const { author, ...rest } = comment
  return { ...rest, authorUsername: author.username, authorAvatarImage: author.avatarImage }
}

// کامنت‌های زیر یه کانال - عمومیه (بدون requireAuth)، چون خوندن کامنت‌ها مثل خوندن خود
// کانال نیازی به لاگین نداره، فقط گذاشتن/حذف کامنت لاگین می‌خواد
router.get('/:streamerUsername', async (req, res) => {
  const streamer = await prisma.streamer.findUnique({
    where: { username: req.params.streamerUsername },
  })
  if (!streamer) {
    return res.status(404).json({ error: 'Channel not found' })
  }

  const comments = await prisma.comment.findMany({
    where: { streamerId: streamer.id },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { username: true, avatarImage: true } } },
  })
  res.json({ comments: comments.map(sanitizeComment) })
})

router.post('/:streamerUsername', requireAuth, async (req, res) => {
  const streamer = await prisma.streamer.findUnique({
    where: { username: req.params.streamerUsername },
  })
  if (!streamer) {
    return res.status(404).json({ error: 'Channel not found' })
  }

  const trimmedContent = String(req.body.content || '').trim()
  if (!trimmedContent) {
    return res.status(400).json({ error: 'Comment cannot be empty' })
  }
  if (trimmedContent.length > MAX_COMMENT_LENGTH) {
    return res
      .status(400)
      .json({ error: `Comment must be ${MAX_COMMENT_LENGTH} characters or fewer` })
  }

  const comment = await prisma.comment.create({
    data: { content: trimmedContent, authorId: req.userId, streamerId: streamer.id },
    include: { author: { select: { username: true, avatarImage: true } } },
  })
  res.status(201).json({ comment: sanitizeComment(comment) })
})

// حذف کامنت: هم خودِ نویسنده‌ی کامنت می‌تونه پاکش کنه، هم صاحب کانالی که کامنت زیرشه
// (مثل مدیریت کامنت‌های زیر ویدیوی یوتیوب - صاحب کانال می‌تونه کامنت مزاحم رو پاک کنه)
router.delete('/:id', requireAuth, async (req, res) => {
  const comment = await prisma.comment.findUnique({
    where: { id: req.params.id },
    include: { streamer: { select: { userId: true } } },
  })
  if (!comment) {
    return res.status(404).json({ error: 'Comment not found' })
  }

  const isAuthor = comment.authorId === req.userId
  const isChannelOwner = comment.streamer.userId === req.userId
  if (!isAuthor && !isChannelOwner) {
    return res.status(403).json({ error: 'You cannot delete this comment' })
  }

  await prisma.comment.delete({ where: { id: comment.id } })
  res.json({ ok: true })
})

export default router
