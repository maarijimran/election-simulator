import { TOTAL_VOTES } from '../engine/data/states'
import { type Sim, tally } from '../engine/sim'
import type { Player } from '../engine/types'
import type { PlayerConfig } from '../game/session'
import Avatar from './Avatar'

interface Props {
  sim: Sim
  players: [PlayerConfig, PlayerConfig]
}

function Side({ player, config, votes }: { player: Player; config: PlayerConfig; votes: number }) {
  return (
    <div className={`score p${player}`}>
      <Avatar index={config.avatar} size={44} />
      <div className="score-who">
        <span className="score-name">{config.name}</span>
        <span className="score-party">{config.party}</span>
      </div>
      <strong>{votes}</strong>
    </div>
  )
}

export default function Scoreboard({ sim, players }: Props) {
  const ev = [tally(sim, 0), tally(sim, 1)]
  const share = (n: number) => `${(n / TOTAL_VOTES) * 100}%`

  return (
    <section className="scoreboard" aria-label="Electoral votes">
      <Side player={0} config={players[0]} votes={ev[0]} />

      <div className="bar" role="img" aria-label={`${players[0].name} ${ev[0]}, ${players[1].name} ${ev[1]} electoral votes`}>
        <span className="seg p0" style={{ width: share(ev[0]) }} />
        <span className="seg p1" style={{ width: share(ev[1]) }} />
        <i className="majority" />
        <small>{Math.floor(TOTAL_VOTES / 2) + 1} to win</small>
      </div>

      <Side player={1} config={players[1]} votes={ev[1]} />
    </section>
  )
}
