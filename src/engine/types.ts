export const NUM_ISSUES = 20
export const NUM_STATES = 50
export const PARTY_SIZE = 5
export const TOTAL_TURNS = 20
export const STEPS_PER_TURN = 8
export const SLOTS = PARTY_SIZE * 2

export type Player = 0 | 1
export type PhaseKind = 'poll' | 'public' | 'advert' | 'funds'
export type SpecialKind = 'celebrity' | 'scandal' | 'fundraiser'
export type Kind = 'pass' | PhaseKind | SpecialKind

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

// Special actions replace a player's normal action in the poll, campaign and advertising phases.
export const SPECIALS: SpecialKind[] = ['celebrity', 'scandal', 'fundraiser']
export const SPECIAL_USES = 2
export const SPECIAL_COST: Record<SpecialKind, number> = { celebrity: 2, scandal: 1, fundraiser: 0 }
export const SCANDAL_CHANCE = 0.6
export const FUNDRAISER_GAIN = 2

export const isSpecial = (kind: Kind): kind is SpecialKind => kind === 'celebrity' || kind === 'scandal' || kind === 'fundraiser'
export const isCampaign = (kind: Kind) => kind === 'public' || kind === 'advert'
