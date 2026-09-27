import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../context/DataContext'
import CategoryCard from '../components/cards/CategoryCard'
import StreamCard from '../components/cards/StreamCard'
import CategoryCardSkeleton from '../components/cards/CategoryCardSkeleton'
import StreamCardSkeleton from '../components/cards/StreamCardSkeleton'

const SKELETON_COUNT = 8

function BrowsePage() {
  const { streamers, categories, isLoading } = useData()
  // فاز ۹: انتخاب تگ رو تو خودِ آدرس صفحه (?tag=...) نگه می‌داریم، نه یه useState ساده -
  // اینجوری لینکی که از تگ‌های صفحه‌ی کتگوری میاد (CategoryPage) می‌تونه مستقیم یه فیلتر
  // رو باز کنه، و خودِ این صفحه هم قابل اشتراک‌گذاری/بوکمارک‌کردن با همون فیلتر می‌مونه
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTag = searchParams.get('tag')
  const [activeTab, setActiveTab] = useState('categories')
  const [liveSortBy, setLiveSortBy] = useState('viewers')

  function selectTag(tag) {
    if (tag === null) {
      searchParams.delete('tag')
    } else {
      searchParams.set('tag', tag)
    }
    setSearchParams(searchParams)
  }

  // فاز ۹: قبلاً اینجا یه لیست دستی از «گروه»های سلیقه‌ای بود (Competitive, Adventure...)
  // که هیچ ربط مستقیمی به تگ‌های واقعی هر کتگوری (category.tags) نداشت - دوتا دیتای جدا
  // که باید دستی هماهنگ نگه‌شون می‌داشتیم. حالا مستقیم از رو خودِ تگ‌های واقعی یه لیست
  // یکتا می‌سازیم: هم دقیق‌تره، هم با هر کتگوری‌ای که بعداً اضافه بشه خودش به‌روز می‌مونه
  const allTags = [...new Set(categories.flatMap((category) => category.tags))].sort()

  const filteredCategories = activeTag
    ? categories.filter((category) => category.tags.includes(activeTag))
    : categories
  const filteredCategoryIds = new Set(filteredCategories.map((category) => category.id))

  const filteredLiveStreamers = [...streamers]
    .filter((streamer) => streamer.isLive)
    .filter((streamer) => filteredCategoryIds.has(streamer.categoryId))
    .sort((a, b) => {
      if (liveSortBy === 'recent') {
        // liveSince ممکنه null باشه (یعنی از قبل از فاز ۴ لایو بوده و هیچ‌وقت با دکمه‌ی
        // Go live توی داشبورد ست نشده) - همچین موردی رو ته لیست می‌ذاریم، نه اول
        const aTime = a.liveSince ? new Date(a.liveSince).getTime() : 0
        const bTime = b.liveSince ? new Date(b.liveSince).getTime() : 0
        return bTime - aTime
      }
      return b.viewerCount - a.viewerCount
    })

  return (
    <div>
      <h2 className="mb-4 font-brand text-lg font-bold text-text">Browse</h2>

      {/* ردیف پیل‌های تگ - overflow-x-auto تا تو موبایل که جا کم میاد، به‌جای شکستن خط،
          افقی اسکرول بشه */}
      <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => selectTag(null)}
          className={
            activeTag === null
              ? 'shrink-0 rounded-full bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent/20 transition-all active:scale-95'
              : 'shrink-0 rounded-full bg-surface-2 px-4 py-2 text-sm font-medium text-text-dim transition-all hover:text-text active:scale-95'
          }
        >
          All
        </button>
        {allTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => selectTag(tag)}
            className={
              activeTag === tag
                ? 'shrink-0 rounded-full bg-gradient-to-r from-accent to-accent-2 px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent/20 transition-all active:scale-95'
                : 'shrink-0 rounded-full bg-surface-2 px-4 py-2 text-sm font-medium text-text-dim transition-all hover:text-text active:scale-95'
            }
          >
            {tag}
          </button>
        ))}
      </div>

      {/* زیرتب Categories / Live Channels، و کنارش (فقط تو Live) دوتا پیل کوچیک‌تر برای سورت */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border">
        <div className="flex gap-5">
          <button
            type="button"
            onClick={() => setActiveTab('categories')}
            className={`-mb-px border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
              activeTab === 'categories'
                ? 'border-accent text-text'
                : 'border-transparent text-text-dim hover:text-text'
            }`}
          >
            Categories
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={`-mb-px border-b-2 px-1 pb-2 text-sm font-medium transition-colors ${
              activeTab === 'live'
                ? 'border-accent text-text'
                : 'border-transparent text-text-dim hover:text-text'
            }`}
          >
            Live Channels
          </button>
        </div>

        {activeTab === 'live' && (
          <div className="mb-2 flex shrink-0 gap-1.5">
            <button
              type="button"
              onClick={() => setLiveSortBy('viewers')}
              className={
                liveSortBy === 'viewers'
                  ? 'rounded-full bg-gradient-to-r from-accent to-accent-2 px-3.5 py-1.5 text-xs font-semibold text-white'
                  : 'rounded-full bg-surface-2 px-3.5 py-1.5 text-xs font-medium text-text-dim transition-colors hover:text-text'
              }
            >
              Most viewers
            </button>
            <button
              type="button"
              onClick={() => setLiveSortBy('recent')}
              className={
                liveSortBy === 'recent'
                  ? 'rounded-full bg-gradient-to-r from-accent to-accent-2 px-3.5 py-1.5 text-xs font-semibold text-white'
                  : 'rounded-full bg-surface-2 px-3.5 py-1.5 text-xs font-medium text-text-dim transition-colors hover:text-text'
              }
            >
              Recently live
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div
          className={
            activeTab === 'categories'
              ? 'grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6'
              : 'grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
          }
        >
          {Array.from({ length: SKELETON_COUNT }).map((_, index) =>
            activeTab === 'categories' ? (
              <CategoryCardSkeleton key={index} />
            ) : (
              <StreamCardSkeleton key={index} />
            ),
          )}
        </div>
      ) : activeTab === 'categories' ? (
        filteredCategories.length > 0 ? (
          <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {filteredCategories.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                boxArtImage={category.boxArtImage}
                name={category.name}
                viewerCount={category.viewerCount}
              />
            ))}
          </div>
        ) : (
          <p className="text-text-dim">No categories with this tag yet.</p>
        )
      ) : filteredLiveStreamers.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredLiveStreamers.map((streamer) => {
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
      ) : (
        <p className="text-text-dim">No live channels with this tag right now.</p>
      )}
    </div>
  )
}

export default BrowsePage
