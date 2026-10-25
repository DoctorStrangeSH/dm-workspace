import { CompletionContext, CompletionResult, startCompletion } from '@codemirror/autocomplete'
import { keymap } from '@codemirror/view'
import type { EntityType } from '@/lib/types'
import { ENTITY_STYLES } from '@/lib/entity-ui'

export interface EntitySuggestion {
  id: string
  name: string
  type: EntityType
}

/**
 * CHANGES (К8):
 * - `style.label` → `style.labelKey` — т.к. в entity-ui.ts больше нет `label`.
 * - Этот файл НЕ React-компонент, поэтому useT() недоступен.
 * - `wikilinkCompletionSource` сейчас не подключён в cm-editor.tsx
 *   (autocompletion: false). Если понадобится — нужно будет передавать `t`
 *   параметром (см. план 4.4-bilingual), а пока — передаём сырой ключ
 *   (клиент увидит `entityType.npc` вместо «NPC»), либо удаляем detail/info.
 * - Для безопасности передаём `style.labelKey` как fallback, чтобы не рендерить
 *   undefined.
 */
export function wikilinkCompletionSource(
  entities: EntitySuggestion[],
  onCreateEntity?: (name: string) => void
) {
  return (context: CompletionContext): CompletionResult | null => {
    const before = context.matchBefore(/\[\[[^\]]*$/)
    if (!before) return null
    if (before.from === before.to && !context.explicit) return null

    const query = before.text.slice(2).toLowerCase()

    const options = entities
      .filter((e) => e.name.toLowerCase().includes(query))
      .map((e) => {
        const style = ENTITY_STYLES[e.type]
        // CHANGES: labelKey вместо label (label удалён из TypeStyle в К7.4.1)
        const typeLabel = style.labelKey
        return {
          label: e.name,
          detail: typeLabel,
          apply: `[[${e.name}]]`,
          boost: e.name.toLowerCase().startsWith(query) ? 1 : 0,
          info: `${style.icon} ${e.name} — ${typeLabel}`,
        }
      })

    if (options.length === 0 && query.length >= 2 && onCreateEntity) {
      options.push({
        label: `Создать «${before.text.slice(2)}»`,
        detail: 'Новая сущность',
        apply: `[[${before.text.slice(2)}]]`,
        boost: 100,
        info: '👤 Создать новую сущность с этим именем',
      })
    }

    return {
      from: before.from,
      options,
    }
  }
}

export const wikilinkTriggerKeymap = keymap.of([
  {
    key: '[',
    run: (view) => {
      const pos = view.state.selection.main.from
      const before = view.state.sliceDoc(Math.max(0, pos - 1), pos)

      if (before === '[') {
        setTimeout(() => {
          startCompletion(view)
        }, 0)
      }
      return false
    },
  },
])
