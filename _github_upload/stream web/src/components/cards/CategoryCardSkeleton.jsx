// اسکلتون معادل CategoryCard - همون منطق StreamCardSkeleton، فقط با نسبت تصویر ۳:۴
function CategoryCardSkeleton() {
  return (
    <div>
      <div className="aspect-[3/4] animate-pulse rounded-lg bg-surface-2" />
      <div className="mt-2 h-3.5 w-3/4 animate-pulse rounded bg-surface-2" />
      <div className="mt-1.5 h-3 w-1/2 animate-pulse rounded bg-surface-2" />
    </div>
  )
}

export default CategoryCardSkeleton
