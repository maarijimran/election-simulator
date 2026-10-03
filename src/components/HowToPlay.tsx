import { useEffect } from 'react'
import { TOTAL_TURNS } from '../engine/types'
import { TOTAL_VOTES } from '../engine/data/states'

export default function HowToPlay({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="overlay" role="presentation" onClick={onClose}>
      <div className="modal help" role="dialog" aria-modal="true" aria-labelledby="help-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="help-title">How to play</h2>
        <ol>
          <li>
            Win more of the {TOTAL_VOTES} electoral votes than your rival after {TOTAL_TURNS} turns.
          </li>
          <li>
            Each turn has three phases (poll, campaign, advertise) where Player One acts and then Player Two, followed by a
            funding phase. Every poll or campaign costs 1 fund; you start with 3.
          </li>
          <li>
            To campaign, pick a state and an issue you can use: an issue the state favors that your party holds, or an issue
            the state opposes that your rival holds. Answer the quiz to gain momentum; a miss gives it to your rival.
          </li>
          <li>
            At the end of each turn, momentum moves a state&apos;s split by 5 points towards the player who has more of it. A
            state is locked once a player reaches 100%.
          </li>
          <li>Collect funds from states you lead. After the final turn, open states go to whoever has more momentum.</li>
        </ol>
        <p className="muted small">
          The bot searches possible futures with expectiminimax, weighs your quiz accuracy as it learns it, and thinks longer on
          higher difficulties.
        </p>
        <footer>
          <button className="btn primary" onClick={onClose} autoFocus>
            Got it
          </button>
        </footer>
      </div>
    </div>
  )
}
