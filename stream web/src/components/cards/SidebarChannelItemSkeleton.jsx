// اسکلتون معادل SidebarChannelItem - ردیف باریک سایدبار (آواتار گرد + دو خط متن)
function SidebarChannelItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-2 py-1.5">
      <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-surface-2" />
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="h-3 w-3/4 animate-pulse rounded bg-surface-2" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-surface-2" />
      </div>
    </div>
  )
}

export default SidebarChannelItemSkeleton
