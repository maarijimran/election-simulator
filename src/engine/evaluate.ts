import { STATES } from './data/states'
import {
  type Sim,
  boostedMomentum,
  gainOf,
  mom,
  pct,
  playerFunds,
  stateFunds,
  turnOf,
  winnerOf,
} from './sim'
import { type Move, type Player, NUM_STATES, TOTAL_TURNS } from './types'

// Evaluation is the expected electoral-vote margin (Player One minus Player Two) if play stopped now.
const SOFT_MOMENTUM = 0.12 // win probability per point of momentum lead, early in the game
const SOFT_PERCENT = 0.2 // win probability bonus for a large percentage lead
const FUND_VALUE = 4 // worth of one spendable fund, in electoral votes
const CLAIM_VALUE = 1.5 // worth of leading a state that holds a fund

const clamp = (x: number, lo: number, hi: number) => (x < lo ? lo : x > hi ? hi : x)

export function stateTerm(
  votes: number,
  p0: number,
  p1: number,
  m0: number,
  m1: number,
  funds: number,
  winner: number,
  turnsLeft: number,
): number {
  if (winner >= 0) return winner === 0 ? votes : -votes

  const diff = m0 - m1
  const final = diff > 0 ? 1 : diff < 0 ? 0 : 0.5

  if (turnsLeft <= 0) return votes * (2 * final - 1)

  const soft = clamp(0.5 + SOFT_MOMENTUM * diff + SOFT_PERCENT * clamp((p0 - p1) / 60, -1, 1), 0.03, 0.97)
  const elapsed = 1 - turnsLeft / TOTAL_TURNS
  const weight = elapsed * elapsed // the closer to the end, the more the exact rule matters
  const p = weight * final + (1 - weight) * soft
  const claim = (p0 > p1 ? 1 : 0) - (p1 > p0 ? 1 : 0)

  return votes * (2 * p - 1) + CLAIM_VALUE * funds * claim
}

export function fundsTerm(f0: number, f1: number, turnsLeft: number): number {
  const cap = 3 * turnsLeft // at most three paid actions per turn
  return FUND_VALUE * (Math.min(f0, cap) - Math.min(f1, cap))
}

export function margin(S: Sim): number {
  const turnsLeft = TOTAL_TURNS - turnOf(S)
  let total = fundsTerm(playerFunds(S, 0), playerFunds(S, 1), turnsLeft)

  for (let s = 0; s < NUM_STATES; s++) {
    total += stateTerm(
      STATES[s].votes,
      pct(S, s, 0),
      pct(S, s, 1),
      mom(S, s, 0),
      mom(S, s, 1),
      stateFunds(S, s),
      winnerOf(S, s),
      turnsLeft,
    )
  }

  return total
}

// Expected change in margin() from a move, seen by the mover. Cheap enough to rank every move.
export function moveGain(S: Sim, p: Player, m: Move, pCorrect: number): number {
  if (m.kind === 'pass') return 0

  const turnsLeft = TOTAL_TURNS - turnOf(S)
  const s = m.state
  const votes = STATES[s].votes
  const p0 = pct(S, s, 0)
  const p1 = pct(S, s, 1)
  const m0 = mom(S, s, 0)
  const m1 = mom(S, s, 1)
  const f = stateFunds(S, s)
  const funds = [playerFunds(S, 0), playerFunds(S, 1)]
  const before = stateTerm(votes, p0, p1, m0, m1, f, -1, turnsLeft)
  let after: number

  if (m.kind === 'poll') {
    after = stateTerm(votes, 50, 50, m0, m1, f, -1, turnsLeft)
    funds[p]--
  } else if (m.kind === 'funds') {
    after = stateTerm(votes, p0, p1, m0, m1, 0, -1, turnsLeft)
    funds[p] += f
  } else {
    const gain = gainOf(m.kind)
    const [a0, a1] = boostedMomentum(m0, m1, p, gain)
    const [b0, b1] = boostedMomentum(m0, m1, 1 - p, gain)
    after =
      pCorrect * stateTerm(votes, p0, p1, a0, a1, f, -1, turnsLeft) +
      (1 - pCorrect) * stateTerm(votes, p0, p1, b0, b1, f, -1, turnsLeft)
    funds[p]--
  }

  const delta =
    after -
    before +
    fundsTerm(funds[0], funds[1], turnsLeft) -
    fundsTerm(playerFunds(S, 0), playerFunds(S, 1), turnsLeft)

  return p === 0 ? delta : -delta
}
