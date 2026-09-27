import { useState } from 'react'
import { useToast } from '../../context/ToastContext'
import { useData } from '../../context/DataContext'

const API_BASE = 'http://localhost:4000/api'

const MAX_TITLE_LENGTH = 140
const MAX_DESCRIPTION_LENGTH = 500
const MAX_SOCIAL_LINKS_LENGTH = 300
const MAX_GOAL_TITLE_LENGTH = 100

// فاز ۴: قبلاً این فرم فقط تو localStorage مرورگر ذخیره می‌شد، چون فاز ۱ هنوز Streamer
// به User وصل نبود و سرور نمی‌دونست این فرم مال کدوم کانالِ کیه. حالا که وصله، مستقیم با
// PATCH /api/streamers/me رو دیتابیس ذخیره می‌شه - عین ProfileSettingsForm برای پروفایل کاربر
function StreamInfoForm({ streamer, categories }) {
  const [formState, setFormState] = useState({
    title: streamer.streamTitle,
    categoryId: streamer.categoryId,
    description: streamer.description,
    // فاز ۱۱: هردو تو دیتابیس اختیاری‌ان (?? '') - ورودی متنی نمی‌تونه null بگیره،
    // پس اگه کانالی هنوز اینا رو تنظیم نکرده باشه فیلدها خالی شروع می‌شن نه "null"
    socialLinks: streamer.socialLinks ?? '',
    goalTitle: streamer.goalTitle ?? '',
    // goalTarget عدده ولی input[type=number] با رشته هم کار می‌کنه - موقع فرستادن به
    // سرور تبدیلش می‌کنیم، لازم نیست همینجا Number نگه داریمش
    goalTarget: streamer.goalTarget ?? '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const { showToast } = useToast()
  const { refreshData } = useData()

  function updateField(field, value) {
    setFormState((prevState) => ({ ...prevState, [field]: value }))
  }

  async function handleSave() {
    setIsSaving(true)
    try {
      const response = await fetch(`${API_BASE}/streamers/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          streamTitle: formState.title,
          categoryId: formState.categoryId,
          description: formState.description,
          socialLinks: formState.socialLinks,
          goalTitle: formState.goalTitle,
          goalTarget: formState.goalTarget,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        showToast(data.error || 'Could not save changes', 'error')
        return
      }
      // همین اطلاعات تو صفحه‌ی عمومی چنل و جاهای دیگه‌ی سایت هم نشون داده می‌شن -
      // برای همین کل لیست استریمرها رو تازه می‌کنیم تا فوراً همه‌جا هماهنگ بشه
      await refreshData()
      showToast('Stream info saved')
    } catch {
      showToast('Could not reach the server. Is the backend running?', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-dim">Title</span>
        <input
          type="text"
          value={formState.title}
          maxLength={MAX_TITLE_LENGTH}
          onChange={(event) => updateField('title', event.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
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
          <span className="text-xs font-medium text-text-dim">Description</span>
          <span className="text-xs text-text-dim">
            {formState.description.length}/{MAX_DESCRIPTION_LENGTH}
          </span>
        </div>
        <textarea
          value={formState.description}
          rows={4}
          maxLength={MAX_DESCRIPTION_LENGTH}
          onChange={(event) => updateField('description', event.target.value)}
          className="resize-none rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm leading-relaxed text-text outline-none transition-colors focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-dim">Social links</span>
        <input
          type="text"
          value={formState.socialLinks}
          maxLength={MAX_SOCIAL_LINKS_LENGTH}
          placeholder="twitter.com/you, youtube.com/you"
          onChange={(event) => updateField('socialLinks', event.target.value)}
          className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
        />
        <span className="text-xs text-text-dim">Separate multiple links with a comma.</span>
      </label>

      {/* فاز ۱۱: عنوان و عدد هدف کنار هم - چون هردو باهم پر یا باهم خالی می‌شن (پاک کردن
          عنوان یعنی هدف کلاً حذف می‌شه، عین چیزی که سرور هم اعمال می‌کنه) */}
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-dim">Follower goal (optional)</span>
        <div className="flex gap-3">
          <input
            type="text"
            value={formState.goalTitle}
            maxLength={MAX_GOAL_TITLE_LENGTH}
            placeholder="e.g. Giveaway at next goal"
            onChange={(event) => updateField('goalTitle', event.target.value)}
            className="min-w-0 flex-1 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
          />
          <input
            type="number"
            min="1"
            value={formState.goalTarget}
            placeholder="Target"
            onChange={(event) => updateField('goalTarget', event.target.value)}
            className="w-28 shrink-0 rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text outline-none transition-colors focus:border-accent"
          />
        </div>
        <span className="text-xs text-text-dim">
          Progress is always your real, live follower count - clear the title to remove the goal.
        </span>
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="rounded-lg bg-gradient-to-r from-accent to-accent-2 px-6 py-2.5 text-sm font-semibold text-white shadow-[0_0_18px_2px_color-mix(in_srgb,var(--color-accent)_55%,transparent),0_8px_20px_-4px_color-mix(in_srgb,var(--color-accent-2)_50%,transparent)] transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}

export default StreamInfoForm
