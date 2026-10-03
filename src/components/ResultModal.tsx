import { TOTAL_VOTES } from '../engine/data/states'
import { tally } from '../engine/sim'
import type { Snapshot } from '../game/session'

interface Props {
  snap: Snapshot
  onClose: () => void
  onRestart: () => void
}

export default function ResultModal({ snap, onClose, onRestart }: Props) {
  const winner = snap.winner!
  const [a, b] = snap.config.players
  const ev = [tally(snap.sim, 0), tally(snap.sim, 1)]
  const tie = ev[0] === ev[1]
  const human = snap.config.players.findIndex((p) => p.kind === 'human')
  const versusBot = human >= 0 && snap.config.players.some((p) => p.kind === 'bot')
  const record = human >= 0 ? snap.records[human] : null

  return (
    <div className="overlay" role="presentation">
      <div className="modal result" role="dialog" aria-modal="true" aria-labelledby="result-title">
        <p className="eyebrow">Final result</p>
        <h2 id="result-title" className={`p${winner}`}>
          {snap.config.players[winner].name} wins
        </h2>
        <p className="muted">{tie ? 'Tied on electoral votes; the tiebreak goes to Player Two.' : `${ev[winner]} of ${TOTAL_VOTES} electoral votes.`}</p>

        <div className="final-score">
          <div className="p0">
            <span>{a.name}</span>
            <strong>{ev[0]}</strong>
          </div>
          <div className="p1">
            <span>{b.name}</span>
            <strong>{ev[1]}</strong>
          </div>
        </div>

        {versusBot && record && record.total > 0 && (
          <p className="muted small">
            You answered {record.correct} of {record.total} questions correctly. The bot used that to model how you play.
          </p>
        )}

        <footer>
          <button className="btn" onClick={onClose}>
            View map
          </button>
          <button className="btn primary" onClick={onRestart} autoFocus>
            Play again
          </button>
        </footer>
      </div>
    </div>
  )
}
