import { useEffect, useState } from 'react'
import type { GameSession } from '../game/session'
import { useSession } from '../game/useSession'
import EventLog from './EventLog'
import HowToPlay from './HowToPlay'
import PlayerCard from './PlayerCard'
import QuizModal from './QuizModal'
import ResultModal from './ResultModal'
import Scoreboard from './Scoreboard'
import StatePanel from './StatePanel'
import TurnBar from './TurnBar'
import UsMap from './UsMap'

interface Props {
  session: GameSession
  onExit: () => void
}

export default function GameScreen({ session, onExit }: Props) {
  const snap = useSession(session)
  const [selected, setSelected] = useState<number | null>(null)
  const [showHelp, setShowHelp] = useState(false)
  const [showResult, setShowResult] = useState(true)
  const [first, second] = snap.config.players

  useEffect(() => () => session.dispose(), [session])

  const newGame = () => {
    if (snap.over || window.confirm('Leave this game and start a new one?')) onExit()
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo" aria-hidden />
          Election Simulator
        </div>
        <div className="row">
          <button className="btn" onClick={() => setShowHelp(true)}>
            How to play
          </button>
          <button className="btn" onClick={newGame}>
            New game
          </button>
        </div>
      </header>

      <Scoreboard sim={snap.sim} players={snap.config.players} />

      <div className="layout">
        <div className="main-col">
          <section className="card map-card">
            <UsMap sim={snap.sim} selected={selected} legal={snap.legal} highlight={snap.lastAction} onSelect={setSelected} />
            <ul className="legend">
              <li>
                <i className="dot p0" />
                {first.name}
              </li>
              <li>
                <i className="dot p1" />
                {second.name}
              </li>
              <li className="muted">Darker shades mean a bigger lead. Outlined states are locked.</li>
            </ul>
          </section>

          <div className="players">
            <PlayerCard player={0} snap={snap} />
            <PlayerCard player={1} snap={snap} />
          </div>
        </div>

        <aside className="side-col">
          <TurnBar snap={snap} session={session} />
          <StatePanel snap={snap} session={session} selected={selected} />
          <EventLog log={snap.log} />
        </aside>
      </div>

      <QuizModal snap={snap} session={session} />
      {snap.over && showResult && <ResultModal snap={snap} onClose={() => setShowResult(false)} onRestart={onExit} />}
      {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
    </div>
  )
}
