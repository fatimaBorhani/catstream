import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useToast } from '../../context/ToastContext'

// همون محدودیت‌هایی که سمت سرور هم چک می‌شن - اینجا فقط برای اینه که کاربر قبل از
// زدن دکمه بفهمه، نه اینکه امنیت بهش تکیه کنه
const MAX_NAME_LENGTH = 50
const MAX_BIO_LENGTH = 200

// آواتارهای پیش‌فرض: همون گربه‌هایی که تو پوشه‌ی public/avatars گذاشتیم.
// پس‌زمینه‌شون شفافه، برای همین هرجا نشون داده می‌شن یه bg-surface-2 پشتشونه تا
// هم تو حالت شب هم روز دیده بشن (وگرنه گربه‌ی سفید رو زمینه‌ی روشن گم می‌شه)
const AVATAR_OPTIONS = Array.from({ length: 8 }, (_, index) => `/avatars/cat-${index + 1}.png`)

function ProfileSettingsForm() {
  const { user, updateProfile } = useAuth()
  const { showToast } = useToast()

  const [formState, setFormState] = useState({
    name: user.name || '',
    bio: user.bio || '',
    avatarImage: user.avatarImage,
  })
  const [isSaving, setIsSaving] = useState(false)

  function updateField(field, value) {
    setFormState((prevState) => ({ ...prevState, [field]: value }))
  }

  async function handleSave() {
    setIsSaving(true)
    const result = await updateProfile(formState)
    setIsSaving(false)
    // پیام دیگه کنار دکمه نیست، یه توست بالای صفحه‌ست (ToastContext)
    if (result.ok) {
      showToast('Profile updated')
    } else {
      showToast(result.error, 'error')
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium text-text-dim">Avatar</span>
        <div className="flex flex-wrap gap-3">
          {AVATAR_OPTIONS.map((avatarUrl) => {
            const isSelected = avatarUrl === formState.avatarImage
            return (
              <button
                key={avatarUrl}
                type="button"
                onClick={() => updateField('avatarImage', avatarUrl)}
                aria-label="Choose this avatar"
                className={
                  isSelected
                    ? 'rounded-full ring-2 ring-accent ring-offset-2 ring-offset-bg transition-transform hover:scale-105'
                    : 'rounded-full opacity-70 transition-all hover:scale-105 hover:opacity-100'
                }
              >
                <img
                  src={avatarUrl}
                  alt=""
                  className="h-14 w-14 rounded-full bg-surface-2 object-cover"
                />
              </button>
            )
          })}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-text-dim">Display name</span>
        <input
          type="text"
          value={formState.name}
          maxLength={MAX_NAME_LENGTH}
          onChange={(event) => updateField('name', event.target.value)}
          placeholder="How you want to be shown"
          className="rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm text-text placeholder:text-text-dim outline-none transition-colors focus:border-accent"
        />
      </label>

      <label className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-text-dim">Bio</span>
          <span className="text-xs text-text-dim">
            {formState.bio.length}/{MAX_BIO_LENGTH}
          </span>
        </div>
        <textarea
          value={formState.bio}
          rows={4}
          maxLength={MAX_BIO_LENGTH}
          onChange={(event) => updateField('bio', event.target.value)}
          placeholder="A short line about you"
          className="resize-none rounded-lg border border-border bg-surface-2 px-3.5 py-2.5 text-sm leading-relaxed text-text placeholder:text-text-dim outline-none transition-colors focus:border-accent"
        />
      </label>

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

export default ProfileSettingsForm
