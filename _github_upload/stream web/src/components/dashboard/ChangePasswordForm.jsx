import { useState } from 'react'
import { useToast } from '../../context/ToastContext'

const API_BASE = 'http://localhost:4000/api'
const MIN_PASSWORD_LENGTH = 6

// فاز ۶: تغییر پسورد - یه فرم جدا از ProfileSettingsForm چون منطقش فرق داره: اینجا هم
// پسورد فعلی رو می‌گیریم (سرور چکش می‌کنه، نه فقط فرانت)، هم پسورد جدید رو دوبار
// می‌گیریم تا مطمئن بشیم تایپی نبوده
function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useToast()

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters`)
      return
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(`${API_BASE}/auth/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error || 'Could not change password')
        return
      }
      // موفق که بود، فیلدها رو خالی می‌کنیم - نگه داشتن پسورد قبلی تو یه اینپوت رو صفحه لازم نیست
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      showToast('Password changed')
    } catch {
      setError('Could not reach the server. Is the backend running?')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <h3 className="font-logo text-base font-semibold text-text">Change password</h3>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-dim">Current password</span>
        <input
          type="password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          required
          className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-dim">New password</span>
        <input
          type="password"
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          required
          className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-dim">Confirm new password</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
        />
      </label>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded-lg bg-gradient-to-r from-accent to-accent-2 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_2px_color-mix(in_srgb,var(--color-accent)_55%,transparent),0_8px_20px_-4px_color-mix(in_srgb,var(--color-accent-2)_50%,transparent)] transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {isSaving ? 'Saving...' : 'Update Password'}
        </button>
      </div>
    </form>
  )
}

export default ChangePasswordForm
