import { useParams, Link } from 'react-router-dom'
import { useData } from '../context/DataContext'
import StreamCard from '../components/cards/StreamCard'
import StreamCardSkeleton from '../components/cards/StreamCardSkeleton'
import ImageWithSkeleton from '../components/common/ImageWithSkeleton'

function CategoryPage() {
  // مسیر رو "category/:categoryId" تعریف کردیم، پس همون تیکه از آدرس اینجا برمی‌گرده
  const { categoryId } = useParams()
  const { streamers, isLoading, getCategoryById } = useData()
  const category = getCategoryById(categoryId)

  // وقتی هنوز داره از سرور لود می‌شه، به‌جای این‌که زودتر از موعد "Category not found"
  // نشون بدیم (چون لیست هنوز خالیه)، یه هدر و گرید اسکلتونی نشون می‌دیم
  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex items-start gap-4">
          <div className="h-32 w-24 shrink-0 animate-pulse rounded-lg bg-surface-2 sm:h-40 sm:w-28" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 pt-1">
            <div className="h-5 w-40 animate-pulse rounded bg-surface-2" />
            <div className="h-3.5 w-24 animate-pulse rounded bg-surface-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <StreamCardSkeleton key={index} />
          ))}
        </div>
      </div>
    )
  }

  if (!category) {
    return (
      <div>
        <p className="mb-3 text-text-dim">Category not found.</p>
        <Link to="/browse" className="text-accent">
          Back to Browse
        </Link>
      </div>
    )
  }

  // فقط استریمرهای همین کتگوری که الان لایو هستن، از پرمخاطب به کم‌مخاطب
  const liveStreamers = [...streamers]
    .filter((streamer) => streamer.categoryId === category.id && streamer.isLive)
    .sort((a, b) => b.viewerCount - a.viewerCount)

  return (
    <div className="flex flex-col gap-6">
      {/* هدر کتگوری: باکس‌آرت کنار اسم و تگ‌ها، شبیه هدر بالای صفحه‌ی کتگوری تو سایت‌های واقعی */}
      <div className="flex items-start gap-4">
        <ImageWithSkeleton
          src={category.boxArtImage}
          alt={category.name}
          className="h-32 w-24 shrink-0 rounded-lg object-cover sm:h-40 sm:w-28"
        />
        <div className="flex min-w-0 flex-col gap-2 pt-1">
          <h1 className="font-brand text-xl font-bold text-text">{category.name}</h1>
          <p className="text-sm text-text-dim">
            {category.viewerCount.toLocaleString()} viewers
          </p>
          <div className="flex flex-wrap gap-2">
            {/* فاز ۹: تگ‌ها دیگه فقط تزئینی نیستن - کلیک روش می‌بره صفحه‌ی Browse با
                همون تگ فیلترشده (هم کتگوری‌های دیگه‌ای که این تگ رو دارن، هم لایوهاشون) */}
            {category.tags.map((tag) => (
              <Link
                key={tag}
                to={`/browse?tag=${encodeURIComponent(tag)}`}
                className="rounded-full bg-surface-2 px-2.5 py-1 text-xs font-medium text-text-dim transition-colors hover:text-text"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <section>
        <h2 className="mb-4 font-brand text-lg font-bold text-text">
          Live Channels
        </h2>
        {liveStreamers.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {liveStreamers.map((streamer) => (
              <StreamCard
                key={streamer.id}
                thumbnailImage={streamer.thumbnailImage}
                avatarImage={streamer.avatarImage}
                username={streamer.username}
                streamTitle={streamer.streamTitle}
                categoryName={category.name}
                viewerCount={streamer.viewerCount}
                isLive={streamer.isLive}
              />
            ))}
          </div>
        ) : (
          <p className="text-text-dim">No live channels in this category right now.</p>
        )}
      </section>
    </div>
  )
}

export default CategoryPage
