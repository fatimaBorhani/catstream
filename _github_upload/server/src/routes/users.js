import { Router } from 'express'
import prisma from '../lib/prisma.js'

const router = Router()

// این روت برخلاف sanitizeUser تو auth.js عمداً email رو هم برنمی‌گردونه - چون اونجا
// فقط خودِ کاربر جواب رو می‌بینه (/auth/me)، ولی این‌جا هرکسی (حتی مهمون) می‌تونه
// پروفایل عمومی هر کاربری رو ببینه (مثلاً با کلیک رو اسم یه نفر زیر کامنت‌ها)
function sanitizePublicUser(user) {
  return {
    username: user.username,
    name: user.name,
    bio: user.bio,
    avatarImage: user.avatarImage,
    createdAt: user.createdAt,
  }
}

router.get('/:username', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { username: req.params.username } })
  if (!user) {
    return res.status(404).json({ error: 'User not found' })
  }
  res.json({ user: sanitizePublicUser(user) })
})

export default router
