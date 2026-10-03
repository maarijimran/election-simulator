import { useEffect } from 'react'
import { TOTAL_VOTES } from '../engine/data/states'
import { FUNDRAISER_GAIN, SCANDAL_CHANCE, SPECIAL_COST, SPECIAL_USES, TOTAL_TURNS } from '../engine/types'

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
            Each turn has three phases (poll, campaign, advertise) followed by a funding phase. Every poll or campaign costs 1
            fund; you start with 3.
          </li>
          <li>
            Who acts first alternates every phase, and a coin toss decides the opening order, so neither side keeps the last word.
          </li>
          <li>
            To campaign, pick a state and an issue you can use: an issue the state favors that your party holds, or an issue the
            state opposes that your rival holds. Answer the quiz to gain momentum; a miss gives it to your rival.
          </li>
          <li>
            Special actions replace your normal action in a poll, campaign or advertising phase, and each player gets{' '}
            {SPECIAL_USES} of each. A <strong>celebrity endorsement</strong> ({SPECIAL_COST.celebrity} funds) gives certain +2
            momentum in any state. A <strong>scandal leak</strong> ({SPECIAL_COST.scandal} fund) has a {SCANDAL_CHANCE * 100}%
            chance to drain 2 of your rival&apos;s momentum in a state, and otherwise costs you 2 of yours. A{' '}
            <strong>fundraiser</strong> adds {FUNDRAISER_GAIN} funds.
          </li>
          <li>
            At the end of each turn momentum moves a state&apos;s split by 5 points towards the player who has more of it. A state
            locks once a player reaches 100%.
          </li>
          <li>
            After the last turn every open state goes to the player leading its polling split, so a late swing cannot erase
            support built over many turns. Momentum breaks ties.
          </li>
        </ol>
        <p className="muted small">
          The bot searches possible futures with expectiminimax, weighs your quiz accuracy as it learns it, and follows exactly the
          same rules and limits as you do.
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
