// این اسکریپت دیتای mock قبلی (که تو فرانت‌اند تو src/data بود) رو می‌ریزه تو دیتابیس -
// اجراش با: node prisma/seed.js  (یا  npx prisma db seed)
// upsert استفاده شده تا اجرای چندباره‌ش خطا نده و فقط دیتا رو آپدیت کنه، نه duplicate بسازه.
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// فاز ۱: حالا هر استریمر باید به یه User وصل باشه، پس برای ۸ استریمر نمونه ۸ تا کاربر نمونه
// هم می‌سازیم؛ یوزرنیم‌شون دقیقاً همون یوزرنیم استریمره تا بشه باهاش لاگین کرد و استودیوی
// همون کانال رو دید. پسورد همه‌شون یکیه (فقط برای تست لوکاله - رو دیپلوی واقعی این کار غلطه)
const SEED_PASSWORD = 'catstream123'

// دقیقاً همون ۸ کتگوری‌ای که قبلاً تو src/data/categories.js بود.
// tags اینجا یه آرایه‌ی معمولیه، ولی موقع ذخیره با join(',') به رشته تبدیل می‌شه
// چون ستون tags تو دیتابیس از نوع String هست (دلیلش تو schema.prisma توضیح داده شده).
const categories = [
  {
    id: 'valorant',
    name: 'Valorant',
    boxArtImage: 'https://placehold.co/300x400/1e293b/1e293b',
    viewerCount: 184230,
    tags: ['FPS', 'Competitive'],
  },
  {
    id: 'league-of-legends',
    name: 'League of Legends',
    boxArtImage: 'https://placehold.co/300x400/312e81/312e81',
    viewerCount: 231110,
    tags: ['MOBA', 'Strategy'],
  },
  {
    id: 'elden-ring',
    name: 'Elden Ring',
    boxArtImage: 'https://placehold.co/300x400/134e4a/134e4a',
    viewerCount: 42890,
    tags: ['Souls-like', 'RPG'],
  },
  {
    id: 'minecraft',
    name: 'Minecraft',
    boxArtImage: 'https://placehold.co/300x400/3f2d54/3f2d54',
    viewerCount: 98760,
    tags: ['Sandbox', 'Survival'],
  },
  {
    id: 'counter-strike-2',
    name: 'Counter-Strike 2',
    boxArtImage: 'https://placehold.co/300x400/4a2c2c/4a2c2c',
    viewerCount: 156420,
    tags: ['FPS', 'Competitive'],
  },
  {
    id: 'just-chatting',
    name: 'Just Chatting',
    boxArtImage: 'https://placehold.co/300x400/2d3a1f/2d3a1f',
    viewerCount: 276980,
    tags: ['IRL', 'Talk Show'],
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    boxArtImage: 'https://placehold.co/300x400/1f2937/1f2937',
    viewerCount: 88410,
    tags: ['Battle Royale'],
  },
  {
    id: 'stardew-valley',
    name: 'Stardew Valley',
    boxArtImage: 'https://placehold.co/300x400/3a2a1f/3a2a1f',
    viewerCount: 15230,
    tags: ['Simulation', 'Cozy'],
  },
]

