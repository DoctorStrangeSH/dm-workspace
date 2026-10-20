export const instant = false

import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'

export default async function JoinPage({ params }: { params: Promise<{ code: string }> }) {
  await connection()

  const { code } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Если не залогинен — редирект на логин с return-url
  if (!user) {
    redirect(`/login?next=/join/${code}`)
  }

  // Пробуем присоединиться
  const { data: campaignId, error } = await supabase.rpc('join_campaign_by_code', { code })

  if (error || !campaignId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
        <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
          <XCircle size={48} className="mx-auto mb-4 text-red-400" />
          <h1 className="mb-2 text-xl font-bold">Не удалось присоединиться</h1>
          <p className="mb-6 text-sm text-slate-400">Код приглашения недействителен или устарел.</p>
          <Link
            href="/dashboard"
            className="inline-block rounded-lg bg-indigo-600 px-4 py-2 transition hover:bg-indigo-500"
          >
            На главную
          </Link>
        </div>
      </div>
    )
  }

  // Получаем название кампании для отображения
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('name')
    .eq('id', campaignId)
    .single()

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center">
        <CheckCircle2 size={48} className="mx-auto mb-4 text-green-400" />
        <h1 className="mb-2 text-xl font-bold">Добро пожаловать!</h1>
        <p className="mb-6 text-sm text-slate-400">
          Ты присоединился к кампании{' '}
          <span className="font-medium text-white">«{campaign?.name ?? 'Без названия'}»</span>
        </p>
        <Link
          href="/dashboard"
          className="inline-block rounded-lg bg-indigo-600 px-4 py-2 transition hover:bg-indigo-500"
        >
          Перейти к кампаниям
        </Link>
      </div>
    </div>
  )
}
