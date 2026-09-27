// تا زمانی که لیست استریمرها از سرور برسه، به‌جای یه گرید خالی یا پرش ناگهانی،
// چندتا کارت اسکلتون در حال پالس نشون می‌دیم - دقیقاً هم‌شکل و هم‌اندازه‌ی خود StreamCard
function StreamCardSkeleton() {
  return (
    <div>
      <div className="aspect-video animate-pulse rounded-lg bg-surface-2" />
      <div className="mt-2 flex gap-2">
        <div className="h-9 w-9 shrink-0 animate-pulse rounded-full bg-surface-2" />
        <div className="min-w-0 flex-1 space-y-1.5 py-0.5">
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-surface-2" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-surface-2" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-surface-2" />
        </div>
      </div>
    </div>
  )
}

export default StreamCardSkeleton
