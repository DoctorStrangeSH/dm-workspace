'use client'

import { useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Crosshair, Plus, Search, Skull, User, X } from 'lucide-react'
import { createToken } from '@/lib/actions/tokens'
import { useToast } from '@/components/toast/toast-provider'
import { Button, IconButton, Input } from '@/components/ui'
import { useI18n } from '@/lib/i18n'
import { MAX_CHARACTER_HP, readCharacterHP } from '@/lib/dnd/character-hp'
import { freeTokenPosition, monsterTokenHP } from '@/lib/maps/token-preparation'
import type { Scene, Character, Entity, Token } from '@/lib/types'
import CombatDrawer from './combat-drawer'

interface Props {
  scene: Scene
  characters: Character[]
  monsters: Entity[]
  tokens?: Token[]
  onClose: () => void
}
type Tab = 'character' | 'monster' | 'custom'
const colors = [
  '#818cf8',
  '#38bdf8',
  '#34d399',
  '#fbbf24',
  '#fb923c',
  '#f87171',
  '#e879f9',
  '#94a3b8',
]

export default function AddTokenModal({
  scene,
  characters,
  monsters,
  tokens = [],
  onClose,
}: Props) {
  const { t, lang } = useI18n()
  const ru = lang === 'ru'
  const router = useRouter()
  const toast = useToast()
  const busy = useRef(false)
  const [pending, setPending] = useState(false)
  const [uncertain, setUncertain] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<Tab>('character')
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [color, setColor] = useState(colors[0])
  const [size, setSize] = useState(1)
  const [customHP, setCustomHP] = useState('')
  const [anchor, setAnchor] = useState<'center' | 'corner'>('center')
  const character =
    tab === 'character' ? characters.find((item) => item.id === selectedId) : undefined
  const monster = tab === 'monster' ? monsters.find((item) => item.id === selectedId) : undefined
  const selected = tab === 'custom' || !!character || !!monster
  const customHPValue = customHP.trim() ? Number(customHP) : null
  const customHPValid =
    customHPValue === null ||
    (Number.isInteger(customHPValue) && customHPValue >= 1 && customHPValue <= MAX_CHARACTER_HP)
  const hp = character
    ? readCharacterHP(character.data_json?.hp)
    : monster
      ? monsterTokenHP(monster.data_json)
      : customHPValue !== null && customHPValid
        ? { current: customHPValue, max: customHPValue }
        : null
  const position = useMemo(
    () => freeTokenPosition(scene, tokens, size, anchor),
    [scene, tokens, size, anchor]
  )
  const disabled = pending || uncertain
  const list = tab === 'character' ? characters : monsters
  const filtered = list.filter((item) =>
    item.name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
  )
  const close = () => {
    if (!busy.current) onClose()
  }
  const changeTab = (value: Tab) => {
    if (disabled) return
    setTab(value)
    setSelectedId(null)
    setName('')
    setQuery('')
    setError('')
  }
  const submit = async () => {
    if (
      busy.current ||
      uncertain ||
      !selected ||
      !name.trim() ||
      !position ||
      (tab === 'custom' && !customHPValid)
    )
      return
    busy.current = true
    setPending(true)
    setError('')
    try {
      const result = await createToken(scene.id, {
        name: name.trim(),
        ...position,
        size,
        color,
        ...(character ? { characterId: character.id, owner_id: character.user_id } : {}),
        ...(monster ? { entityId: monster.id } : {}),
        ...(hp ? { hp_current: hp.current, hp_max: hp.max } : {}),
      })
      if ('error' in result) setError(result.error ?? t('common.error'))
      else {
        toast.success(t('scenes.toast.tokenAdded'))
        router.refresh()
        onClose()
      }
    } catch {
      setUncertain(true)
      setError(
        ru
          ? 'Сохранение не подтверждено. Закройте окно и проверьте сцену перед повторным добавлением.'
          : 'Could not confirm creation. Close this window and check the scene before adding again.'
      )
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  return (
    <CombatDrawer
      presentation="workspace"
      label={t('scenes.addToken.title')}
      blocked={pending}
      onClose={close}
    >
      <header className="flex items-start justify-between gap-3 border-b border-[var(--border-default)] bg-[var(--accent-subtle)] p-4 sm:p-5">
        <div>
          <p className="text-xs font-semibold tracking-widest text-[var(--accent-text)] uppercase">
            {ru ? 'Подготовка сцены' : 'Scene preparation'}
          </p>
          <h2 className="mt-1 text-xl font-bold">{t('scenes.addToken.title')}</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {ru
              ? 'Выберите участника и настройте его перед выходом на карту.'
              : 'Choose a participant and set up their token before placing it.'}
          </p>
        </div>
        <IconButton variant="ghost" label={t('common.close')} onClick={close} disabled={pending}>
          <X size={18} />
        </IconButton>
      </header>
      <div className="grid min-w-0 gap-5 p-4 sm:p-5 md:grid-cols-2">
        <section
          aria-label={ru ? 'Выбор участника' : 'Choose participant'}
          className="min-w-0 space-y-3"
        >
          <div
            role="group"
            aria-label={ru ? 'Тип токена' : 'Token type'}
            className="grid grid-cols-3 gap-1 rounded-xl bg-[var(--bg-app)] p-1"
          >
            {(['character', 'monster', 'custom'] as const).map((value, index) => {
              const Icon = [User, Skull, Plus][index]
              return (
                <button
                  key={value}
                  type="button"
                  disabled={disabled}
                  aria-pressed={tab === value}
                  onClick={() => changeTab(value)}
                  className={`flex min-h-12 min-w-0 flex-wrap items-center justify-center gap-1 rounded-lg px-1 text-xs ${tab === value ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)]' : 'text-[var(--text-muted)]'}`}
                >
                  <Icon size={14} />
                  {t('scenes.addToken.tab.' + value)}
                </button>
              )
            })}
          </div>
          {tab !== 'custom' ? (
            <>
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] px-3">
                <Search size={16} className="shrink-0" />
                <input
                  type="search"
                  aria-label={ru ? 'Поиск участника' : 'Search participants'}
                  value={query}
                  disabled={disabled}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={ru ? 'Найти по имени…' : 'Find by name…'}
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                />
              </label>
              <p className="text-xs text-[var(--text-muted)]">
                {ru ? 'Найдено' : 'Found'}: {filtered.length}
              </p>
              <ul className="max-h-72 space-y-1 overflow-y-auto rounded-xl border border-[var(--border-default)] p-1">
                {filtered.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      aria-pressed={selectedId === item.id}
                      onClick={() => {
                        setSelectedId(item.id)
                        setName(item.name.slice(0, 150))
                        setError('')
                      }}
                      className={`flex min-h-14 w-full min-w-0 items-center gap-2 rounded-lg p-3 text-left text-sm ${selectedId === item.id ? 'bg-[var(--accent-subtle)] text-[var(--accent-text)]' : 'hover:bg-[var(--bg-hover)]'}`}
                    >
                      <span className="min-w-0 flex-1 [overflow-wrap:anywhere]">{item.name}</span>
                      {selectedId === item.id && <Check size={16} className="shrink-0" />}
                    </button>
                  </li>
                ))}
                {filtered.length === 0 && (
                  <li className="p-5 text-center text-sm text-[var(--text-muted)]">
                    {query
                      ? ru
                        ? 'Ничего не найдено. Попробуйте другое имя.'
                        : 'No matches. Try another name.'
                      : t(
                          tab === 'character'
                            ? 'scenes.addToken.noCharacters'
                            : 'scenes.addToken.noMonsters'
                        )}
                  </li>
                )}
              </ul>
            </>
          ) : (
            <div className="rounded-xl border border-dashed border-[var(--border-default)] p-5 text-sm leading-relaxed text-[var(--text-muted)]">
              {ru
                ? 'Создайте жетон для NPC, союзника или объекта. Изображение PNG можно добавить через панель токена после создания.'
                : 'Create a token for an NPC, ally or object. Add PNG art from the token panel after creation.'}
            </div>
          )}
        </section>
        <section aria-label={ru ? 'Настройка токена' : 'Token setup'} className="min-w-0 space-y-4">
          <div
            aria-label={ru ? 'Предпросмотр токена' : 'Token preview'}
            className="flex min-h-36 items-center justify-center gap-4 overflow-hidden rounded-xl border border-[var(--border-default)] bg-[var(--bg-app)] p-4"
            style={{
              backgroundImage:
                'linear-gradient(#8881 1px, transparent 1px), linear-gradient(90deg, #8881 1px, transparent 1px)',
              backgroundSize: '28px 28px',
            }}
          >
            <div
              className="flex shrink-0 items-center justify-center rounded-full border-2 text-2xl shadow-lg"
              style={{
                width: Math.min(96, 40 + size * 12),
                height: Math.min(96, 40 + size * 12),
                borderColor: color,
                backgroundColor: color + '33',
              }}
            >
              {tab === 'monster' ? <Skull /> : tab === 'character' ? <User /> : <Crosshair />}
            </div>
            <div className="min-w-0">
              <p className="font-semibold [overflow-wrap:anywhere]">
                {name.trim() || (ru ? 'Ваш токен' : 'Your token')}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {size} × {size} {ru ? 'клеток' : 'cells'}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {hp ? `HP ${hp.current} / ${hp.max}` : ru ? 'Без шкалы HP' : 'No HP bar'}
              </p>
            </div>
          </div>
          <Input
            label={ru ? 'Имя на карте' : 'Map name'}
            value={name}
            disabled={disabled || !selected}
            maxLength={150}
            onChange={(event) => setName(event.target.value)}
            placeholder={ru ? 'Например, Страж у ворот' : 'For example, Gate guard'}
          />
          <fieldset disabled={disabled} className="space-y-2">
            <legend className="mb-2 text-sm font-medium">
              {ru ? 'Цвет рамки' : 'Border color'}
            </legend>
            <div className="flex flex-wrap gap-1">
              {colors.map((value, index) => (
                <button
                  type="button"
                  key={value}
                  aria-label={`${ru ? 'Цвет' : 'Color'} ${index + 1}`}
                  aria-pressed={color === value}
                  onClick={() => setColor(value)}
                  className="flex h-11 w-11 items-center justify-center rounded-lg border border-[var(--border-default)]"
                  style={{ backgroundColor: value + '22' }}
                >
                  <span
                    className="flex h-7 w-7 items-center justify-center rounded-full"
                    style={{ backgroundColor: value }}
                  >
                    {color === value && <Check size={16} className="text-black" />}
                  </span>
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">
              {ru ? 'Размер' : 'Size'}
              <select
                aria-label={ru ? 'Размер токена' : 'Token size'}
                disabled={disabled}
                value={size}
                onChange={(event) => setSize(Number(event.target.value))}
                className="mt-1 block min-h-11 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] px-2"
              >
                {[1, 2, 3, 4].map((value) => (
                  <option key={value} value={value}>
                    {value} × {value}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 text-sm font-medium">
              {ru ? 'Размещение' : 'Placement'}
              <select
                aria-label={ru ? 'Размещение токена' : 'Token placement'}
                disabled={disabled}
                value={anchor}
                onChange={(event) => setAnchor(event.target.value as 'center' | 'corner')}
                className="mt-1 block min-h-11 w-full rounded-lg border border-[var(--border-default)] bg-[var(--bg-app)] px-2"
              >
                <option value="center">{ru ? 'Ближе к центру' : 'Near center'}</option>
                <option value="corner">{ru ? 'У края карты' : 'Near corner'}</option>
              </select>
            </label>
          </div>
          {tab === 'custom' && (
            <Input
              type="number"
              min={1}
              max={MAX_CHARACTER_HP}
              label={ru ? 'HP (необязательно)' : 'HP (optional)'}
              value={customHP}
              disabled={disabled}
              onChange={(event) => setCustomHP(event.target.value)}
            />
          )}
          {tab === 'custom' && !customHPValid && (
            <p role="alert" className="text-xs text-[var(--danger)]">
              {ru
                ? 'HP должны быть положительным целым числом.'
                : 'HP must be a positive whole number.'}
            </p>
          )}
          {selected && !hp && tab !== 'custom' && (
            <p className="text-xs text-[var(--text-muted)]">
              {ru
                ? 'HP источника не распознаны. Токен будет без шкалы HP; исходная запись не изменится.'
                : 'Source HP could not be read. The token will have no HP bar; its source stays unchanged.'}
            </p>
          )}
          <p role="status" className="text-xs text-[var(--text-muted)]">
            {position
              ? ru
                ? `Свободное место: столбец ${position.x + 1}, строка ${position.y + 1}.`
                : `Free spot: column ${position.x + 1}, row ${position.y + 1}.`
              : ru
                ? 'Нет свободного места для такого размера. Уменьшите токен или освободите карту.'
                : 'No free space at this size. Use a smaller token or clear some space.'}
          </p>
        </section>
      </div>
      <footer className="sticky bottom-0 space-y-3 border-t border-[var(--border-default)] bg-[var(--bg-elevated)] p-4 sm:p-5">
        {error && (
          <p role="alert" className="text-sm text-[var(--danger)]">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-sm text-xs text-[var(--text-muted)]">
            {ru
              ? 'Место подбирается по текущей сцене. PNG и состояния доступны после добавления.'
              : 'Placement uses the current scene. PNG art and conditions are available after adding.'}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" disabled={pending} onClick={close}>
              {t('common.cancel')}
            </Button>
            <Button
              disabled={
                disabled ||
                !selected ||
                !name.trim() ||
                !position ||
                (tab === 'custom' && !customHPValid)
              }
              loading={pending}
              onClick={submit}
              icon={<Plus size={16} />}
            >
              {ru ? 'Добавить на сцену' : 'Add to scene'}
            </Button>
          </div>
        </div>
      </footer>
    </CombatDrawer>
  )
}
