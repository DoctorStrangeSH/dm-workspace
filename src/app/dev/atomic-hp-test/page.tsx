import { HpTestClient } from './test-client'

// Keep this page visible to diagnose Preview routing.
// The server action independently checks VERCEL_ENV, exact DEV Supabase URL,
// authenticated user, campaign ownership and isolated fixture before any writes.
export default function DevHpTestPage() {
  return <HpTestClient />
}
