import { CompletionContext, CompletionResult, startCompletion } from '@codemirror/autocomplete'
import { keymap } from '@codemirror/view'
import type { EntityType } from '@/lib/types'
import { ENTITY_STYLES } from '@/lib/entity-ui'

export interface EntitySuggestion {
  id: string
  name: string
  type: EntityType
}

export function wikilinkCompletionSource(
  entities: EntitySuggestion[],
  onCreateEntity?: (name: string) => void
) {
  return (context: CompletionContext): CompletionResult | null => {
    console.log('🔥 SOURCE CALLED, pos:', context.pos, 'explicit:', context.explicit)

    const before = context.matchBefore(/\[\[[^\]]*$/)
    console.log('🔥 matchBefore:', {
      text: before?.text,
      from: before?.from,
      to: before?.to,
    })

    if (!before) return null

    console.log('🔥 entities count:', entities.length)

    if (before.from === before.to && !context.explicit) return null

    const query = before.text.slice(2).toLowerCase()

    const options = entities
      .filter((e) => e.name.toLowerCase().includes(query))
      .map((e) => {
        const style = ENTITY_STYLES[e.type]
        return {
          label: e.name,
          detail: style.label,
          apply: `[[${e.name}]]`,
          boost: e.name.toLowerCase().startsWith(query) ? 1 : 0,
          info: `${style.icon} ${e.name} — ${style.label}`,
        }
      })

    console.log('🔥 options count:', options.length)

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

      console.log('🔥 KEY [ HIT, char before:', JSON.stringify(before))

      if (before === '[') {
        setTimeout(() => {
          console.log('🔥 STARTING COMPLETION')
          startCompletion(view)
        }, 0)
      }
      return false
    },
  },
])
