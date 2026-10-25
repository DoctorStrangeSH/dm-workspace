'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Save } from 'lucide-react'
import { updateProfile } from '@/lib/actions/settings'
import { useToast } from '@/components/toast/toast-provider'
import { Input, Button } from '@/components/ui'
import { useT } from '@/lib/i18n'

interface Props {
  currentDisplayName: string
  currentUsername: string
}

export default function ProfileForm({ currentDisplayName, currentUsername }: Props) {
  const t = useT()
  const router = useRouter()
  const toast = useToast()
  const [displayName, setDisplayName] = useState(currentDisplayName)
  const [username, setUsername] = useState(currentUsername)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    startTransition(async () => {
      const res = await updateProfile(formData)
      if ('error' in res) {
        toast.error(res.error ?? t('common.error'))
      } else {
        toast.success(t('settings.profile.toast.updated'))
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Input
        name="display_name"
        type="text"
        value={displayName}
        onChange={(e) => setDisplayName(e.target.value)}
        required
        minLength={2}
        maxLength={50}
        label={t('settings.profile.displayName')}
      />

      <div>
        <Input
          name="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          minLength={3}
          maxLength={30}
          pattern="[a-zA-Z0-9_]+"
          label={t('settings.profile.username')}
          hint={t('settings.profile.usernameHint')}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="md"
        icon={<Save size={14} />}
        loading={isPending}
      >
        {isPending ? t('common.saving') : t('common.save')}
      </Button>
    </form>
  )
}
