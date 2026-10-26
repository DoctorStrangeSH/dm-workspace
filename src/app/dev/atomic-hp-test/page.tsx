import { notFound } from 'next/navigation'
import { HpTestClient } from './test-client'

export default function DevHpTestPage() {
  if (process.env.VERCEL_ENV !== 'preview' ||
      process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://yoondivyeueyrtgeldja.supabase.co') {
    notFound()
  }
  return <HpTestClient />
}
