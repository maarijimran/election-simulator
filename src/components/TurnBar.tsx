import { TOTAL_TURNS } from '../engine/types'
import { PHASES, PHASE_INFO } from '../game/phases'
import type { GameSession, Snapshot } from '../game/session'

interface Props {
  snap: Snapshot
  session: GameSession
}

export default function TurnBar({ snap, session }: Props) {
  const mover = snap.config.players[snap.mover]
  const info = snap.kind === 'pass' ? PHASE_INFO.poll : PHASE_INFO[snap.kind]
  const human = snap.awaiting === 'human'
  const bot = snap.botInfo

  return (
    <section className="card turn-bar" aria-live="polite">
      <div className="turn-head">
        <span className="turn-count">
          Turn {snap.turn} <small>of {TOTAL_TURNS}</small>
        </span>
        <ol className="steps">
          {PHASES.map((phase) => (
            <li key={phase} className={!snap.over && phase === snap.kind ? 'current' : ''}>
              {PHASE_INFO[phase].short}
            </li>
          ))}
        </ol>
      </div>

      {snap.over ? (
        <p className="turn-title">Game over</p>
      ) : (
        <>
          <p className={`turn-title p${snap.mover}`}>
            <i className={`dot p${snap.mover}`} />
            {mover.name}: {info.title.toLowerCase()}
          </p>
          <p className="muted">{info.hint}</p>
        </>
      )}

      {snap.notice && <p className="notice">{snap.notice}</p>}

      {snap.awaiting === 'bot' && (
        <p className="thinking">
          <span className="spinner" aria-hidden /> {mover.name} is thinking
        </p>
      )}

      {human && (
        <div className="turn-actions">
          <button className="btn" onClick={() => session.pass()}>
            {snap.kind === 'funds' ? 'Skip funding' : 'Pass'}
          </button>
          <span className="muted small">
            {snap.kind === 'public' || snap.kind === 'advert' ? 'Select a state, then pick an issue.' : 'Select a state on the map.'}
          </span>
        </div>
      )}

      {bot && !snap.over && (
        <p className="bot-info">
          {snap.config.players[bot.player].name}: searched {bot.depth} plies, {bot.nodes.toLocaleString()} nodes in{' '}
          {(bot.ms / 1000).toFixed(1)}s. Outlook {bot.outlook}%.
        </p>
      )}
    </section>
  )
}
