import { TOTAL_VOTES } from '../engine/data/states'
import { type Sim, tally } from '../engine/sim'
import type { PlayerConfig } from '../game/session'

interface Props {
  sim: Sim
  players: [PlayerConfig, PlayerConfig]
}

export default function Scoreboard({ sim, players }: Props) {
  const ev = [tally(sim, 0), tally(sim, 1)]
  const share = (n: number) => `${(n / TOTAL_VOTES) * 100}%`

  return (
    <section className="scoreboard" aria-label="Electoral votes">
      <div className="score p0">
        <span className="score-name">{players[0].name}</span>
        <strong>{ev[0]}</strong>
      </div>

      <div className="bar" role="img" aria-label={`${players[0].name} ${ev[0]}, ${players[1].name} ${ev[1]} electoral votes`}>
        <span className="seg p0" style={{ width: share(ev[0]) }} />
        <span className="seg p1" style={{ width: share(ev[1]) }} />
        <i className="majority" />
        <small>{Math.floor(TOTAL_VOTES / 2) + 1} to win</small>
      </div>

      <div className="score p1">
        <strong>{ev[1]}</strong>
        <span className="score-name">{players[1].name}</span>
      </div>
    </section>
  )
}