// دقیقاً همون ۸ استریمر قبلی. آرایه ترتیبش عمداً حفظ شده تا موقع seed هم به همین ترتیب
// ساخته بشن (چون تو روت‌ها با orderBy: { createdAt: 'asc' } همین ترتیب رو برمی‌گردونیم).
// فاز ۹: liveMinutesAgo فقط برای استریمرهای لایو - همون‌جوری که daysAgo پایین برای ویدیوها
// موقع seed کردن به یه liveSince واقعی تبدیل می‌شه (نه یه عدد ثابت). بدون این، همه‌ی
// استریمرهای لایو liveSince=null می‌موندن (چون این فیلد فاز ۴ اضافه شد، بعد از این‌که این‌ها
// اولین بار seed شده بودن) و سورت «Recently live» تو Browse چیزی برای مرتب کردن نداشت
// فاز ۱۱: goalTitle/goalTarget عمداً فقط رو چند تا از استریمرها ست شده، نه همه - تا هم
// حالت «هدف داره» هم حالت «هدفی تنظیم نکرده» تو UI قابل تسته. عددها هم عمداً کوچیکن
// (نه مثلاً ۵۰۰) چون تو seed هیچ Follow ای ساخته نمی‌شه - پیشرفت واقعی فقط از فالوی
// واقعیِ کاربرهای تستی میاد، پس هدف باید با چندتا فالوی دستی واقع‌بینانه قابل رسیدن باشه
const streamers = [
  {
    username: 'PixelWolf',
    avatarImage: '/avatars/cat-1.png',
    isLive: true,
    liveMinutesAgo: 134,
    viewerCount: 12482,
    categoryId: 'valorant',
    streamTitle: 'Ranked grind to Radiant // road to top 500',
    thumbnailImage: 'https://placehold.co/640x360/1e293b/1e293b',
    description:
      'Full-time Valorant grinder, currently Immortal 3 and pushing for Radiant this act. Duo queue welcome in chat — drop your rank and agent pool and I might pull you up next game.',
    socialLinks: 'twitter.com/pixelwolf,youtube.com/pixelwolf',
    goalTitle: 'Follower goal — road to a duo-queue giveaway',
    goalTarget: 10,
  },
  {
    username: 'NovaQueen',
    avatarImage: '/avatars/cat-2.png',
    isLive: true,
    liveMinutesAgo: 42,
    viewerCount: 8790,
    categoryId: 'league-of-legends',
    streamTitle: 'Climbing to Challenger with viewers picking my build',
    thumbnailImage: 'https://placehold.co/640x360/312e81/312e81',
    description:
      "Chat literally drafts my build every game — vote in the poll on screen. Currently Grandmaster, mid/jungle main. New here? Say hi, I read chat between games.",
    socialLinks: 'twitter.com/novaqueen',
  },
  {
    username: 'GrimHunter',
    avatarImage: '/avatars/cat-3.png',
    isLive: true,
    liveMinutesAgo: 301,
    viewerCount: 5321,
    categoryId: 'elden-ring',
    streamTitle: 'No-hit boss run attempt #47',
    thumbnailImage: 'https://placehold.co/640x360/134e4a/134e4a',
    description:
      "Attempt 47 at a full no-hit run through the DLC. No summons, no spirit ashes. It's going about as well as you'd expect. Clip the deaths, chat, that's what they're there for.",
    socialLinks: 'youtube.com/grimhunter,twitch.tv/grimhunter',
  },
  {
    username: 'BlockBuilderAmy',
    avatarImage: '/avatars/cat-4.png',
    isLive: true,
    liveMinutesAgo: 18,
    viewerCount: 3104,
    categoryId: 'minecraft',
    streamTitle: 'Building a floating city, chat helps design it',
    thumbnailImage: 'https://placehold.co/640x360/3f2d54/3f2d54',
    description:
      'Slowly building a floating city district by district — chat votes on the theme for each new island. Survival world, no creative shortcuts, everything hand-mined.',
    socialLinks: 'instagram.com/blockbuilderamy',
  },
  {
    username: 'SilentAce',
    avatarImage: '/avatars/cat-5.png',
    isLive: true,
    liveMinutesAgo: 67,
    viewerCount: 21870,
    categoryId: 'counter-strike-2',
    streamTitle: 'FACEIT Level 10 grind — road to major',
    thumbnailImage: 'https://placehold.co/640x360/4a2c2c/4a2c2c',
    description:
      'FACEIT Level 10, ex-semi-pro. Streaming the grind back toward competitive play, one queue at a time. Coaching VOD reviews on Fridays for subs.',
    socialLinks: 'twitter.com/silentace',
    goalTitle: 'Followers goal — free VOD review giveaway',
    goalTarget: 20,
  },
  {
    username: 'LunaTalks',
    avatarImage: '/avatars/cat-6.png',
    isLive: true,
    liveMinutesAgo: 205,
    viewerCount: 6543,
    categoryId: 'just-chatting',
    streamTitle: "Sunday chill stream — ask me anything",
    thumbnailImage: 'https://placehold.co/640x360/2d3a1f/2d3a1f',
    description:
      "Just vibes and conversation today — ask me anything, or don't, and we'll just hang out. Music requests welcome, no spoilers for the show I'm currently watching please.",
    socialLinks: 'instagram.com/lunatalks',
  },
  {
    username: 'ZephyrPlays',
    avatarImage: '/avatars/cat-7.png',
    isLive: false,
    viewerCount: 0,
    categoryId: 'fortnite',
    streamTitle: 'Offline — back tomorrow at 6pm',
    thumbnailImage: 'https://placehold.co/640x360/1f2937/1f2937',
    description:
      'Offline right now — back tomorrow at 6pm for more Fortnite ranked. Follow to get notified the second I go live.',
    socialLinks: 'twitter.com/zephyrplays',
  },
  {
    username: 'CozyMara',
    avatarImage: '/avatars/cat-8.png',
    isLive: true,
    liveMinutesAgo: 9,
    viewerCount: 2210,
    categoryId: 'stardew-valley',
    streamTitle: 'Farming season 3, decorating the barn today',
    thumbnailImage: 'https://placehold.co/640x360/3a2a1f/3a2a1f',
    description:
      'Cozy, low-key Stardew Valley farm run — today we\'re decorating the barn and finally organizing the shed. No rush, no meta, just a nice farm.',
    socialLinks: 'instagram.com/cozymara',
    goalTitle: 'Cozy corner follower goal',
    goalTarget: 8,
  },
]

