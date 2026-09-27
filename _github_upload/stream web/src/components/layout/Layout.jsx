import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { useData } from '../../context/DataContext'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import RouteLoader from './RouteLoader'
import AuthModal from '../auth/AuthModal'

function Layout() {
  const { loadError } = useData()
  // سایدبار رو دسکتاپ پیش‌فرض بازه، ولی رو موبایل بسته - چون اونجا روی کل صفحه میاد
  // و اگه از اول باز باشه، اولین چیزی که کاربر می‌بینه یه منوی تمام‌صفحه‌ست
  const [isSidebarOpen, setIsSidebarOpen] = useState(() => window.innerWidth >= 768)

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <Navbar onMenuClick={() => setIsSidebarOpen((open) => !open)} />

      {/* اگه بک‌اند بالا نباشه (یا fetch لیست استریمرها/کتگوری‌ها fail بشه)، یه نوار خطای
          کوچیک بالای صفحه نشون می‌دیم - به‌جای این‌که کاربر با یه سایت کاملاً خالی روبرو بشه */}
      {loadError && (
        <div className="flex items-center justify-center gap-2 border-b border-border bg-surface-2 px-4 py-2 text-center text-sm text-text-dim">
          <svg
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <path d="M12 9v4M12 17h.01" />
          </svg>
          {loadError}
        </div>
      )}

      <div className="flex flex-1">
        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

        {/* Outlet جای همون صفحه‌ای رو نگه می‌داره که آدرس فعلی به‌اش اشاره می‌کنه
            (Home یا Browse یا Channel) — قبلاً این جای children بود، الان روتر خودش تصمیم می‌گیره.
            overflow-y-auto عمداً برداشته شد: چون این باکس ارتفاع محدودی نداشت (فقط min-h-screen
            رو کانتینر بیرونیه)، هیچ‌وقت واقعاً اسکرول داخلی نمی‌شد و کل صفحه با پنجره اسکرول می‌شد؛
            ولی همین overflow:auto باعث می‌شد این عنصر یه "scroll container" جدا از پنجره حساب بشه،
            و هر position:sticky داخلش (مثل باکس چت تو صفحه‌ی چنل) دیگه درست کار نکنه */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* گیف لودینگ که موقع عوض شدن صفحه یه لحظه روی همه‌چی میاد */}
      <RouteLoader />

      {/* لاگین/ساین‌آپ یه مودال پاپ‌آپه که روی همین Layout می‌شینه، نه یه صفحه‌ی جدا؛
          خودش وقتی authModal تو context خالیه چیزی رندر نمی‌کنه */}
      <AuthModal />
    </div>
  )
}

export default Layout
