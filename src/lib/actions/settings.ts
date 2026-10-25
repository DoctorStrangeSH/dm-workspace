'use server'

import { randomUUID } from 'node:crypto'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { ThemeMode } from '@/lib/types'

const THEMES: ThemeMode[] = ['dark', 'light', 'system']
const AVATAR_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}
const MAX_AVATAR_SIZE = 2 * 1024 * 1024

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
    .maybeSingle()

  if (error) return { error: 'Не удалось загрузить настройки' }
  if (data) return { data }

  const { data: newData, error: insertError } = await supabase
    .from('user_settings')
    .upsert({ user_id: user.id }, { onConflict: 'user_id' })
    .select('*')
    .single()

  if (insertError) return { error: 'Не удалось создать настройки' }
  return { data: newData }
}

export async function setTheme(theme: ThemeMode) {
  if (typeof theme !== 'string' || !THEMES.includes(theme)) {
    return { error: 'Некорректная тема оформления' }
  }

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

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  const rawDisplayName = formData.get('display_name')
  const rawUsername = formData.get('username')
  if (typeof rawDisplayName !== 'string' || typeof rawUsername !== 'string') {
    return { error: 'Заполните имя и username' }
  }

  const displayName = rawDisplayName.trim()
  const username = rawUsername.trim().toLowerCase().replace(/\s+/g, '_')

  if (displayName.length < 2 || displayName.length > 80) {
    return { error: 'Имя должно содержать от 2 до 80 символов' }
  }

  if (username.length < 3 || username.length > 30) {
    return { error: 'Username должен содержать от 3 до 30 символов' }
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
    console.error('updateProfile error:', error)
    return { error: 'Не удалось обновить' }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: 'Не авторизован' }

  const value = formData.get('avatar')
  if (!value || typeof value === 'string' || typeof value.arrayBuffer !== 'function') {
    return { error: 'Файл не выбран' }
  }

  const file = value as File
  const extension = AVATAR_TYPES[file.type]
  if (!extension) return { error: 'Поддерживаются только JPEG, PNG, WebP и GIF' }
  if (file.size <= 0 || file.size > MAX_AVATAR_SIZE) {
    return { error: 'Размер изображения должен быть от 1 байта до 2 MB' }
  }

  const fileName = `${user.id}/avatar-${randomUUID()}.${extension}`
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(fileName, file, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error('uploadAvatar upload error:', uploadError)
    return { error: 'Не удалось загрузить' }
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(fileName)

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl })
    .eq('id', user.id)

  if (profileError) {
    await supabase.storage.from('avatars').remove([fileName])
    console.error('uploadAvatar profile update error:', profileError)
    return { error: 'Не удалось сохранить аватар' }
  }

  const { data: existing } = await supabase.storage.from('avatars').list(user.id)
  const oldFiles = (existing ?? [])
    .filter((file) => file.name !== fileName.split('/').pop())
    .map((file) => `${user.id}/${file.name}`)
  if (oldFiles.length > 0) {
    const { error: cleanupError } = await supabase.storage.from('avatars').remove(oldFiles)
    if (cleanupError) console.error('uploadAvatar cleanup error:', cleanupError)
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true, url: publicUrl }
}

export async function updatePassword(formData: FormData) {
  const value = formData.get('password')
  const password = typeof value === 'string' ? value : ''

  if (password.length < 8 || password.length > 128) {
    return { error: 'Пароль должен содержать от 8 до 128 символов' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: 'Не удалось обновить пароль' }
  return { success: true }
}

export async function updateEmail(formData: FormData) {
  const value = formData.get('email')
  const email = typeof value === 'string' ? value.trim() : ''

  if (!email || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Некорректный email' }
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Не авторизован' }

  const { error } = await supabase.auth.updateUser({ email })
  if (error) return { error: 'Не удалось обновить email' }

  return {
    success: true,
    message: 'Проверь почту — нужно подтвердить новый email',
  }
}

export async function deleteAccount(password: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user || !user.email) return { error: 'Не авторизован' }
  if (typeof password !== 'string' || !password || password.length > 128) {
    return { error: 'Введите пароль' }
  }

  // Do not delete the profile without deleting the corresponding Auth user.
  // That leaves an orphaned account and can destroy campaign data prematurely.
  const admin = createAdminClient()
  if (!admin) {
    return { error: 'Удаление аккаунта временно недоступно: не настроен серверный ключ' }
  }

  const { data: verified, error: authError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password,
  })

  if (authError || verified.user?.id !== user.id) {
    return { error: 'Неверный пароль' }
  }

  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id)
  if (deleteError) {
    console.error('deleteAccount error:', deleteError)
    return { error: 'Не удалось удалить аккаунт' }
  }

  await supabase.auth.signOut()
  revalidatePath('/')
  return { success: true }
}
