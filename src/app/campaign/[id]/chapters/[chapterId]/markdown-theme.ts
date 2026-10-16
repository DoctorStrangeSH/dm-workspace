import { EditorView } from '@codemirror/view'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { tags as t } from '@lezer/highlight'

// Тема оформления (шрифты, отступы, цвета интерфейса)
export const customTheme = EditorView.theme(
  {
    '&': {
      backgroundColor: 'rgb(15 23 42)', // slate-900
      color: 'rgb(226 232 240)', // slate-200
      fontSize: '14px',
      height: '100%',
    },
    '.cm-content': {
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
      padding: '16px 0',
      lineHeight: '1.7',
      caretColor: 'rgb(129 140 248)', // indigo-400
    },
    '.cm-line': {
      padding: '0 16px',
    },
    '&.cm-focused .cm-cursor': {
      borderLeftColor: 'rgb(129 140 248)',
      borderLeftWidth: '2px',
    },
    '&.cm-focused .cm-selectionBackground, ::selection': {
      backgroundColor: 'rgb(49 46 129 / 0.5) !important', // indigo-900/50
    },
    '.cm-selectionBackground': {
      backgroundColor: 'rgb(49 46 129 / 0.3)',
    },
    '.cm-gutters': {
      backgroundColor: 'rgb(2 6 23)', // slate-950
      color: 'rgb(71 85 105)', // slate-600
      border: 'none',
      paddingRight: '4px',
    },
    '.cm-activeLineGutter': {
      backgroundColor: 'rgb(15 23 42)', // slate-900
      color: 'rgb(148 163 184)', // slate-400
    },
    '.cm-activeLine': {
      backgroundColor: 'rgb(30 41 59 / 0.4)', // slate-800/40
    },
    '.cm-scroller': {
      overflow: 'auto',
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace',
    },
    '.cm-tooltip': {
      backgroundColor: 'rgb(15 23 42)',
      border: '1px solid rgb(30 41 59)',
      borderRadius: '8px',
    },
    '.cm-tooltip-autocomplete': {
      '& > ul > li[aria-selected]': {
        backgroundColor: 'rgb(49 46 129)',
        color: 'white',
      },
    },
  },
  { dark: true }
)

// Подсветка синтаксиса Markdown
export const markdownHighlightStyle = HighlightStyle.define([
  // Заголовки
  { tag: t.heading1, color: 'rgb(165 180 252)', fontWeight: 'bold', fontSize: '1.5em' },
  { tag: t.heading2, color: 'rgb(165 180 252)', fontWeight: 'bold', fontSize: '1.3em' },
  { tag: t.heading3, color: 'rgb(165 180 252)', fontWeight: 'bold', fontSize: '1.15em' },
  { tag: t.heading4, color: 'rgb(165 180 252)', fontWeight: 'bold' },
  { tag: t.heading5, color: 'rgb(165 180 252)', fontWeight: 'bold' },
  { tag: t.heading6, color: 'rgb(165 180 252)', fontWeight: 'bold' },

  // Форматирование
  { tag: t.strong, color: 'rgb(252 211 77)', fontWeight: 'bold' }, // amber-300
  { tag: t.emphasis, color: 'rgb(196 181 253)', fontStyle: 'italic' }, // violet-300
  { tag: t.strikethrough, textDecoration: 'line-through', color: 'rgb(100 116 139)' },
  { tag: t.link, color: 'rgb(56 189 248)', textDecoration: 'underline' }, // sky-400
  { tag: t.url, color: 'rgb(56 189 248)' },

  // Код
  { tag: t.monospace, color: 'rgb(244 114 182)' }, // pink-400
  { tag: t.meta, color: 'rgb(148 163 184)' }, // slate-400

  // Списки
  { tag: t.list, color: 'rgb(148 163 184)' },
  { tag: t.quote, color: 'rgb(148 163 184)', fontStyle: 'italic' },

  // Специальные
  { tag: t.comment, color: 'rgb(100 116 139)' },
  { tag: t.keyword, color: 'rgb(196 181 253)' },
  { tag: t.string, color: 'rgb(134 239 172)' },
  { tag: t.number, color: 'rgb(251 191 36)' },
  { tag: t.typeName, color: 'rgb(165 180 252)' },
])

export const customHighlighting = syntaxHighlighting(markdownHighlightStyle)