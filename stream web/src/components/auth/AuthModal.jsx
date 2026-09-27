import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'

// کاشی‌های تزئینی پنل چپ - فقط یه حس کالاژ از تامبنیل‌های محو، بدون عکس واقعی
const COLLAGE_TILES = [
  { width: 150, height: 105, top: 16, left: 130, rotate: -4 },
  { width: 120, height: 82, top: 130, left: 20, rotate: 3 },
  { width: 165, height: 112, top: 190, left: 150, rotate: -2 },
  { width: 110, height: 78, top: 280, left: 10, rotate: 5 },
]

// مودال لاگین/ساین‌آپ - یه پاپ‌آپ روی همون صفحه‌ای که کاربر توشه (نه رفتن به یه صفحه‌ی دیگه)،
// با همون طرح دوستونه‌ای که خودت پسندیدی؛ فلوی ساین‌آپ هم دو مرحله‌ست: اول ایمیل+اسم، بعد یوزرنیم+پسورد
function AuthModal() {
  const { authModal, closeAuthModal, openAuthModal, login, signup, authError } = useAuth()
  const { streamers } = useData()

  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (!authModal) return null

  // برای جمله‌ی سمت چپ («۱۲,۴۸۲ نفر الان دارن PixelWolf رو می‌بینن») از یه دیتای واقعی
  // (پرمخاطب‌ترین استریمر لایو) استفاده می‌کنیم، نه یه عدد ثابت هاردکد. اگه دیتای استریمرها
  // هنوز از سرور نرسیده باشه، streamers خالیه و topStreamer همون undefined می‌مونه (مشکلی نیست،
  // پایین‌تر با topStreamer && چک شده)
  const topStreamer = [...streamers]
    .filter((streamer) => streamer.isLive)
    .sort((a, b) => b.viewerCount - a.viewerCount)[0]

  const isLogin = authModal === 'login'

  // هر بار مودال بین حالت لاگین/ساین‌آپ عوض می‌شه، فیلدها و مرحله رو ریست می‌کنیم
  function switchMode(mode) {
    setStep(1)
    setEmail('')
    setName('')
    setUsername('')
    setPassword('')
    openAuthModal(mode)
  }

  function handleClose() {
    setStep(1)
    closeAuthModal()
  }

  function handleContinueToStep2(event) {
    event.preventDefault()
    if (!email.trim() || !name.trim()) return
    setStep(2)
  }

  // این دوتا الان واقعاً به بک‌اند وصل می‌شن (نه دیگه mock) - برای همین async هستن
  // و تا جواب بیاد دکمه رو غیرفعال می‌کنیم که کاربر دوبار نزنه
  async function handleLoginSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    await login(username, password)
    setIsSubmitting(false)
  }

  async function handleSignupSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    await signup({ username, email, name, password })
    setIsSubmitting(false)
  }

  function handleGuest() {
    handleClose()
  }

  return (
    // بک‌دراپ تیره پشت مودال؛ کلیک روش مودال رو می‌بنده
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={handleClose}
    >
      {/* stopPropagation تا کلیک داخل خود کارت مودال رو نبنده */}
      <div
        onClick={(event) => event.stopPropagation()}
        className="relative flex w-full max-w-3xl overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 rounded-full p-1.5 text-white/70 transition-colors hover:bg-white/10 hover:text-white lg:text-text-dim lg:hover:bg-surface-2 lg:hover:text-text"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        {/* پنل چپ فقط برندینگه، تو موبایل جا نداره پس مخفیه (lg به بالا نشون داده می‌شه) */}
        <div className="relative hidden w-[45%] shrink-0 overflow-hidden bg-gradient-to-br from-[#1b2a4d] via-[#0d1424] to-bg p-8 lg:flex lg:flex-col lg:justify-between">
          <div className="pointer-events-none absolute inset-0">
            {COLLAGE_TILES.map((tile, index) => (
              <div
                key={index}
                className="absolute rounded-xl border border-white/5 bg-gradient-to-br from-accent/25 to-accent-2/5"
                style={{
                  width: tile.width,
                  height: tile.height,
                  top: tile.top,
                  left: tile.left,
                  transform: `rotate(${tile.rotate}deg)`,
                }}
              />
            ))}
          </div>

          <span className="relative flex items-center gap-2">
            <img src="/logo.gif" alt="" className="h-7 w-7 [image-rendering:pixelated]" />
            <span className="font-logo text-xl font-semibold text-white">catstream</span>
          </span>

          {topStreamer && (
            <p className="relative max-w-[16rem] text-sm leading-relaxed text-white/80">
              <span className="mb-1 block font-brand text-base font-bold text-white">
                {topStreamer.viewerCount.toLocaleString()} watching {topStreamer.username}
              </span>
              right now — jump back in as soon as you're signed in.
            </p>
          )}
        </div>

        {/* پنل راست: خود فرم */}
        <div className="flex w-full flex-col justify-center px-6 py-9 sm:px-9">
          <div className="mx-auto w-full max-w-xs">
            {isLogin ? (
              <>
                <h2 className="font-brand text-lg font-bold text-text">Welcome back</h2>
                <p className="mt-1 text-xs text-text-dim">
                  Log in with your username and password.
                </p>

                <form onSubmit={handleLoginSubmit} className="mt-5 flex flex-col gap-3.5">
                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-dim">Username</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                      autoFocus
                      placeholder="NightOwl"
                      className="rounded-md border-2 border-transparent bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-dim transition-all focus:border-accent focus:outline-none"
                    />
                  </label>

                  <label className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-dim">Password</span>
                    <input
                      type="password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder="••••••••"
                      className="rounded-md border-2 border-transparent bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-dim transition-all focus:border-accent focus:outline-none"
                    />
                  </label>

                  {authError && (
                    <p className="text-sm text-red-500">{authError}</p>
                  )}

                  <button
                    type="submit"
                    disabled={!username.trim() || !password || isSubmitting}
                    className="mt-1 rounded-md bg-gradient-to-r from-accent to-accent-2 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-accent/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                  >
                    {isSubmitting ? 'Logging in…' : 'Log In'}
                  </button>

                  <div className="flex items-center gap-3 text-[11px] text-text-dim">
                    <span className="h-px flex-1 bg-border" />
                    or
                    <span className="h-px flex-1 bg-border" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGuest}
                    className="rounded-md border border-border px-4 py-2.5 text-sm font-medium text-text-dim transition-all hover:bg-surface-2 hover:text-text active:scale-95"
                  >
                    Continue as Guest
                  </button>
                </form>

                <p className="mt-5 text-sm text-text-dim">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="font-medium text-accent hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </>
            ) : (
              <>
                <div className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-text-dim">
                  <span className={step === 1 ? 'text-accent' : ''}>Step 1</span>
                  <span className="h-px w-4 bg-border" />
                  <span className={step === 2 ? 'text-accent' : ''}>Step 2</span>
                </div>
                <h2 className="font-brand text-lg font-bold text-text">
                  {step === 1 ? 'Create your account' : 'Choose a username'}
                </h2>
                <p className="mt-1 text-xs text-text-dim">
                  {step === 1
                    ? "We'll just need a username and password next."
                    : 'Password must be at least 6 characters.'}
                </p>

                {step === 1 ? (
                  <form onSubmit={handleContinueToStep2} className="mt-5 flex flex-col gap-3.5">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-text-dim">Email</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        autoFocus
                        placeholder="you@example.com"
                        className="rounded-md border-2 border-transparent bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-dim transition-all focus:border-accent focus:outline-none"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-text-dim">Name</span>
                      <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="Your name"
                        className="rounded-md border-2 border-transparent bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-dim transition-all focus:border-accent focus:outline-none"
                      />
                    </label>

                    <button
                      type="submit"
                      disabled={!email.trim() || !name.trim()}
                      className="mt-1 rounded-md bg-gradient-to-r from-accent to-accent-2 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-accent/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                    >
                      Continue
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleSignupSubmit} className="mt-5 flex flex-col gap-3.5">
                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-text-dim">Username</span>
                      <input
                        type="text"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        autoFocus
                        placeholder="NightOwl"
                        className="rounded-md border-2 border-transparent bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-dim transition-all focus:border-accent focus:outline-none"
                      />
                    </label>

                    <label className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium text-text-dim">Password</span>
                      <input
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="••••••••"
                        className="rounded-md border-2 border-transparent bg-surface-2 px-3 py-2 text-sm text-text placeholder:text-text-dim transition-all focus:border-accent focus:outline-none"
                      />
                    </label>

                    {authError && (
                      <p className="text-sm text-red-500">{authError}</p>
                    )}

                    <div className="mt-1 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        aria-label="Back"
                        className="rounded-md border border-border px-3 text-text-dim transition-all hover:bg-surface-2 hover:text-text active:scale-95"
                      >
                        <svg
                          className="h-4 w-4"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m15 18-6-6 6-6" />
                        </svg>
                      </button>
                      <button
                        type="submit"
                        disabled={!username.trim() || password.length < 6 || isSubmitting}
                        className="flex-1 rounded-md bg-gradient-to-r from-accent to-accent-2 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-accent/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
                      >
                        {isSubmitting ? 'Creating…' : 'Create Account'}
                      </button>
                    </div>
                  </form>
                )}

                <p className="mt-5 text-sm text-text-dim">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('login')}
                    className="font-medium text-accent hover:underline"
                  >
                    Log In
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AuthModal
