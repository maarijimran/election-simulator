import { useEffect, useRef } from 'react'
import type { LogEntry } from '../game/session'

export default function EventLog({ log }: { log: LogEntry[] }) {
  const list = useRef<HTMLUListElement>(null)

  useEffect(() => {
    const el = list.current
    if (el) el.scrollTop = el.scrollHeight
  }, [log.length])

  return (
    <section className="card log">
      <h3>Activity</h3>
      <ul ref={list}>
        {log.map((entry) => (
          <li key={entry.id} className={entry.player === null ? 'separator' : `${entry.tone} p${entry.player}`}>
            {entry.player !== null && <i className={`dot p${entry.player}`} />}
            {entry.text}
          </li>
        ))}
      </ul>
    </section>
  )
}
