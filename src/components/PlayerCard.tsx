import { ISSUES } from '../engine/data/issues'
import { playerFunds, tally } from '../engine/sim'
import { type Player, SPECIALS, SPECIAL_USES } from '../engine/types'
import type { Snapshot } from '../game/session'
import Avatar from './Avatar'
import Icon from './Icons'

interface Props {
  player: Player
  snap: Snapshot
}

const SPECIAL_LABEL = { celebrity: 'Celebrity endorsements', scandal: 'Scandal leaks', fundraiser: 'Fundraisers' } as const

export default function PlayerCard({ player, snap }: Props) {
  const config = snap.config.players[player]
  const record = snap.records[player]
  const active = !snap.over && snap.mover === player

  return (
    <article className={`panel player-card p${player}${active ? ' active' : ''}`}>
      <header className="player-head">
        <Avatar index={config.avatar} size={52} />
        <div className="player-id">
          <h3>{config.name}</h3>
          <p>
            {config.party}
            {config.level && <span className="badge">{config.level.label}</span>}
          </p>
        </div>
        {active && <span className="turn-flag">To act</span>}
      </header>

      <dl className="player-stats">
        <div>
          <dt>Funds</dt>
          <dd>{playerFunds(snap.sim, player)}</dd>
        </div>
        <div>
          <dt>Electoral votes</dt>
          <dd>{tally(snap.sim, player)}</dd>
        </div>
        <div>
          <dt>Quiz</dt>
          <dd>{record.total ? `${record.correct}/${record.total}` : '-'}</dd>
        </div>
      </dl>

      <div className="specials-left" aria-label="Special actions remaining">
        {SPECIALS.map((kind) => (
          <span key={kind} className={snap.specials[player][kind] === 0 ? 'spent' : ''} title={`${SPECIAL_LABEL[kind]} left`}>
            <Icon name={kind} size={14} />
            {snap.specials[player][kind]}/{SPECIAL_USES}
          </span>
        ))}
      </div>

      <ul className="chips">
        {snap.world.party[player].map((issue) => (
          <li key={issue} className="chip">
            {ISSUES[issue].name}
          </li>
        ))}
      </ul>
    </article>
  )
}
