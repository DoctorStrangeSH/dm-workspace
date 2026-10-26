'use client'

import { useState, useTransition } from 'react'
import { runDevHpConcurrencyTest, type HpTestResult } from './actions'

export function HpTestClient() {
  const [pending, startTransition] = useTransition()
  const [result, setResult] = useState<HpTestResult | null>(null)
  return (
    <main className="mx-auto max-w-xl space-y-5 p-6">
      <h1 className="text-2xl font-bold">DEV: проверка атомарного HP</h1>
      <p>Только для тестовой кампании [ATOMIC-HP-TEST]. Текущий токен должен иметь 3/10 HP.</p>
      <p>При запуске будут одновременно выполнены урон −2 и лечение +4.
        Ожидается 5/10 HP у токена и персонажа. Проверка одноразовая.</p>
      <button type="button" disabled={pending || result?.ok === true}
        className="rounded-lg bg-indigo-600 px-5 py-3 font-semibold text-white disabled:opacity-50"
        onClick={() => startTransition(async () => {
          setResult(await runDevHpConcurrencyTest())
        })}>
        {pending ? 'Проверяем…' : 'Запустить DEV-тест'}
      </button>
      {result && <p role="status" className={result.ok ? 'text-green-500' : 'text-red-500'}>{result.message}</p>}
    </main>
  )
}
