import { ISSUES } from '../engine/data/issues'
import { playerFunds, tally } from '../engine/sim'
import type { Player } from '../engine/types'
import type { Snapshot } from '../game/session'

interface Props {
  player: Player
  snap: Snapshot
}

export default function PlayerCard({ player, snap }: Props) {
  const config = snap.config.players[player]
  const record = snap.records[player]
  const active = !snap.over && snap.mover === player

  return (
    <article className={`player-card p${player}${active ? ' active' : ''}`}>
      <header>
        <div>
          <h3>{config.name}</h3>
          <p>
            {config.party}
            {config.level && <span className="badge">{config.level.label}</span>}
          </p>
        </div>
        <div className="funds" title="Funds available for polling and campaigning">
          <strong>{playerFunds(snap.sim, player)}</strong>
          <span>funds</span>
        </div>
      </header>

      <dl className="player-stats">
        <div>
          <dt>Electoral votes</dt>
          <dd>{tally(snap.sim, player)}</dd>
        </div>
        <div>
          <dt>Quiz answers</dt>
          <dd>{record.total ? `${record.correct}/${record.total}` : '-'}</dd>
        </div>
      </dl>

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
