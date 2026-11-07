'use client'

import { useRef, useState, type KeyboardEvent } from 'react'
import { ArrowRight, Footprints, Move, RotateCcw, Undo2 } from 'lucide-react'
import { appendRoutePoint, MAX_ROUTE_POINTS, routeDistance } from '@/lib/maps/route'
import type { MapPoint } from '@/lib/maps/geometry'
import type { LandingText } from './copy'
import styles from './landing.module.css'

const COLUMNS = 10
const ROWS = 6
const initialPositions = [
  { x: 2, y: 3 },
  { x: 3, y: 4 },
  { x: 1, y: 4 },
  { x: 7, y: 2 },
  { x: 8, y: 1 },
  { x: 7, y: 4 },
]
const initiatives = [18, 16, 14, 11, 9, 7]
const rows = Array.from({ length: ROWS }, (_, i) => i)
const columns = Array.from({ length: COLUMNS }, (_, i) => i)

/** A local illustration of table interactions; never imports actions or a database client. */
export function TableDemo({ text }: { text: LandingText }) {
  const [positions, setPositions] = useState(initialPositions)
  const [turn, setTurn] = useState(0)
  const [selected, setSelected] = useState(0)
  const [mode, setMode] = useState<'move' | 'route'>('move')
  const [points, setPoints] = useState<MapPoint[]>([])
  const [cursor, setCursor] = useState(32)
  const [notice, setNotice] = useState<
    { kind: 'moved'; index: number; x: number; y: number } | { kind: 'limit' } | null
  >(null)
  const cells = useRef<(HTMLButtonElement | null)[]>([])
  const current = turn % positions.length
  const round = Math.floor(turn / positions.length) + 1
  const distance = routeDistance(points, 'straight')

  function activate(x: number, y: number) {
    setCursor(y * COLUMNS + x)
    setNotice(null)
    if (mode === 'route') {
      if (points.length >= MAX_ROUTE_POINTS) setNotice({ kind: 'limit' })
      else setPoints((previous) => appendRoutePoint(previous, { x, y }))
      return
    }
    const occupant = positions.findIndex((point) => point.x === x && point.y === y)
    if (occupant !== -1) setSelected(occupant)
    else {
      setPositions((previous) =>
        previous.map((point, index) => (index === selected ? { x, y } : point))
      )
      setNotice({ kind: 'moved', index: selected, x, y })
    }
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const x = index % COLUMNS
    const y = Math.floor(index / COLUMNS)
    let next = index
    if (event.key === 'ArrowLeft') next = y * COLUMNS + Math.max(0, x - 1)
    else if (event.key === 'ArrowRight') next = y * COLUMNS + Math.min(COLUMNS - 1, x + 1)
    else if (event.key === 'ArrowUp') next = Math.max(0, y - 1) * COLUMNS + x
    else if (event.key === 'ArrowDown') next = Math.min(ROWS - 1, y + 1) * COLUMNS + x
    else if (event.key === 'Home') next = event.ctrlKey ? 0 : y * COLUMNS
    else if (event.key === 'End')
      next = event.ctrlKey ? COLUMNS * ROWS - 1 : y * COLUMNS + COLUMNS - 1
    else return
    event.preventDefault()
    setCursor(next)
    cells.current[next]?.focus()
  }

  function reset() {
    setPositions(initialPositions)
    setTurn(0)
    setSelected(0)
    setMode('move')
    setPoints([])
    setCursor(32)
    setNotice(null)
  }

  return (
    <section id="demo" className={styles.demo} aria-labelledby="demo-title">
      <div className={styles.demoHeading}>
        <div>
          <p className={styles.eyebrow}>{text.demoLabel}</p>
          <h2 id="demo-title">{text.demo}</h2>
          <p>{text.demoIntro}</p>
        </div>
        <button type="button" onClick={reset} className={styles.quiet}>
          <RotateCcw size={16} aria-hidden="true" />
          {text.reset}
        </button>
      </div>
      <div className={styles.table}>
        <div className={styles.mapPanel}>
          <div className={styles.toolbar} role="group" aria-label={text.demoLabel}>
            <button
              type="button"
              aria-pressed={mode === 'move'}
              onClick={() => {
                setMode('move')
                setPoints([])
                setNotice(null)
              }}
            >
              <Move size={16} aria-hidden="true" />
              {text.move}
            </button>
            <button
              type="button"
              aria-pressed={mode === 'route'}
              onClick={() => {
                if (mode === 'route') return
                setMode('route')
                setPoints([positions[selected]])
                setNotice(null)
              }}
            >
              <Footprints size={16} aria-hidden="true" />
              {text.route}
            </button>
            <span className={styles.scale}>
              1 {text.cell.toLowerCase()} = 5 {text.feet}
            </span>
          </div>
          <p className={styles.mapHelp} id="demo-instructions">
            {mode === 'move' ? text.moveHelp : text.routeHelp}
          </p>
          <div className={styles.mapScroll}>
            <div className={styles.board}>
              <svg className={styles.terrain} viewBox="0 0 600 360" fill="none" aria-hidden="true">
                <path d="M0 0H600V360H0Z" fill="#263b37" />
                <path
                  d="M0 262C96 228 92 328 182 276S242 150 335 185 417 315 600 254V360H0Z"
                  fill="#1b3035"
                />
                <path
                  d="M0 258C96 224 92 324 182 272S242 146 335 181 417 311 600 250"
                  stroke="#668276"
                  strokeWidth="3"
                  opacity=".5"
                />
                <path
                  d="M-20 175C115 190 136 85 265 90S385 165 620 55"
                  stroke="#766e51"
                  strokeWidth="52"
                  opacity=".5"
                />
                <path
                  d="M-20 175C115 190 136 85 265 90S385 165 620 55"
                  stroke="#b6a476"
                  strokeWidth="2"
                  strokeDasharray="4 10"
                  opacity=".4"
                />
                <path
                  d="M368 39H552V166H508V147H533V58H387V115H368Z"
                  fill="#7e8170"
                  stroke="#b1ad90"
                  strokeWidth="2"
                />
                <path d="M414 65H503V130H414Z" fill="#3c4940" stroke="#8d9177" strokeWidth="2" />
                <path
                  d="M374 120L392 137 379 153 365 138ZM486 151L504 158 496 178 480 171Z"
                  fill="#8c8e77"
                />
                {[
                  { x: 50, y: 38 },
                  { x: 110, y: 26 },
                  { x: 195, y: 35 },
                  { x: 48, y: 300 },
                  { x: 500, y: 315 },
                  { x: 550, y: 305 },
                ].map(({ x, y }) => (
                  <g key={`${x}-${y}`}>
                    <circle cx={x} cy={y} r="25" fill="#182d29" stroke="#50705a" strokeWidth="2" />
                    <circle cx={x - 6} cy={y - 7} r="16" fill="#334f3c" />
                    <path d={`M${x - 9} ${y + 8}l10 -16 9 16`} stroke="#709071" opacity=".4" />
                  </g>
                ))}
                <path
                  d="M257 282h26v40h-26zM256 289h28M256 299h28M256 310h28"
                  fill="#7a6c52"
                  stroke="#ad9971"
                  strokeWidth="2"
                  transform="rotate(-24 270 300)"
                />
              </svg>
              <div
                className={styles.grid}
                role="grid"
                aria-label={text.map}
                aria-describedby="demo-instructions"
                aria-rowcount={ROWS}
                aria-colcount={COLUMNS}
              >
                {rows.map((y) => (
                  <div role="row" key={y} className={styles.gridRow}>
                    {columns.map((x) => {
                      const index = y * COLUMNS + x
                      const token = positions.findIndex((p) => p.x === x && p.y === y)
                      return (
                        <button
                          key={x}
                          type="button"
                          role="gridcell"
                          aria-rowindex={y + 1}
                          aria-colindex={x + 1}
                          aria-label={`${text.cell} ${x + 1}, ${y + 1}: ${token === -1 ? text.empty : text.names[token]}`}
                          aria-selected={token === selected}
                          tabIndex={cursor === index ? 0 : -1}
                          ref={(element) => {
                            cells.current[index] = element
                          }}
                          onFocus={() => setCursor(index)}
                          onKeyDown={(event) => navigate(event, index)}
                          onClick={() => activate(x, y)}
                        >
                          {token !== -1 ? (
                            <span
                              className={styles.piece}
                              data-kind={token < 3 ? `hero-${token}` : 'foe'}
                              data-current={token === current}
                              data-selected={token === selected}
                              aria-hidden="true"
                            >
                              {text.marks[token]}
                            </span>
                          ) : null}
                        </button>
                      )
                    })}
                  </div>
                ))}
              </div>
              {points.length > 0 ? (
                <svg className={styles.routeOverlay} viewBox="0 0 600 360" aria-hidden="true">
                  <polyline
                    points={points.map((p) => `${p.x * 60 + 30},${p.y * 60 + 30}`).join(' ')}
                    fill="none"
                    stroke="#ffe1a0"
                    strokeWidth="4"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x * 60 + 30}
                      cy={p.y * 60 + 30}
                      r="6"
                      fill="#182d29"
                      stroke="#ffe1a0"
                      strokeWidth="3"
                    />
                  ))}
                </svg>
              ) : null}
            </div>
          </div>
          <div className={styles.mapFoot}>
            <p role="status" aria-live="polite" aria-atomic="true">
              {notice?.kind === 'limit'
                ? text.limit
                : notice?.kind === 'moved'
                  ? `${text.names[notice.index]}: ${text.moved} ${notice.x + 1}, ${notice.y + 1}`
                  : mode === 'route'
                    ? `${text.distance}: ${distance.feet} ${text.feet}`
                    : `${text.selected}: ${text.names[selected]}`}
            </p>
            {mode === 'route' ? (
              <div>
                <button
                  type="button"
                  className={styles.quiet}
                  disabled={!points.length}
                  onClick={() => {
                    setPoints((previous) => previous.slice(0, -1))
                    setNotice(null)
                  }}
                >
                  <Undo2 size={16} aria-hidden="true" />
                  {text.undo}
                </button>
                <button
                  type="button"
                  className={styles.quiet}
                  disabled={!points.length}
                  onClick={() => {
                    setPoints([])
                    setNotice(null)
                  }}
                >
                  {text.clear}
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <aside className={styles.initiative} aria-labelledby="demo-order">
          <div className={styles.orderHeading}>
            <h3 id="demo-order">{text.queue}</h3>
            <span>
              {text.round} {round}
            </span>
          </div>
          <ol aria-label={text.queue}>
            {text.names.map((name, i) => (
              <li
                key={i}
                data-current={current === i}
                aria-current={current === i ? 'step' : undefined}
              >
                <span
                  className={styles.orderNumber}
                  aria-label={`${text.initiative}: ${initiatives[i]}`}
                >
                  {initiatives[i]}
                </span>
                <span
                  className={styles.piece}
                  data-kind={i < 3 ? `hero-${i}` : 'foe'}
                  aria-hidden="true"
                >
                  {text.marks[i]}
                </span>
                <span className={styles.participant}>
                  <strong>{name}</strong>
                  <small>{current === i ? text.now : text.roles[i]}</small>
                </span>
                {current === i ? <ArrowRight size={15} aria-hidden="true" /> : null}
              </li>
            ))}
          </ol>
          <p className={styles.turnStatus} role="status" aria-live="polite" aria-atomic="true">
            {text.round} {round} · {text.turn}: {text.names[current]}
          </p>
          <button
            type="button"
            className={styles.primary}
            onClick={() => {
              setTurn((previous) => previous + 1)
              setSelected((current + 1) % positions.length)
              setPoints([])
              setNotice(null)
            }}
          >
            {text.next}
            <ArrowRight size={18} aria-hidden="true" />
          </button>
        </aside>
      </div>
      <p className={styles.demoNote}>
        <span aria-hidden="true">◇</span> {text.demoOnly}
      </p>
    </section>
  )
}
