import { useEffect, useState } from 'react'
import { TOTAL_TURNS } from '../engine/types'
import type { GameSession } from '../game/session'
import { useSession } from '../game/useSession'
import EventLog from './EventLog'
import HowToPlay from './HowToPlay'
import Icon from './Icons'
import PlayerCard from './PlayerCard'
import QuizModal from './QuizModal'
import ResultModal from './ResultModal'
import Scoreboard from './Scoreboard'
import StatePanel from './StatePanel'
import ThemeToggle from './ThemeToggle'
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
    <div className="shell">
      <div className="window game">
        <header className="titlebar">
          <div className="brand">
            <span className="logo" aria-hidden />
            Election Simulator
          </div>
          <span className="status">
            {snap.over ? 'Final result' : `Turn ${snap.turn} of ${TOTAL_TURNS}`}
          </span>
          <div className="row">
            <ThemeToggle />
            <button className="btn" onClick={() => setShowHelp(true)}>
              <Icon name="help" />
              How to play
            </button>
            <button className="btn" onClick={newGame}>
              <Icon name="restart" />
              New game
            </button>
          </div>
        </header>

        <Scoreboard sim={snap.sim} players={snap.config.players} />

        <div className="board">
          <aside className="col players">
            <PlayerCard player={0} snap={snap} />
            <PlayerCard player={1} snap={snap} />
          </aside>

          <div className="col center">
            <section className="panel map-panel">
              <header className="panel-head">
                <span>United States</span>
                <ul className="legend">
                  <li>
                    <i className="dot p0" />
                    {first.name}
                  </li>
                  <li>
                    <i className="dot p1" />
                    {second.name}
                  </li>
                  <li className="muted">Darker means a bigger lead. Outlined states are locked.</li>
                </ul>
              </header>
              <UsMap sim={snap.sim} selected={selected} legal={snap.legal} highlight={snap.lastAction} onSelect={setSelected} />
            </section>
            <EventLog log={snap.log} />
          </div>

          <aside className="col side">
            <TurnBar snap={snap} session={session} />
            <StatePanel snap={snap} session={session} selected={selected} />
          </aside>
        </div>
      </div>

      <QuizModal snap={snap} session={session} />
      {snap.over && showResult && <ResultModal snap={snap} onClose={() => setShowResult(false)} onRestart={onExit} />}
      {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
    </div>
  )
}
