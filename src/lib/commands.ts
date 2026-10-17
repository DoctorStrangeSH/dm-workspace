export type CommandKind = 'campaign' | 'chapter' | 'entity' | 'action'

export interface Command {
  id: string
  kind: CommandKind
  label: string
  description?: string
  icon: string        // эмодзи или название
  href?: string       // если нужно перейти
  action?: () => void | Promise<void>
  keywords?: string[] // для поиска
  shortcut?: string   // "⌘K", "Ctrl+M"
}