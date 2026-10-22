import { createClient } from '@supabase/supabase-js'

/**
 * CHANGES: SRD-клиент БЕЗ cookies — можно использовать внутри unstable_cache.
 * SRD-данные публичные (RLS пускает anon на чтение), auth не нужен.
 */
export function createSrdClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
