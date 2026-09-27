import 'dotenv/config'
import http from 'http'
import createApp from './app.js'
import attachChat from './lib/chat.js'

const app = createApp()

// فاز ۱۳: قبلاً مستقیم app.listen صدا زده می‌شد. حالا خودمون سرور HTTP رو می‌سازیم چون
// socket.io باید به همون سرور بچسبه - اینجوری چت و /api رو یه پورت و یه دامنه‌ن، پس
// همون کوکی httpOnly لاگین بدون هیچ تنظیم اضافه‌ای برای چت هم معتبره
const server = http.createServer(app)
attachChat(server)

const port = process.env.PORT || 4000

server.listen(port, () => {
  console.log(`StreamHub API running on http://localhost:${port}`)
})
