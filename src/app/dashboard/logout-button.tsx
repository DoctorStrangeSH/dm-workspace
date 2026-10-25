'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui'
import { useT } from '@/lib/i18n'

export default function LogoutButton() {
  const t = useT()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <Button variant="secondary" size="md" icon={<LogOut size={16} />} onClick={handleLogout}>
      {t('nav.logout')}
    </Button>
  )
}
