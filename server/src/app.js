import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import categoriesRoutes from './routes/categories.js'
import streamersRoutes from './routes/streamers.js'
import followsRoutes from './routes/follows.js'
import videosRoutes from './routes/videos.js'
import playlistsRoutes from './routes/playlists.js'
import commentsRoutes from './routes/comments.js'
import usersRoutes from './routes/users.js'
import clipsRoutes from './routes/clips.js'
import notificationsRoutes from './routes/notifications.js'

// چون این فایل تو src/ هست، پوشه‌ی uploads (کنار prisma، تو ریشه‌ی پروژه‌ی سرور) یه پله بالاتره
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// خود اپ Express رو اینجا می‌سازیم (middleware ها، route ها)، جدا از index.js که فقط
// مسئول بالا آوردن سرور رو پورته. این جدایی باعث می‌شه بعداً تست نوشتن راحت‌تر باشه.
function createApp() {
  const app = express()

  app.use(cors({ origin: process.env.CLIENT_ORIGIN, credentials: true }))
  app.use(express.json())
  app.use(cookieParser())

  // فایل‌های واقعی ویدیو که کاربرها آپلود می‌کنن از این پوشه سرو می‌شن - جدا از
  // route‌های /api چون این‌ها فایل استاتیکن (باینری)، نه JSON
  app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

  // یه health-check ساده - فقط برای این‌که مطمئن بشیم سرور بالاست و جواب می‌ده.
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api/auth', authRoutes)
  app.use('/api/categories', categoriesRoutes)
  app.use('/api/streamers', streamersRoutes)
  app.use('/api/follows', followsRoutes)
  app.use('/api/videos', videosRoutes)
  app.use('/api/playlists', playlistsRoutes)
  app.use('/api/comments', commentsRoutes)
  app.use('/api/users', usersRoutes)
  app.use('/api/clips', clipsRoutes)
  app.use('/api/notifications', notificationsRoutes)

  return app
}

export default createApp
