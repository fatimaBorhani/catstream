import { verifyToken } from '../lib/jwt.js'

// کوکی httpOnly رو می‌خونه و چک می‌کنه معتبره یا نه. اگه بود، req.userId رو ست می‌کنه
// و اجازه می‌ده request ادامه پیدا کنه؛ اگه نبود یا نامعتبر بود، 401 برمی‌گردونه.
function requireAuth(req, res, next) {
  const token = req.cookies?.token

  if (!token) {
    return res.status(401).json({ error: 'Not logged in' })
  }

  try {
    const payload = verifyToken(token)
    req.userId = payload.userId
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }
}

export default requireAuth
