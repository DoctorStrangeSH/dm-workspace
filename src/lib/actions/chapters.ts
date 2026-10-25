'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { getCampaignAccess } from '@/lib/queries/access'

export async function createChapter(campaignId: string, formData: FormData) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const title = (formData.get('title') as string)?.trim()
  if (!title || title.length < 2) {
    return { error: 'Название должно быть минимум 2 символа' }
  }
  if (title.length > 150) {
    return { error: 'Название слишком длинное (макс. 150)' }
  }

  const supabase = await createClient()

  // Узнаём максимальный order_index
  const { data: lastChapter } = await supabase
    .from('chapters')
    .select('order_index')
    .eq('campaign_id', campaignId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextIndex = (lastChapter?.order_index ?? -1) + 1

  const { data, error } = await supabase
    .from('chapters')
    .insert({
      campaign_id: campaignId,
      title,
      order_index: nextIndex,
    })
    .select('id')
    .single()

  if (error) {
    console.error('createChapter error:', error)
    return { error: 'Не удалось создать главу' }
  }

  revalidatePath(`/campaign/${campaignId}/chapters`)
  return { success: true, chapterId: data.id }
}

export async function updateChapterTitle(chapterId: string, campaignId: string, title: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const trimmed = title.trim()
  if (!trimmed || trimmed.length < 2) {
    return { error: 'Слишком короткое название' }
  }
  if (trimmed.length > 150) {
    return { error: 'Слишком длинное название' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chapters')
    .update({ title: trimmed })
    .eq('id', chapterId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    console.error('updateChapterTitle error:', error)
    return { error: 'Не удалось обновить' }
  }

  revalidatePath(`/campaign/${campaignId}/chapters`)
  return { success: true }
}

export async function toggleChapterVisibility(
  chapterId: string,
  campaignId: string,
  visible: boolean
) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chapters')
    .update({ is_visible_to_players: visible })
    .eq('id', chapterId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    console.error('toggleChapterVisibility error:', error)
    return { error: 'Не удалось переключить' }
  }

  revalidatePath(`/campaign/${campaignId}/chapters`)
  return { success: true }
}

export async function deleteChapter(chapterId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chapters')
    .delete()
    .eq('id', chapterId)
    .eq('campaign_id', campaignId)
    .select('id')
    .maybeSingle()

  if (error || !data) {
    console.error('deleteChapter error:', error)
    return { error: 'Не удалось удалить' }
  }

  revalidatePath(`/campaign/${campaignId}/chapters`)
  return { success: true }
}

/**
 * Переупорядочивает главы: принимает массив id в новом порядке.
 */
export async function reorderChapters(campaignId: string, orderedIds: string[]) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  if (orderedIds.length > 500 || new Set(orderedIds).size !== orderedIds.length) {
    return { error: 'Некорректный список глав' }
  }

  const supabase = await createClient()
  const { data: chapters, error: fetchError } = await supabase
    .from('chapters')
    .select('id')
    .eq('campaign_id', campaignId)

  if (fetchError) {
    console.error('reorderChapters fetch error:', fetchError)
    return { error: 'Не удалось проверить список глав' }
  }

  const allowedIds = new Set((chapters ?? []).map((chapter) => chapter.id))
  if (orderedIds.some((id) => !allowedIds.has(id))) {
    return { error: 'Список содержит неизвестную главу' }
  }

  const updates = orderedIds.map((id, index) =>
    supabase
      .from('chapters')
      .update({ order_index: index })
      .eq('id', id)
      .eq('campaign_id', campaignId)
      .select('id')
      .maybeSingle()
  )

  const results = await Promise.all(updates)
  const failed = results.find((result) => result.error || !result.data)
  if (failed) {
    console.error('reorderChapters error:', failed.error)
    return { error: 'Не удалось сохранить порядок' }
  }

  revalidatePath(`/campaign/${campaignId}/chapters`)
  return { success: true }
}

export async function duplicateChapter(chapterId: string, campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  const supabase = await createClient()

  // Получаем оригинал
  const { data: original, error: fetchError } = await supabase
    .from('chapters')
    .select('*')
    .eq('id', chapterId)
    .eq('campaign_id', campaignId)
    .single()

  if (fetchError || !original) {
    console.error('duplicateChapter fetch error:', fetchError)
    return { error: 'Глава не найдена' }
  }

  // Находим максимальный order_index
  const { data: lastChapter } = await supabase
    .from('chapters')
    .select('order_index')
    .eq('campaign_id', campaignId)
    .order('order_index', { ascending: false })
    .limit(1)
    .maybeSingle()

  const nextIndex = (lastChapter?.order_index ?? -1) + 1

  // Формируем название копии
  const baseTitle = original.title
    .replace(/^Копия — /, '') // убираем "Копия — " если есть
    .replace(/ \(\d+\)$/, '') // убираем " (2)" если есть

  // Проверяем, сколько уже копий с таким именем
  const { data: existingCopies } = await supabase
    .from('chapters')
    .select('title')
    .eq('campaign_id', campaignId)
    .like('title', `%${baseTitle}%`)

  const copyCount = (existingCopies ?? []).filter((c) =>
    c.title.startsWith(`Копия — ${baseTitle}`)
  ).length

  const newTitle =
    copyCount === 0 ? `Копия — ${baseTitle}` : `Копия — ${baseTitle} (${copyCount + 1})`

  // Вставляем копию
  const { data: newChapter, error: insertError } = await supabase
    .from('chapters')
    .insert({
      campaign_id: campaignId,
      title: newTitle,
      content_md: original.content_md,
      order_index: nextIndex,
      is_visible_to_players: false, // копия скрыта по умолчанию
    })
    .select('id')
    .single()

  if (insertError) {
    console.error('duplicateChapter insert error:', insertError)
    return { error: 'Не удалось создать копию' }
  }

  revalidatePath(`/campaign/${campaignId}/chapters`)
  return { success: true, chapterId: newChapter.id }
}

export async function bulkDeleteChapters(chapterIds: string[], campaignId: string) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  if (chapterIds.length === 0) {
    return { error: 'Не выбрано ни одной главы' }
  }

  if (chapterIds.length > 100) {
    return { error: 'Максимум 100 глав за раз' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chapters')
    .delete()
    .in('id', chapterIds)
    .eq('campaign_id', campaignId)
    .select('id')

  if (error) {
    console.error('bulkDeleteChapters error:', error)
    return { error: 'Не удалось удалить главы' }
  }

  revalidatePath(`/campaign/${campaignId}/chapters`)
  return { success: true, deletedCount: data?.length ?? 0 }
}

export async function bulkSetVisibility(
  chapterIds: string[],
  campaignId: string,
  visible: boolean
) {
  const { isDm } = await getCampaignAccess(campaignId)
  if (!isDm) return { error: 'Нет прав' }

  if (chapterIds.length === 0) {
    return { error: 'Не выбрано ни одной главы' }
  }

  if (chapterIds.length > 100) {
    return { error: 'Максимум 100 глав за раз' }
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('chapters')
    .update({ is_visible_to_players: visible })
    .in('id', chapterIds)
    .eq('campaign_id', campaignId)
    .select('id')

  if (error) {
    console.error('bulkSetVisibility error:', error)
    return { error: 'Не удалось изменить видимость' }
  }

  revalidatePath(`/campaign/${campaignId}/chapters`)
  return { success: true, updatedCount: data?.length ?? 0 }
}
