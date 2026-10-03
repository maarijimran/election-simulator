import { useState } from 'react'
import GameScreen from './components/GameScreen'
import PartyPicker from './components/PartyPicker'
import SetupScreen from './components/SetupScreen'
import { randomParty } from './engine/bot'
import { createRng } from './engine/rng'
import type { Player } from './engine/types'
import { GameSession, type PlayerConfig } from './game/session'
import { DEFAULT_SETUP, type SetupResult, assignAvatars, buildPlayers } from './game/setup'

type Picks = [number[] | null, number[] | null]

type Stage =
  | { name: 'setup' }
  | { name: 'party'; players: [PlayerConfig, PlayerConfig]; picks: Picks; turn: Player }
  | { name: 'game'; session: GameSession }

const humanFrom = (players: [PlayerConfig, PlayerConfig], from: number): Player | null =>
  ([0, 1] as Player[]).find((p) => p >= from && players[p].kind === 'human') ?? null

export default function App() {
  const [setup, setSetup] = useState<SetupResult>(DEFAULT_SETUP)
  const [stage, setStage] = useState<Stage>({ name: 'setup' })

  const launch = (players: [PlayerConfig, PlayerConfig], picks: Picks) => {
    const rng = createRng()
    const first = picks[0] ?? randomParty(rng)
    const second = picks[1] ?? randomParty(rng, first)
    const session = new GameSession({ players, parties: [first, second] })
    setStage({ name: 'game', session })
    session.start()
  }

  const begin = (chosen: SetupResult) => {
    setSetup(chosen)
    const rng = createRng()
    const players = buildPlayers(chosen, assignAvatars(chosen, rng))
    const picks: Picks = [players[0].kind === 'bot' ? randomParty(rng) : null, null]
    const turn = humanFrom(players, 0)

    if (turn === null) launch(players, picks)
    else setStage({ name: 'party', players, picks, turn })
  }

  if (stage.name === 'game') {
    return <GameScreen session={stage.session} onExit={() => setStage({ name: 'setup' })} />
  }

  if (stage.name === 'party') {
    const { players, picks, turn } = stage
    const taken = picks[turn === 0 ? 1 : 0] ?? []

    return (
      <PartyPicker
        key={turn}
        player={turn}
        config={players[turn]}
        taken={taken}
        onBack={() => setStage({ name: 'setup' })}
        onDone={(issues) => {
          const next: Picks = turn === 0 ? [issues, picks[1]] : [picks[0], issues]
          const following = humanFrom(players, turn + 1)

          if (following === null) launch(players, next)
          else setStage({ name: 'party', players, picks: next, turn: following })
        }}
      />
    )
  }

  return <SetupScreen initial={setup} onStart={begin} />
}
