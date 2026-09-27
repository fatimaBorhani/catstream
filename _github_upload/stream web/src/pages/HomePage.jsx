import { useData } from '../context/DataContext'
import StreamCard from '../components/cards/StreamCard'
import CategoryCard from '../components/cards/CategoryCard'
import StreamCardSkeleton from '../components/cards/StreamCardSkeleton'
import CategoryCardSkeleton from '../components/cards/CategoryCardSkeleton'

// تعداد کارت اسکلتونی که موقع لودینگ نشون می‌دیم - فقط برای اینکه گرید تو حالت لودینگ
// هم یه شکل معقول و پر داشته باشه، عدد واقعی مهم نیست
const SKELETON_COUNT = 8

function HomePage() {
  const { streamers, categories, isLoading } = useData()

  // فقط استریمرهای لایو رو نشون می‌دیم، از پرمخاطب به کم‌مخاطب مرتب شدن
  const liveStreamers = [...streamers]
    .filter((streamer) => streamer.isLive)
    .sort((a, b) => b.viewerCount - a.viewerCount)

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="mb-4 font-brand text-lg font-bold text-text">
          Live Channels
        </h2>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {isLoading
            ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <StreamCardSkeleton key={index} />
              ))
            : liveStreamers.map((streamer) => {
                const category = categories.find((c) => c.id === streamer.categoryId)
                return (
                  <StreamCard
                    key={streamer.id}
                    thumbnailImage={streamer.thumbnailImage}
                    avatarImage={streamer.avatarImage}
                    username={streamer.username}
                    streamTitle={streamer.streamTitle}
                    categoryName={category ? category.name : ''}
                    viewerCount={streamer.viewerCount}
                    isLive={streamer.isLive}
                  />
                )
              })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 font-brand text-lg font-bold text-text">
          Categories
        </h2>
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {isLoading
            ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                <CategoryCardSkeleton key={index} />
              ))
            : categories.map((category) => (
                <CategoryCard
                  key={category.id}
                  id={category.id}
                  boxArtImage={category.boxArtImage}
                  name={category.name}
                  viewerCount={category.viewerCount}
                />
              ))}
        </div>
      </section>
    </div>
  )
}

export default HomePage
