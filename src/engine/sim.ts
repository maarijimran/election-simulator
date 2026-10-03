import { STATES } from './data/states'
import type { Rng } from './rng'
import {
  type Kind,
  type Move,
  type Player,
  type World,
  NUM_ISSUES,
  NUM_STATES,
  PARTY_SIZE,
  PASS,
  SLOTS,
  STEPS_PER_TURN,
  TOTAL_TURNS,
  move,
  other,
} from './types'

// A game position packed into one Int16Array so it can be cloned cheaply while searching.
export type Sim = Int16Array

const PCT = 0
const MOM = PCT + NUM_STATES * 2
const FUNDS = MOM + NUM_STATES * 2
const LEADER = FUNDS + NUM_STATES
const WINNER = LEADER + NUM_STATES
const PLAYER_FUNDS = WINNER + NUM_STATES
const TURN = PLAYER_FUNDS + 2
const STEP = TURN + 1
const SIZE = STEP + 1

export const pct = (S: Sim, s: number, p: number) => S[PCT + s * 2 + p]
export const mom = (S: Sim, s: number, p: number) => S[MOM + s * 2 + p]
export const stateFunds = (S: Sim, s: number) => S[FUNDS + s]
export const leaderOf = (S: Sim, s: number) => S[LEADER + s]
export const winnerOf = (S: Sim, s: number) => S[WINNER + s]
export const playerFunds = (S: Sim, p: number) => S[PLAYER_FUNDS + p]
export const turnOf = (S: Sim) => S[TURN]
export const stepOf = (S: Sim) => S[STEP]

export const isTerminal = (S: Sim) => S[TURN] >= TOTAL_TURNS
export const moverOf = (S: Sim): Player => (S[STEP] & 1) as Player

const PHASES: Kind[] = ['poll', 'public', 'advert', 'funds']
export const kindOfStep = (step: number): Kind => PHASES[step >> 1]
export const currentKind = (S: Sim): Kind => kindOfStep(S[STEP])

export function createSim(rng: Rng): Sim {
  const S = new Int16Array(SIZE)

  for (let s = 0; s < NUM_STATES; s++) {
    S[FUNDS + s] = STATES[s].maxFunds
    S[LEADER + s] = -1
    S[WINNER + s] = -1

    if (s % 4 === 0) {
      const roll = 49 + rng.int(3)
      S[PCT + s * 2] = roll
      S[PCT + s * 2 + 1] = 100 - roll
    }
  }

  S[PLAYER_FUNDS] = 3
  S[PLAYER_FUNDS + 1] = 3
  return S
}

export function createWorld(parties: [number[], number[]], rng: Rng): World {
  const favored = new Uint8Array(NUM_STATES * PARTY_SIZE)
  const opposed = new Uint8Array(NUM_STATES * PARTY_SIZE)
  const ids = Array.from({ length: NUM_ISSUES }, (_, i) => i)

  for (let s = 0; s < NUM_STATES; s++) {
    rng.shuffle(ids)
    for (let j = 0; j < PARTY_SIZE; j++) {
      favored[s * PARTY_SIZE + j] = ids[j]
      opposed[s * PARTY_SIZE + j] = ids[PARTY_SIZE + j]
    }
  }

  const usable = new Uint16Array(2 * NUM_STATES)
  const masks = parties.map((issues) => issues.reduce((m, i) => m | (1 << i), 0))

  for (let p = 0; p < 2; p++) {
    for (let s = 0; s < NUM_STATES; s++) {
      let mask = 0
      for (let j = 0; j < PARTY_SIZE; j++) {
        if ((masks[p] >> favored[s * PARTY_SIZE + j]) & 1) mask |= 1 << j
        if ((masks[1 - p] >> opposed[s * PARTY_SIZE + j]) & 1) mask |= 1 << (PARTY_SIZE + j)
      }
      usable[p * NUM_STATES + s] = mask
    }
  }

  return { favored, opposed, party: parties, usable }
}

// A player can campaign on a state's favored issue held by their own party,
// or on a state's opposed issue held by the opposing party.
export const usableMask = (world: World, p: number, s: number) => world.usable[p * NUM_STATES + s]

export function issueOfSlot(world: World, s: number, slot: number): number {
  return slot < PARTY_SIZE ? world.favored[s * PARTY_SIZE + slot] : world.opposed[s * PARTY_SIZE + slot - PARTY_SIZE]
}

export function usableSlots(world: World, p: number, s: number): number[] {
  const mask = usableMask(world, p, s)
  const slots: number[] = []
  for (let j = 0; j < SLOTS; j++) if ((mask >> j) & 1) slots.push(j)
  return slots
}

