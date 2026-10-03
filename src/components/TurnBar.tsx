import { FUNDRAISER_GAIN, SPECIAL_USES, TOTAL_TURNS } from '../engine/types'
import { PHASES, PHASE_INFO } from '../game/phases'
import type { GameSession, Snapshot } from '../game/session'
import Avatar from './Avatar'
import Icon from './Icons'

interface Props {
  snap: Snapshot
  session: GameSession
}

export default function TurnBar({ snap, session }: Props) {
  const { players } = snap.config
  const mover = players[snap.mover]
  const info = PHASE_INFO[snap.kind]
  const human = snap.awaiting === 'human'
  const bot = snap.botInfo
  const left = snap.specials[snap.mover].fundraiser

  return (
    <section className="panel turn-bar" aria-live="polite">
      <header className="panel-head">
        <span>
          Turn {snap.turn} <small>of {TOTAL_TURNS}</small>
        </span>
        <ol className="steps">
          {PHASES.map((phase) => (
            <li key={phase} className={!snap.over && phase === snap.kind ? 'current' : ''}>
              {PHASE_INFO[phase].short}
            </li>
          ))}
        </ol>
      </header>

      <div className="panel-body">
        {snap.over ? (
          <p className="turn-title">Game over</p>
        ) : (
          <>
            <p className={`turn-title p${snap.mover}`}>
              <Avatar index={mover.avatar} size={30} />
              <span>
                {mover.name}
                <small>{info.title}</small>
              </span>
            </p>
            <p className="muted small">{info.hint}</p>
            <p className="muted small">{players[snap.first].name} acts first in this phase.</p>
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
            {snap.kind !== 'funds' && (
              <button
                className="btn special"
                disabled={!snap.special.fundraiser}
                onClick={() => session.special('fundraiser')}
                title={`Replace this action with a fundraiser: +${FUNDRAISER_GAIN} funds (${left} of ${SPECIAL_USES} left)`}
              >
                <Icon name="fundraiser" />
                Fundraiser +{FUNDRAISER_GAIN}
              </button>
            )}
          </div>
        )}

        {bot && !snap.over && (
          <p className="bot-info">
            {players[bot.player].name}: searched {bot.depth} plies, {bot.nodes.toLocaleString()} nodes in {(bot.ms / 1000).toFixed(1)}s.
            Outlook {bot.outlook}%.
          </p>
        )}
      </div>
    </section>
  )
}
