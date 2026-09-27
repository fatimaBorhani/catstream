import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'

const API_BASE = 'http://localhost:4000/api'

const MAX_TITLE_LENGTH = 140
const MAX_DESCRIPTION_LENGTH = 500

function TowerIcon({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="7" r="2.5" />
      <path d="M7.5 11.5a6 6 0 0 1 0-9M16.5 2.5a6 6 0 0 1 0 9" />
      <path d="M10.5 9.5 9 21h6l-1.5-11.5" />
    </svg>
  )
}

// فاز ۱۷: تا قبل از این، کاربری که کانال نداشت تو تب Stream Info فقط یه پیام بن‌بست
// («No channel yet») می‌دید و هیچ راهی برای استریمر شدن نبود - فقط حساب‌های seed شده
// کانال داشتن. این فرم همون بن‌بست رو به یه قدم واقعی تبدیل می‌کنه.
// اسم کانال فیلد ورودی نیست چون سرور عمداً از یوزرنیم خود کاربر می‌سازتش (تا آدرس کانال
// و پروفایل یکی بمونه) - فقط نشونش می‌دیم که کاربر بدونه آدرسش چی می‌شه
function CreateChannelForm({ categories }) {
  const { user } = useAuth()
  const { refreshData } = useData()
  const { showToast } = useToast()

  const [formState, setFormState] = useState({
    streamTitle: '',
    // اولین دسته‌بندی به‌عنوان پیش‌فرض انتخاب می‌شه، وگرنه select با مقدار خالی شروع
    // می‌شد و کاربری که دستش نمی‌زد یه خطای بی‌دلیل از سرور می‌گرفت
    categoryId: categories.length > 0 ? categories[0].id : '',
    description: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  function updateField(field, value) {
    setFormState((prevState) => ({ ...prevState, [field]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSaving(true)
    try {
      const response = await fetch(`${API_BASE}/streamers/me`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(formState),
      })
      const data = await response.json()
      if (!response.ok) {
        showToast(data.error || 'Could not create your channel', 'error')
        return
      }
      // بعد از این، streamers شامل کانال تازه می‌شه و DashboardPage خودش این فرم رو با
      // فرم واقعی تنظیمات (StreamInfoForm) عوض می‌کنه - نیازی به رفرش دستی صفحه نیست
      await refreshData()
      showToast('Your channel is live')
    } catch {
      showToast('Could not reach the server. Is the backend running?', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-2 p-4">
        <TowerIcon className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
        <div className="min-w-0">
          <p className="font-logo text-sm font-semibold text-text">Create your channel</p>
          <p className="mt-1 text-xs leading-relaxed text-text-dim">
            Your channel will live at /channel/{user.username} and use your profile picture.
            You can change everything else later.
          </p>
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-dim">Stream title</span>
        <input
          type="text"
          value={formState.streamTitle}
          maxLength={MAX_TITLE_LENGTH}
          onChange={(event) => updateField('streamTitle', event.target.value)}
          placeholder="What are you streaming?"
          required
          className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text placeholder:text-text-dim outline-none transition-colors focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-dim">Category</span>
        <select
          value={formState.categoryId}
          onChange={(event) => updateField('categoryId', event.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
        >
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-dim">Description (optional)</span>
          <span className="text-xs text-text-dim">
            {formState.description.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
        <textarea
          value={formState.description}
          rows={4}
          maxLength={MAX_DESCRIPTION_LENGTH}
          onChange={(event) => updateField('description', event.target.value)}
          placeholder="Tell people what your channel is about."
          className="resize-none rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm leading-relaxed text-text placeholder:text-text-dim outline-none transition-colors focus:border-accent"
        />
      </label>

      <div className="flex items-center justify-end">
        <button
          type="submit"
          disabled={isSaving || !formState.streamTitle.trim()}
          className="rounded-lg bg-gradient-to-r from-accent to-accent-2 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_2px_color-mix(in_srgb,var(--color-accent)_55%,transparent),0_8px_20px_-4px_color-mix(in_srgb,var(--color-accent-2)_50%,transparent)] transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {isSaving ? 'Creating...' : 'Create Channel'}
        </button>
      </div>
    </form>
  )
}

export default CreateChannelForm
