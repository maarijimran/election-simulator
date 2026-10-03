import { STATES } from './data/states'
import {
  type Sim,
  boostedMomentum,
  drainedMomentum,
  gainOf,
  mom,
  pct,
  playerFunds,
  specialsLeft,
  stateFunds,
  turnOf,
  winnerOf,
} from './sim'
import {
  type Move,
  type Player,
  FUNDRAISER_GAIN,
  NUM_STATES,
  SCANDAL_CHANCE,
  SPECIALS,
  SPECIAL_COST,
  TOTAL_TURNS,
  isCampaign,
} from './types'

// Evaluation is the expected electoral-vote margin (Player One minus Player Two) if play stopped now.
const SOFT_MOMENTUM = 0.12 // win probability per point of momentum lead, early in the game
const SOFT_PERCENT = 0.3 // win probability bonus for a large percentage lead
const FUND_VALUE = 4 // worth of one spendable fund, in electoral votes
const CLAIM_VALUE = 1.5 // worth of leading a state that holds a fund
const SPECIAL_VALUE = 2.5 // worth of one unused special action while enough turns remain to play it

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
  const byMomentum = diff > 0 ? 1 : diff < 0 ? 0 : 0.5
  const final = p0 !== p1 ? (p0 > p1 ? 1 : 0) : byMomentum // how finalizeGame would decide it

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

const specialWeight = (turnsLeft: number) => SPECIAL_VALUE * Math.min(1, turnsLeft / 5)

function usesLeft(S: Sim, p: number): number {
  let total = 0
  for (const kind of SPECIALS) total += specialsLeft(S, p, kind)
  return total
}

export function margin(S: Sim): number {
  const turnsLeft = TOTAL_TURNS - turnOf(S)
  let total =
    fundsTerm(playerFunds(S, 0), playerFunds(S, 1), turnsLeft) + specialWeight(turnsLeft) * (usesLeft(S, 0) - usesLeft(S, 1))

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
export function moveGain(S: Sim, p: Player, m: Move, pChance: number): number {
  if (m.kind === 'pass') return 0

  const turnsLeft = TOTAL_TURNS - turnOf(S)
  const s = m.state
  const votes = s >= 0 ? STATES[s].votes : 0
  const p0 = s >= 0 ? pct(S, s, 0) : 0
  const p1 = s >= 0 ? pct(S, s, 1) : 0
  const m0 = s >= 0 ? mom(S, s, 0) : 0
  const m1 = s >= 0 ? mom(S, s, 1) : 0
  const f = s >= 0 ? stateFunds(S, s) : 0
  const funds = [playerFunds(S, 0), playerFunds(S, 1)]
  const term = (a0: number, a1: number, fund = f) => stateTerm(votes, p0, p1, a0, a1, fund, -1, turnsLeft)
  const before = s >= 0 ? term(m0, m1) : 0
  let after = before
  let used = 0

  if (m.kind === 'poll') {
    after = stateTerm(votes, 50, 50, m0, m1, f, -1, turnsLeft)
    funds[p]--
  } else if (m.kind === 'funds') {
    after = term(m0, m1, 0)
    funds[p] += f
  } else if (isCampaign(m.kind)) {
    const gain = gainOf(m.kind)
    const [a0, a1] = boostedMomentum(m0, m1, p, gain)
    const [b0, b1] = boostedMomentum(m0, m1, 1 - p, gain)
    after = pChance * term(a0, a1) + (1 - pChance) * term(b0, b1)
    funds[p]--
  } else if (m.kind === 'celebrity') {
    const [a0, a1] = boostedMomentum(m0, m1, p, gainOf('celebrity'))
    after = term(a0, a1)
    funds[p] -= SPECIAL_COST.celebrity
    used = 1
  } else if (m.kind === 'scandal') {
    const [a0, a1] = drainedMomentum(m0, m1, 1 - p)
    const [b0, b1] = drainedMomentum(m0, m1, p)
    after = SCANDAL_CHANCE * term(a0, a1) + (1 - SCANDAL_CHANCE) * term(b0, b1)
    funds[p] -= SPECIAL_COST.scandal
    used = 1
  } else {
    funds[p] += FUNDRAISER_GAIN
    used = 1
  }

  const delta =
    after -
    before +
    fundsTerm(funds[0], funds[1], turnsLeft) -
    fundsTerm(playerFunds(S, 0), playerFunds(S, 1), turnsLeft) -
    (p === 0 ? used : -used) * specialWeight(turnsLeft)

  return p === 0 ? delta : -delta
}
