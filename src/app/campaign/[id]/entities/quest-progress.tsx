export default function QuestProgress({
  done,
  total,
  label,
}: {
  done: number
  total: number
  label: string
}) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={done}
      className="h-2 w-full overflow-hidden rounded-full bg-[var(--bg-tertiary)]"
    >
      <div
        className="h-full rounded-full bg-[var(--accent)]"
        style={{ width: `${Math.round((done / total) * 100)}%` }}
      />
    </div>
  )
}
