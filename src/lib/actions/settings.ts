'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ThemeMode } from '@/lib/types'

// ============================================================
// Тема (из 2.10.8)
// ============================================================

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

  const { error } = await supabase.from('user_settings').upsert({
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

// ============================================================
// Профиль (6.1)
// ============================================================

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  const displayName = (formData.get('display_name') as string)?.trim()
  const username = (formData.get('username') as string)
    ?.trim()
    .toLowerCase()
    .replace(/\s+/g, '_')

  if (!displayName || displayName.length < 2) {
    return { error: 'Имя должно быть минимум 2 символа' }
  }

  if (!username || username.length < 3) {
    return { error: 'Username должен быть минимум 3 символа' }
  }

  if (!/^[a-z0-9_]+$/.test(username)) {
    return { error: 'Username: только буквы, цифры, _' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      display_name: displayName,
      username,
    })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') {
      return { error: 'Такой username уже занят' }
    }
    return { error: 'Не удалось обновить' }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

// ============================================================
// Аватар
// ============================================================

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  const file = formData.get('avatar') as File | null
  if (!file) return { error: 'Файл не выбран' }
  if (file.size > 2 * 1024 * 1024) return { error: 'Максимум 2 MB' }

  const ext = file.name.split('.').pop() ?? 'png'
  const fileName = `${user.id}/avatar.${ext}`

  const { data: existing } = await supabase.storage
    .from('avatars')
    .list(user.id)

  if (existing && existing.length > 0) {
    await supabase.storage
      .from('avatars')
      .remove(existing.map((f) => `${user.id}/${f.name}`))
  }

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { upsert: true })

  if (uploadError) return { error: 'Не удалось загрузить' }

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(fileName)

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (error) return { error: 'Не удалось сохранить' }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true, url: publicUrl }
}

// ============================================================
// Безопасность
// ============================================================

export async function updatePassword(formData: FormData) {
  const supabase = await createClient()
  const password = (formData.get('password') as string) ?? ''

  if (password.length < 8) {
    return { error: 'Пароль минимум 8 символов' }
  }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }
  return { success: true }
}

export async function updateEmail(formData: FormData) {
  const supabase = await createClient()
  const email = (formData.get('email') as string)?.trim()

  if (!email || !email.includes('@')) {
    return { error: 'Некорректный email' }
  }

  const { error } = await supabase.auth.updateUser({ email })

  if (error) return { error: error.message }

  return {
    success: true,
    message: 'Проверь почту — нужно подтвердить новый email',
  }
}

// ============================================================
// Удаление аккаунта
// ============================================================

export async function deleteAccount(password: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) return { error: 'Не авторизован' }

  // Проверяем пароль
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  })

  if (authError) {
    return { error: 'Неверный пароль' }
  }

  // Удаляем профиль (каскадно удалит всё)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id)

  if (error) return { error: 'Не удалось удалить' }

  // Выходим
  await supabase.auth.signOut()

  return { success: true }
}