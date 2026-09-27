import jwt from 'jsonwebtoken'

const TOKEN_EXPIRY = '7d'

// توکن رو فقط با userId امضا می‌کنیم - بقیه‌ی اطلاعات کاربر رو هر بار از دیتابیس می‌خونیم
// (نه اینکه تو خود توکن کش کنیم)، که اگه پروفایلش عوض شد، همیشه آپدیت باشه
function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: TOKEN_EXPIRY })
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET)
}

export { signToken, verifyToken }
