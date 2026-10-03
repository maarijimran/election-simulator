export const NUM_ISSUES = 20
export const NUM_STATES = 50
export const PARTY_SIZE = 5
export const TOTAL_TURNS = 20
export const STEPS_PER_TURN = 8
export const SLOTS = PARTY_SIZE * 2

export type Player = 0 | 1
export type Kind = 'pass' | 'poll' | 'public' | 'advert' | 'funds'

export interface Move {
  kind: Kind
  state: number
  slot: number
}

export const PASS: Move = { kind: 'pass', state: -1, slot: -1 }

export const move = (kind: Kind, state: number, slot = -1): Move => ({ kind, state, slot })

export interface World {
  favored: Uint8Array
  opposed: Uint8Array
  party: [number[], number[]]
  usable: Uint16Array
}

export const other = (p: Player): Player => (p === 0 ? 1 : 0)
