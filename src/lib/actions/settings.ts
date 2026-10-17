'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ThemeMode } from '@/lib/types'

export async function getUserSettings() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) {
    // Если нет — создаем
    const { data: newData } = await supabase
      .from('user_settings')
      .insert({ user_id: user.id })
      .select('*')
      .single()
    return { data: newData }
  }

  return { data }
}

export async function setTheme(theme: ThemeMode) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  const { error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: user.id,
      theme,
    })

  if (error) {
    console.error('setTheme error:', error)
    return { error: 'Не удалось сохранить' }
  }

  revalidatePath('/dashboard')
  return { success: true }
}