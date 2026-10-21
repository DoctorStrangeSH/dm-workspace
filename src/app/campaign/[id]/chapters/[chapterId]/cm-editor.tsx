'use client'

import { forwardRef } from 'react'
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror'
import type { ViewUpdate } from '@codemirror/view'
import { markdown, markdownLanguage } from '@codemirror/lang-markdown'
import { EditorView, keymap } from '@codemirror/view'
import { Prec } from '@codemirror/state'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { searchKeymap, highlightSelectionMatches } from '@codemirror/search'
import { customTheme, customHighlighting } from './markdown-theme'
import type { EntitySuggestion } from '@/lib/codemirror/wikilink-completion'

interface Props {
  value: string
  onChange: (value: string) => void
  readOnly?: boolean
  onSave?: () => void
  entities?: EntitySuggestion[]
  onUpdate?: (viewUpdate: ViewUpdate) => void
}

const CMEditor = forwardRef<ReactCodeMirrorRef, Props>(function CMEditor(
  { value, onChange, readOnly = false, onSave, onUpdate },
  ref
) {
  const saveKeymap = Prec.highest(
    keymap.of([
      {
        key: 'Mod-s',
        preventDefault: true,
        run: () => {
          onSave?.()
          return true
        },
      },
    ])
  )

  return (
    <div data-color-mode="dark" className="h-full w-full">
      <CodeMirror
        ref={ref}
        value={value}
        onChange={onChange}
        onUpdate={onUpdate}
        readOnly={readOnly}
        height="100%"
        theme="dark"
        extensions={[
          saveKeymap,
          // CHANGES: убрали codeLanguages: languages (все языки, ~200-300 KB).
          // Теперь только markdown — подсветка кода внутри ``` не работает,
          // но это компромисс ради размера бандла.
          markdown({
            base: markdownLanguage,
            addKeymap: true,
          }),
          history(),
          highlightSelectionMatches(),
          EditorView.lineWrapping,
          customTheme,
          customHighlighting,
          keymap.of([...defaultKeymap, ...historyKeymap, ...searchKeymap]),
        ]}
        basicSetup={{
          lineNumbers: false,
          foldGutter: false,
          highlightActiveLine: true,
          highlightActiveLineGutter: false,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          indentOnInput: true,
          syntaxHighlighting: false,
        }}
        placeholder="Начни писать своё приключение...

Поддерживается Markdown, [[ссылки]] на сущности и многое другое."
      />
    </div>
  )
})

export default CMEditor
