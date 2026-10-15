export const instant = false

import { connection } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle2, XCircle } from 'lucide-react'

export default async function JoinPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
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
  const { data: campaignId, error } = await supabase.rpc(
    'join_campaign_by_code',
    { code }
  )

  if (error || !campaignId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
          <XCircle size={48} className="text-red-400 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Не удалось присоединиться</h1>
          <p className="text-slate-400 text-sm mb-6">
            Код приглашения недействителен или устарел.
          </p>
          <Link
            href="/dashboard"
            className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
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
    <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 max-w-md w-full text-center">
        <CheckCircle2 size={48} className="text-green-400 mx-auto mb-4" />
        <h1 className="text-xl font-bold mb-2">Добро пожаловать!</h1>
        <p className="text-slate-400 text-sm mb-6">
          Ты присоединился к кампании{' '}
          <span className="text-white font-medium">
            «{campaign?.name ?? 'Без названия'}»
          </span>
        </p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition"
        >
          Перейти к кампаниям
        </Link>
      </div>
    </div>
  )
}