// فاز ۳: دقیقاً همون ۲۰ ویدیوی نمونه‌ای که قبلاً تو src/data/videos.js بود. id هایی مثل
// 'v1' فقط داخل همین اسکریپت معنی دارن (تا پلی‌لیست‌های پایین بتونن به ویدیوهاشون اشاره
// کنن) - تو خودِ دیتابیس ذخیره نمی‌شن، Video.id واقعی یه cuid تازه‌ست.
// daysAgo هم فقط موقع seed کردن به یه createdAt واقعی تبدیل می‌شه (پایین‌تر، تو main).
const videos = [
  // PixelWolf - Valorant
  { id: 'v1', title: 'INSANE 1v5 clutch on Ascent', streamerUsername: 'PixelWolf', thumbnailImage: 'https://placehold.co/640x360/1e293b/1e293b', viewCount: 45210, durationMinutes: 12, daysAgo: 1 },
  { id: 'v2', title: 'Radiant lobby review — what I did wrong', streamerUsername: 'PixelWolf', thumbnailImage: 'https://placehold.co/640x360/243049/243049', viewCount: 21400, durationMinutes: 47, daysAgo: 4 },
  { id: 'v3', title: 'Full ranked session — Immortal 3 to Radiant', streamerUsername: 'PixelWolf', thumbnailImage: 'https://placehold.co/640x360/2b3a5c/2b3a5c', viewCount: 88900, durationMinutes: 196, daysAgo: 9 },

  // NovaQueen - League of Legends
  { id: 'v4', title: 'How I hit Challenger in 2 weeks (full VOD)', streamerUsername: 'NovaQueen', thumbnailImage: 'https://placehold.co/640x360/312e81/312e81', viewCount: 128900, durationMinutes: 184, daysAgo: 3 },
  { id: 'v5', title: 'Every champion I banned this season, ranked', streamerUsername: 'NovaQueen', thumbnailImage: 'https://placehold.co/640x360/3b3599/3b3599', viewCount: 52300, durationMinutes: 26, daysAgo: 6 },
  { id: 'v6', title: 'Coaching a viewer out of Silver', streamerUsername: 'NovaQueen', thumbnailImage: 'https://placehold.co/640x360/2a2570/2a2570', viewCount: 17650, durationMinutes: 91, daysAgo: 12 },

  // GrimHunter - Elden Ring
  { id: 'v7', title: 'Malenia no-hit — finally got it', streamerUsername: 'GrimHunter', thumbnailImage: 'https://placehold.co/640x360/134e4a/134e4a', viewCount: 76340, durationMinutes: 38, daysAgo: 2 },
  { id: 'v8', title: 'Attempt #46 and everything that went wrong', streamerUsername: 'GrimHunter', thumbnailImage: 'https://placehold.co/640x360/0f3e3a/0f3e3a', viewCount: 29800, durationMinutes: 143, daysAgo: 7 },

  // BlockBuilderAmy - Minecraft
  { id: 'v9', title: 'We built a floating city in one stream', streamerUsername: 'BlockBuilderAmy', thumbnailImage: 'https://placehold.co/640x360/3f2d54/3f2d54', viewCount: 19870, durationMinutes: 210, daysAgo: 5 },
  { id: 'v10', title: 'Redstone door that actually works', streamerUsername: 'BlockBuilderAmy', thumbnailImage: 'https://placehold.co/640x360/4a3663/4a3663', viewCount: 41200, durationMinutes: 18, daysAgo: 11 },

  // SilentAce - Counter-Strike 2
  { id: 'v11', title: 'Ace on Mirage — full round POV', streamerUsername: 'SilentAce', thumbnailImage: 'https://placehold.co/640x360/4a2c2c/4a2c2c', viewCount: 33120, durationMinutes: 9, daysAgo: 1 },
  { id: 'v12', title: 'FACEIT level 10 grind, day 14', streamerUsername: 'SilentAce', thumbnailImage: 'https://placehold.co/640x360/5c3636/5c3636', viewCount: 64800, durationMinutes: 167, daysAgo: 3 },
  { id: 'v13', title: 'Crosshair and settings tour (2026)', streamerUsername: 'SilentAce', thumbnailImage: 'https://placehold.co/640x360/3a2222/3a2222', viewCount: 112400, durationMinutes: 22, daysAgo: 15 },

  // LunaTalks - Just Chatting
  { id: 'v14', title: 'Answering your questions for 3 hours', streamerUsername: 'LunaTalks', thumbnailImage: 'https://placehold.co/640x360/2d3a1f/2d3a1f', viewCount: 8760, durationMinutes: 175, daysAgo: 4 },
  { id: 'v15', title: 'Reading your worst roommate stories', streamerUsername: 'LunaTalks', thumbnailImage: 'https://placehold.co/640x360/38492a/38492a', viewCount: 24300, durationMinutes: 68, daysAgo: 8 },

  // ZephyrPlays - Fortnite
  { id: 'v16', title: 'Solo squad win with only a pistol', streamerUsername: 'ZephyrPlays', thumbnailImage: 'https://placehold.co/640x360/1f3a4a/1f3a4a', viewCount: 15900, durationMinutes: 24, daysAgo: 6 },
  { id: 'v17', title: 'Every new season mechanic explained', streamerUsername: 'ZephyrPlays', thumbnailImage: 'https://placehold.co/640x360/29485c/29485c', viewCount: 37600, durationMinutes: 41, daysAgo: 13 },

  // CozyMara - Stardew Valley
  { id: 'v18', title: 'Barn makeover, part one', streamerUsername: 'CozyMara', thumbnailImage: 'https://placehold.co/640x360/3a2a1f/3a2a1f', viewCount: 42100, durationMinutes: 54, daysAgo: 2 },
  { id: 'v19', title: 'Winter prep speedrun', streamerUsername: 'CozyMara', thumbnailImage: 'https://placehold.co/640x360/4a3626/4a3626', viewCount: 27400, durationMinutes: 31, daysAgo: 5 },
  { id: 'v20', title: 'Full farm tour 2026', streamerUsername: 'CozyMara', thumbnailImage: 'https://placehold.co/640x360/2b1f16/2b1f16', viewCount: 61200, durationMinutes: 62, daysAgo: 14 },
]

