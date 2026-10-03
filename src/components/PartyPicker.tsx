import { useState } from 'react'
import { randomParty } from '../engine/bot'
import { ISSUES } from '../engine/data/issues'
import { createRng } from '../engine/rng'
import { PARTY_SIZE, type Player } from '../engine/types'

interface Props {
  player: Player
  name: string
  party: string
  taken: number[]
  onDone: (issues: number[]) => void
  onBack: () => void
}

export default function PartyPicker({ player, name, party, taken, onDone, onBack }: Props) {
  const [picked, setPicked] = useState<number[]>([])

  const toggle = (issue: number) =>
    setPicked((current) =>
      current.includes(issue) ? current.filter((i) => i !== issue) : current.length < PARTY_SIZE ? [...current, issue] : current,
    )

  return (
    <main className="setup">
      <section className={`card setup-card p${player}`}>
        <p className="eyebrow">
          <i className={`dot p${player}`} />
          {name}
        </p>
        <h2>Choose {PARTY_SIZE} issues for {party}</h2>
        <p className="muted">
          Your party can campaign on a state&apos;s favored issues that it holds, and on a state&apos;s opposed issues that your
          rival holds. Each state favors and opposes ten random issues.
        </p>

        <ul className="issue-grid">
          {ISSUES.map((issue, i) => {
            const isTaken = taken.includes(i)
            const on = picked.includes(i)
            return (
              <li key={issue.name}>
                <button
                  className={`option compact${on ? ' on' : ''}`}
                  disabled={isTaken || (!on && picked.length >= PARTY_SIZE)}
                  aria-pressed={on}
                  onClick={() => toggle(i)}
                >
                  {issue.name}
                  {isTaken && <small>Taken</small>}
                </button>
              </li>
            )
          })}
        </ul>

        <footer className="picker-footer">
          <span className="muted">
            {picked.length} of {PARTY_SIZE} selected
          </span>
          <div className="row">
            <button className="btn" onClick={onBack}>
              Back
            </button>
            <button className="btn" onClick={() => setPicked(randomParty(createRng(), taken))}>
              Random
            </button>
            <button className="btn primary" disabled={picked.length !== PARTY_SIZE} onClick={() => onDone(picked)}>
              Confirm
            </button>
          </div>
        </footer>
      </section>
    </main>
  )
}