// The winner of an exchange gains `gain` momentum (capped at 3); the loser loses as much (floored at 0).
export function boostedMomentum(m0: number, m1: number, winner: number, gain: number): [number, number] {
  return winner === 0
    ? [Math.min(3, m0 + gain), Math.max(0, m1 - gain)]
    : [Math.max(0, m0 - gain), Math.min(3, m1 + gain)]
}

export const gainOf = (kind: Kind) => (kind === 'public' ? 2 : 1)

// Legal moves for the player to move. `prune` drops moves that are pointless for the bot to consider.
export function genMoves(world: World, S: Sim, prune: boolean): Move[] {
  const p = moverOf(S)
  const kind = currentKind(S)
  const moves: Move[] = [PASS]

  if (kind !== 'funds' && S[PLAYER_FUNDS + p] <= 0) return moves

  for (let s = 0; s < NUM_STATES; s++) {
    if (S[WINNER + s] >= 0) continue

    if (kind === 'poll') {
      if (prune && S[PCT + s * 2] === 50 && S[PCT + s * 2 + 1] === 50) continue
    } else if (kind === 'funds') {
      if (S[FUNDS + s] <= 0 || S[PCT + s * 2 + p] <= S[PCT + s * 2 + 1 - p]) continue
    } else if (!usableMask(world, p, s)) {
      continue
    }

    moves.push(move(kind, s))
  }

  return moves
}

export function applyMove(S: Sim, p: Player, m: Move, correct: boolean, pollRoll: number): void {
  const s = m.state

  switch (m.kind) {
    case 'poll':
      S[PLAYER_FUNDS + p]--
      S[PCT + s * 2] = pollRoll
      S[PCT + s * 2 + 1] = 100 - pollRoll
      break
    case 'public':
    case 'advert': {
      S[PLAYER_FUNDS + p]--
      const [a, b] = boostedMomentum(S[MOM + s * 2], S[MOM + s * 2 + 1], correct ? p : other(p), gainOf(m.kind))
      S[MOM + s * 2] = a
      S[MOM + s * 2 + 1] = b
      break
    }
    case 'funds':
      S[PLAYER_FUNDS + p] += S[FUNDS + s]
      S[FUNDS + s] = 0
      break
    case 'pass':
      break
  }
}

function endTurn(S: Sim): void {
  for (let s = 0; s < NUM_STATES; s++) {
    if (S[WINNER + s] >= 0) continue

    if (S[FUNDS + s] < STATES[s].maxFunds) S[FUNDS + s]++

    const m0 = S[MOM + s * 2]
    const m1 = S[MOM + s * 2 + 1]
    if (m0 > m1) {
      S[PCT + s * 2] += 5
      S[PCT + s * 2 + 1] -= 5
    } else if (m1 > m0) {
      S[PCT + s * 2] -= 5
      S[PCT + s * 2 + 1] += 5
    }

    const p0 = S[PCT + s * 2]
    const p1 = S[PCT + s * 2 + 1]
    if (p0 > p1) S[LEADER + s] = 0
    else if (p1 > p0) S[LEADER + s] = 1

    if (p0 >= 100) S[WINNER + s] = 0
    else if (p1 >= 100) S[WINNER + s] = 1
  }
}

export function advanceStep(S: Sim): void {
  S[STEP]++

  if (S[STEP] === 6) {
    endTurn(S)
    S[TURN]++
  } else if (S[STEP] === STEPS_PER_TURN) {
    S[STEP] = 0
  }
}

// Last turn: every open state goes to the player with more momentum, with a coin flip on a tie.
export function finalizeGame(S: Sim, rng: Rng): void {
  for (let s = 0; s < NUM_STATES; s++) {
    if (S[WINNER + s] >= 0) continue

    const m0 = S[MOM + s * 2]
    const m1 = S[MOM + s * 2 + 1]
    const winner = m0 > m1 ? 0 : m1 > m0 ? 1 : rng.int(2)
    S[WINNER + s] = winner
    S[PCT + s * 2 + winner] = 100
    S[PCT + s * 2 + 1 - winner] = 0
  }
}

// Electoral votes held by a player; undecided states count for their current leader.
export function tally(S: Sim, p: number): number {
  let total = 0

  for (let s = 0; s < NUM_STATES; s++) {
    const w = S[WINNER + s]
    if (w === p || (w < 0 && S[LEADER + s] === p)) total += STATES[s].votes
  }

  return total
}

// A tie on electoral votes goes to Player Two.
export const winnerOfGame = (S: Sim): Player => (tally(S, 0) > tally(S, 1) ? 0 : 1)
