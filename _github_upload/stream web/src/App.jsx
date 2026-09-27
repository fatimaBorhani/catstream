import { Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { ToastProvider } from './context/ToastContext'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import BrowsePage from './pages/BrowsePage'
import ChannelPage from './pages/ChannelPage'
import CategoryPage from './pages/CategoryPage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import FollowingPage from './pages/FollowingPage'
import PublicProfilePage from './pages/PublicProfilePage'
import WatchPage from './pages/WatchPage'

function App() {
  return (
    // ToastProvider از همه بیرونی‌تره چون به هیچی وابسته نیست و هر جای سایت (حتی نوبار)
    // باید بتونه یه پیام نشون بده.
    // DataProvider بعدشه چون خیلی از صفحه‌ها (حتی Navbar تو Layout) بهش نیاز دارن؛
    // AuthProvider هم دور کل روت‌هاست تا هر صفحه‌ای به state لاگین دسترسی داشته باشه.
    // لاگین/ساین‌آپ دیگه صفحه‌ی جدا نیست، یه مودال (AuthModal) روی همین Layout پاپ‌آپ می‌شه
    <ToastProvider>
      <DataProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="browse" element={<BrowsePage />} />
              <Route path="category/:categoryId" element={<CategoryPage />} />
              <Route path="channel/:username" element={<ChannelPage />} />
              <Route path="following" element={<FollowingPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="user/:username" element={<PublicProfilePage />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="watch/:videoId" element={<WatchPage />} />
            </Route>
          </Routes>
        </AuthProvider>
      </DataProvider>
    </ToastProvider>
  )
}

export default App
