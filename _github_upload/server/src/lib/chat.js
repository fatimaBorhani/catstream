import { Server } from 'socket.io'
import prisma from './prisma.js'
import { verifyToken } from './jwt.js'

// حداکثر طول یه پیام چت. کوتاه‌تر از کامنت (۵۰۰) چون چت ذاتاً کوتاهه و پیام بلند
// کل ستون باریک کنار پلیر رو می‌گیره
const MAX_MESSAGE_LENGTH = 300

// موقع وارد شدن به یه کانال، این تعداد از آخرین پیام‌ها به‌عنوان سابقه فرستاده می‌شن -
// نه کل تاریخچه، چون کانالی که ماه‌ها چت داشته باشه مرورگر رو خفه می‌کنه
const HISTORY_LIMIT = 50

// محدودیت سرعت: حداکثر این تعداد پیام تو این بازه. بدون این، یه نفر با یه حلقه‌ی ساده
// می‌تونست هم چت رو پر کنه هم جدول دیتابیس رو
const RATE_LIMIT_MAX = 10
const RATE_LIMIT_WINDOW_MS = 10_000

// هر کانال اتاق خودش رو داره تا پیام یه کانال به بیننده‌های کانال دیگه نرسه
function roomNameFor(streamerId) {
  return `channel:${streamerId}`
}

// فاز ۲۳: این یه اتاق کاملاً جداست، نه همون roomNameFor. عضویت تو اتاق چت یعنی «داره
// تماشا می‌کنه» و رو viewers:count تاثیر می‌ذاره - ولی کسی که صفحه‌ی یه کانالِ آفلاین رو
// باز نگه داشته (منتظره ببینه کی لایو می‌شه) نباید جزو بیننده حساب بشه. برای همین شروع/پایان
// لایو یه اتاق سبک و بی‌ربط به شمارش داره که هر دو حالت (لایو و آفلاین) بهش وصل می‌مونن
function statusRoomNameFor(streamerId) {
  return `channel-status:${streamerId}`
}

// فاز ۱۹: تعداد بیننده‌ی واقعی. تا قبل از این، viewerCount یه عدد ثابت از seed بود که با
// Go live هم تکون نمی‌خورد. حالا که هر بیننده‌ی یه کانالِ لایو یه سوکت تو اتاق همون کانال
// داره، خودِ اندازه‌ی اتاق همون «چند نفر الان دارن نگاه می‌کنن» ئه - بدون هیچ ذخیره‌سازی
// جدید، دقیقاً به همون دلیلی که followerCount هم ذخیره نمی‌شه و همیشه شمرده می‌شه
async function broadcastViewerCount(io, streamerId) {
  const room = roomNameFor(streamerId)
  const sockets = await io.in(room).fetchSockets()
  io.to(room).emit('viewers:count', sockets.length)
}

// سوکت برخلاف درخواست‌های HTTP از cookie-parser رد نمی‌شه، پس هدر خام کوکی رو خودمون
// می‌خونیم. عمداً یه پکیج جدید براش نصب نکردیم - همین چند خط کافیه
function readTokenFromCookieHeader(cookieHeader) {
  if (!cookieHeader) return null

  for (const part of cookieHeader.split(';')) {
    const [name, ...valueParts] = part.trim().split('=')
    if (name === 'token') {
      return decodeURIComponent(valueParts.join('='))
    }
  }
  return null
}

// پیام دیتابیسی رو به همون شکلی درمیاره که فرانت لازم داره - عین کاری که sanitize‌های
// بقیه‌ی روت‌ها می‌کنن (فرانت به کل شیء User نیازی نداره، فقط یوزرنیم)
function sanitizeMessage(message) {
  return {
    id: message.id,
    content: message.content,
    authorUsername: message.author.username,
    createdAt: message.createdAt,
  }
}

// فاز ۲۳: بعضی رویدادها (مثل پایان لایو) از یه route معمولیِ HTTP اتفاق می‌افتن
// (streamers.js)، نه از داخل همین فایل - ولی برای خبر دادن به بیننده‌ها بازم به همون io و
// همون اتاق نیاز داریم. به‌جای اینکه io رو مستقیم export کنیم و route مجبور بشه جزئیات
// اتاق‌بندی (roomNameFor) رو هم بلد باشه، یه تابع کوچیک export می‌کنیم که این جزئیات رو
// همینجا مخفی نگه می‌داره
let ioInstance = null

