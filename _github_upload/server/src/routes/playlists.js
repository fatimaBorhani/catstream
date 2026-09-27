import { Router } from 'express'
import prisma from '../lib/prisma.js'
import requireAuth from '../middleware/requireAuth.js'

const router = Router()

// شکل خروجی رو دقیقاً مثل دیتای mock قبلی (src/data/playlists.js) نگه می‌داریم:
// یه آرایه‌ی videoIds به‌جای خودِ ویدیوها - فرانت (ChannelPlaylists.jsx) از رو همین
// id ها، ویدیوهای کامل رو از لیست جدای videos پیدا می‌کنه
function sanitizePlaylist(playlist) {
  const { streamer, playlistVideos, ...rest } = playlist
  return {
    ...rest,
    streamerUsername: streamer.username,
    videoIds: playlistVideos.map((playlistVideo) => playlistVideo.videoId),
  }
}

router.get('/', async (req, res) => {
  const playlists = await prisma.playlist.findMany({
    orderBy: { createdAt: 'asc' },
    include: {
      streamer: { select: { username: true } },
      // orderBy رو position چون ترتیب ویدیوها تو پلی‌لیست مهمه (کاور از اولی میاد)
      playlistVideos: { orderBy: { position: 'asc' } },
    },
  })
  res.json({ playlists: playlists.map(sanitizePlaylist) })
})

// فاز ۴: ساختن یه پلی‌لیست جدید برای کانال خودِ کاربر لاگین‌شده (دکمه‌ی New playlist تو داشبورد).
// دقیقاً مثل روت ساختن ویدیو، streamerId از کوکی میاد نه از body.
router.post('/', requireAuth, async (req, res) => {
  const streamer = await prisma.streamer.findUnique({ where: { userId: req.userId } })
  if (!streamer) {
    return res.status(404).json({ error: 'You do not have a channel yet' })
  }

  const { title, videoIds } = req.body
  const trimmedTitle = String(title || '').trim()

  if (!trimmedTitle) {
    return res.status(400).json({ error: 'Title is required' })
  }
  if (!Array.isArray(videoIds) || videoIds.length === 0) {
    return res.status(400).json({ error: 'Pick at least one video' })
  }

  // چک می‌کنیم همه‌ی ویدیوهای انتخاب‌شده واقعاً مال همین کاناله - وگرنه یکی می‌تونست با
  // دستکاری درخواست، ویدیوی یه کانال دیگه رو تو پلی‌لیست خودش بذاره
  const ownVideos = await prisma.video.findMany({
    where: { id: { in: videoIds }, streamerId: streamer.id },
    select: { id: true },
  })
  const ownVideoIds = new Set(ownVideos.map((video) => video.id))
  const allOwned = videoIds.every((videoId) => ownVideoIds.has(videoId))
  if (!allOwned) {
    return res.status(400).json({ error: 'You can only add your own videos to a playlist' })
  }

  try {
    // ساختن پلی‌لیست و ردیف‌های PlaylistVideo باید با هم موفق بشن یا هیچ‌کدوم - $transaction
    // اینجا عین یه TransactionScope تو C# عمل می‌کنه
    const playlist = await prisma.$transaction(async (tx) => {
      const created = await tx.playlist.create({
        data: { title: trimmedTitle, streamerId: streamer.id },
      })
      // position از رو همون ترتیبی که کاربر تو فرانت تیک زده میاد - یعنی همون index تو آرایه
      await tx.playlistVideo.createMany({
        data: videoIds.map((videoId, index) => ({
          playlistId: created.id,
          videoId,
          position: index,
        })),
      })
      return tx.playlist.findUnique({
        where: { id: created.id },
        include: {
          streamer: { select: { username: true } },
          playlistVideos: { orderBy: { position: 'asc' } },
        },
      })
    })
    res.status(201).json({ playlist: sanitizePlaylist(playlist) })
  } catch (error) {
    // P2002 یعنی همین کانال قبلاً یه پلی‌لیست با همین عنوان داره (@@unique تو schema)
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'You already have a playlist with this title' })
    }
    console.error(error)
    res.status(500).json({ error: 'Something went wrong' })
  }
})

// فاز ۹: حذف یه پلی‌لیست خودت (از تب Playlists داشبورد). خودِ ویدیوها پاک نمی‌شن، فقط
// جایگاهشون تو همین پلی‌لیست (ردیف‌های PlaylistVideo) - عین حذف یه پلی‌لیست تو یوتیوب،
// ویدیوهاش جای دیگه سالم می‌مونن
router.delete('/:id', requireAuth, async (req, res) => {
  const streamer = await prisma.streamer.findUnique({ where: { userId: req.userId } })
  const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } })

  if (!playlist || !streamer || playlist.streamerId !== streamer.id) {
    return res.status(404).json({ error: 'Playlist not found' })
  }

  await prisma.$transaction([
    prisma.playlistVideo.deleteMany({ where: { playlistId: playlist.id } }),
    prisma.playlist.delete({ where: { id: playlist.id } }),
  ])
  res.json({ ok: true })
})

export default router