// فاز ۳: دقیقاً همون ۸ پلی‌لیست نمونه‌ای که قبلاً تو src/data/playlists.js بود.
// videoIds همون id های موقتیِ بالان (v1، v2، ...) - ترتیبشون تو آرایه همون ترتیب نمایششونه.
const playlists = [
  { title: 'Road to Radiant', streamerUsername: 'PixelWolf', videoIds: ['v1', 'v2', 'v3'] },
  { title: 'Coaching sessions', streamerUsername: 'NovaQueen', videoIds: ['v6', 'v4'] },
  { title: 'Boss fights', streamerUsername: 'GrimHunter', videoIds: ['v7', 'v8'] },
  { title: 'Big builds', streamerUsername: 'BlockBuilderAmy', videoIds: ['v9', 'v10'] },
  { title: 'Best clutches', streamerUsername: 'SilentAce', videoIds: ['v11', 'v12'] },
  { title: 'Setup and settings', streamerUsername: 'SilentAce', videoIds: ['v13'] },
  { title: 'Story time', streamerUsername: 'LunaTalks', videoIds: ['v15', 'v14'] },
  { title: 'Cozy mornings', streamerUsername: 'CozyMara', videoIds: ['v18', 'v19', 'v20'] },
]

async function main() {
  // اول کتگوری‌ها (چون streamer به category نیاز داره / FK) - upsert یعنی اگه بود آپدیت کن،
  // اگه نبود بساز؛ برای اجرای دوباره‌ی امن این اسکریپت لازمه.
  for (const category of categories) {
    await prisma.category.upsert({
      where: { id: category.id },
      update: { ...category, tags: category.tags.join(',') },
      create: { ...category, tags: category.tags.join(',') },
    })
  }
  console.log(`${categories.length} کتگوری seed شد`)

  // فاز ۱: قبل از ساختن استریمرها، برای هرکدوم یه User نمونه می‌سازیم (اگه از قبل نبود) تا
  // بشه userId شو موقع ساختن استریمر بهش داد. update: {} یعنی اگه از قبل بود دست‌نخورده بمونه -
  // اینجوری اگه رمز یا پروفایلشو موقع تست عوض کرده باشی، اجرای دوباره‌ی seed پاکش نمی‌کنه
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10)
  const userIdByStreamerUsername = {}
  for (const streamer of streamers) {
    const user = await prisma.user.upsert({
      where: { username: streamer.username },
      update: {},
      create: {
        username: streamer.username,
        email: `${streamer.username.toLowerCase()}@catstream.test`,
        passwordHash,
        avatarImage: streamer.avatarImage,
      },
    })
    userIdByStreamerUsername[streamer.username] = user.id
  }
  console.log(`${streamers.length} کاربر نمونه seed شد (پسورد همه: ${SEED_PASSWORD})`)

  // upsert رو با username چون همون فیلد unique و طبیعی برای شناسایی هر استریمره
  // (نه id که هر بار cuid تصادفی می‌گیره). id ای که برمی‌گرده رو نگه می‌داریم چون
  // ویدیوها و پلی‌لیست‌های پایین بهش نیاز دارن (streamerId)
  const streamerIdByUsername = {}
  for (const streamer of streamers) {
    // liveMinutesAgo فقط تو همین آرایه معنی داره (برای خوندن راحت‌تر) - قبل از فرستادن
    // به Prisma بیرون می‌کشیمش و به یه liveSince واقعی تبدیلش می‌کنیم
    const { liveMinutesAgo, ...streamerFields } = streamer
    const data = {
      ...streamerFields,
      userId: userIdByStreamerUsername[streamer.username],
      liveSince: liveMinutesAgo !== undefined ? new Date(Date.now() - liveMinutesAgo * 60 * 1000) : null,
    }
    const record = await prisma.streamer.upsert({
      where: { username: streamer.username },
      update: data,
      create: data,
    })
    streamerIdByUsername[streamer.username] = record.id
  }
  console.log(`${streamers.length} استریمر seed شد`)

  // فاز ۳: ویدیوها. createdAt رو همین‌جا از daysAgo می‌سازیم (نه تو تعریف آرایه‌ی بالا)
  // چون باید نسبت به "الان" (لحظه‌ی seed کردن) حساب بشه
  const videoIdByLocalId = {}
  for (const video of videos) {
    const { id: localId, streamerUsername, daysAgo, ...rest } = video
    const data = {
      ...rest,
      streamerId: streamerIdByUsername[streamerUsername],
      createdAt: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
    }
    const record = await prisma.video.upsert({
      where: { streamerId_title: { streamerId: data.streamerId, title: data.title } },
      update: data,
      create: data,
    })
    videoIdByLocalId[localId] = record.id
  }
  console.log(`${videos.length} ویدیو seed شد`)

  // فاز ۳: پلی‌لیست‌ها، بعد برای هرکدوم ردیف‌های PlaylistVideo با ترتیب درست
  for (const playlist of playlists) {
    const { streamerUsername, videoIds, ...rest } = playlist
    const data = { ...rest, streamerId: streamerIdByUsername[streamerUsername] }
    const record = await prisma.playlist.upsert({
      where: { streamerId_title: { streamerId: data.streamerId, title: data.title } },
      update: data,
      create: data,
    })

    for (const [index, localVideoId] of videoIds.entries()) {
      const videoId = videoIdByLocalId[localVideoId]
      await prisma.playlistVideo.upsert({
        where: { playlistId_videoId: { playlistId: record.id, videoId } },
        update: { position: index },
        create: { playlistId: record.id, videoId, position: index },
      })
    }
  }
  console.log(`${playlists.length} پلی‌لیست seed شد`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