// چت زنده رو به همون سرور HTTP اکسپرس می‌چسبونه (نه یه پورت جدا)، تا کوکی httpOnly ای
// که برای /api ست شده، همینجا هم بدون تنظیمات اضافه معتبر باشه
function attachChat(httpServer) {
  const io = new Server(httpServer, {
    // عین همون cors ای که تو app.js برای اکسپرس ست شده - بدون credentials، مرورگر
    // اصلاً کوکی رو با handshake نمی‌فرسته و همه مهمون حساب می‌شدن
    cors: { origin: process.env.CLIENT_ORIGIN, credentials: true },
  })

  ioInstance = io

  // احراز هویت موقع اتصال، نه موقع هر پیام: یه بار توکن رو می‌خونیم و نتیجه‌ش تا آخر
  // عمر این سوکت می‌مونه.
  // نبودِ توکن اتصال رو رد نمی‌کنه - مهمون هم باید بتونه چت رو بخونه، فقط نمی‌تونه
  // پیام بفرسته (اون چک موقع ارسال انجام می‌شه)
  io.use((socket, next) => {
    const token = readTokenFromCookieHeader(socket.handshake.headers.cookie)
    socket.data.userId = null

    if (token) {
      try {
        socket.data.userId = verifyToken(token).userId
      } catch {
        // توکن نامعتبر یا منقضی - همون مهمون می‌مونه
      }
    }

    // زمان پیام‌های اخیرِ همین سوکت، برای محدودیت سرعت
    socket.data.recentMessageTimes = []
    next()
  })

  io.on('connection', (socket) => {
    // وارد شدن به یه کانال. اتاق قبلی رو ترک می‌کنیم چون کاربر ممکنه بدون قطع کردن سوکت
    // از یه کانال به کانال دیگه بره - وگرنه هم‌زمان پیام هر دو کانال رو می‌گرفت
    socket.on('chat:join', async (streamerId) => {
      if (typeof streamerId !== 'string' || !streamerId) return

      const previousStreamerId = socket.data.streamerId
      if (previousStreamerId) {
        socket.leave(roomNameFor(previousStreamerId))
      }
      socket.data.streamerId = streamerId
      socket.join(roomNameFor(streamerId))

      // هر دو اتاق باید خبردار بشن: اتاق قبلی یکی کم شده، اتاق جدید یکی زیاد
      if (previousStreamerId) {
        await broadcastViewerCount(io, previousStreamerId)
      }
      await broadcastViewerCount(io, streamerId)

      // آخرین پیام‌ها رو با desc می‌گیریم (چون «آخرین‌ها» یعنی از ته جدول)، بعد برعکسشون
      // می‌کنیم تا تو UI به ترتیب طبیعی زمان، از قدیم به جدید، چیده بشن
      const recent = await prisma.chatMessage.findMany({
        where: { streamerId },
        orderBy: { createdAt: 'desc' },
        take: HISTORY_LIMIT,
        include: { author: { select: { username: true } } },
      })
      socket.emit('chat:history', recent.reverse().map(sanitizeMessage))
    })

    socket.on('chat:send', async (payload) => {
      if (!socket.data.userId) {
        socket.emit('chat:error', 'You need to log in to chat')
        return
      }
      if (!socket.data.streamerId) return

      const content = String(payload?.content || '').trim()
      if (!content || content.length > MAX_MESSAGE_LENGTH) {
        socket.emit('chat:error', `Message must be 1-${MAX_MESSAGE_LENGTH} characters`)
        return
      }

      // فقط پیام‌های داخل پنجره‌ی زمانی رو نگه می‌داریم؛ بقیه دیگه به سقف ربطی ندارن
      const now = Date.now()
      socket.data.recentMessageTimes = socket.data.recentMessageTimes.filter(
        (time) => now - time < RATE_LIMIT_WINDOW_MS,
      )
      if (socket.data.recentMessageTimes.length >= RATE_LIMIT_MAX) {
        socket.emit('chat:error', 'You are sending messages too fast')
        return
      }
      socket.data.recentMessageTimes.push(now)

      try {
        const message = await prisma.chatMessage.create({
          data: {
            content,
            authorId: socket.data.userId,
            streamerId: socket.data.streamerId,
          },
          include: { author: { select: { username: true } } },
        })

        // io.to (نه socket.to) یعنی خودِ فرستنده هم پیام رو می‌گیره - اینجوری پیام فقط
        // یک بار و از یه مسیر واحد به UI می‌رسه، به‌جای اینکه فرستنده یه نسخه‌ی محلی
        // بسازه و بقیه یه نسخه‌ی سروری (که می‌تونستن با هم فرق کنن)
        io.to(roomNameFor(socket.data.streamerId)).emit('chat:message', sanitizeMessage(message))
      } catch (error) {
        console.error(error)
        socket.emit('chat:error', 'Could not send your message')
      }
    })

    // فاز ۲۳: بدون شرکت تو چت یا شمارش بیننده، فقط منتظر خبر شروع/پایان لایو می‌مونه.
    // ChannelPage این رو همیشه صدا می‌زنه (چه لایو چه آفلاین)، برخلاف chat:join که فقط
    // وقتی تب چت واقعاً روی صفحه‌ست زده می‌شه
    socket.on('status:subscribe', (streamerId) => {
      if (typeof streamerId !== 'string' || !streamerId) return
      socket.join(statusRoomNameFor(streamerId))
    })

    // 'disconnect' (نه 'disconnecting') چون تا اون لحظه سوکت از اتاق بیرون رفته و
    // fetchSockets عدد درستِ بعد از رفتنش رو می‌ده، نه یکی بیشتر
    socket.on('disconnect', () => {
      if (socket.data.streamerId) {
        broadcastViewerCount(io, socket.data.streamerId)
      }
    })
  })

  return io
}

// وقتی یه استریمر لایو/آفلاین می‌شه، go-live و go-offline (تو streamers.js) این رو صدا
// می‌زنن تا بدون رفرش به بیننده‌های همون کانال خبر بدن. اگه هنوز هیچ سوکتی وصل نشده باشه
// (مثلاً تست بدون چت)، ioInstance خالیه و بی‌سروصدا هیچ کاری نمی‌کنیم
function emitToChannel(streamerId, event, payload) {
  if (!ioInstance) return
  // به هر دو اتاق می‌فرستیم: کسی که همین الان تو چت نشسته (اتاق چت) و کسی که فقط
  // صفحه‌ی کانال رو باز نگه داشته و منتظره (اتاق status) - هر دو باید بی‌نیاز از
  // رفرش با خبر بشن
  ioInstance.to(roomNameFor(streamerId)).emit(event, payload)
  ioInstance.to(statusRoomNameFor(streamerId)).emit(event, payload)
}

export default attachChat
export { emitToChannel }
