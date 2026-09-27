// دسته‌بندی بازی‌ها — همون چیزی که تو صفحه‌ی Browse و سایدبار به صورت کارت نمایش داده می‌شه.
// boxArtImage از placehold.co میاد (یه باکس رنگی ساده) چون picsum.photos رو شبکه‌ی تو لود نمی‌شد.
// وقتی دیتای واقعی جایگزین شد، فقط همین یک فیلد رو با آدرس واقعی عوض می‌کنیم.
export const categories = [
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
