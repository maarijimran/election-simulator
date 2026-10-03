import { AVATARS } from './avatars'
import { type LevelId, levelById } from '../engine/levels'
import { type Rng } from '../engine/rng'
import type { Player } from '../engine/types'
import type { PlayerConfig } from './session'

export type Mode = 'bot' | 'two' | 'watch'

export interface SetupResult {
  mode: Mode
  seat: Player // the human's seat when playing against the bot
  levels: [LevelId, LevelId]
  names: [string, string]
  parties: [string, string]
  avatars: [number, number] // portraits chosen by human players
}

export const DEFAULT_SETUP: SetupResult = {
  mode: 'bot',
  seat: 0,
  levels: ['medium', 'medium'],
  names: ['Player One', 'Player Two'],
  parties: ['Blue Party', 'Red Party'],
  avatars: [0, 1],
}

export const isBot = (setup: SetupResult, p: Player) => setup.mode === 'watch' || (setup.mode === 'bot' && p !== setup.seat)

// Bots draw a random portrait that no other player has taken.
export function assignAvatars(setup: SetupResult, rng: Rng): [number, number] {
  const taken = new Set<number>()
  const result: [number, number] = [0, 0]

  for (const p of [0, 1] as Player[]) {
    if (!isBot(setup, p)) {
      result[p] = setup.avatars[p]
      taken.add(setup.avatars[p])
    }
  }

  for (const p of [0, 1] as Player[]) {
    if (isBot(setup, p)) {
      const free = AVATARS.map((_, i) => i).filter((i) => !taken.has(i))
      result[p] = free[rng.int(free.length)]
      taken.add(result[p])
    }
  }

  return result
}

export function buildPlayers(setup: SetupResult, avatars: [number, number]): [PlayerConfig, PlayerConfig] {
  const build = (p: Player): PlayerConfig => {
    const party = setup.parties[p].trim() || DEFAULT_SETUP.parties[p]

    if (isBot(setup, p)) {
      return {
        name: setup.mode === 'watch' ? `Bot ${p === 0 ? 'One' : 'Two'}` : 'Bot',
        party,
        avatar: avatars[p],
        kind: 'bot',
        level: levelById(setup.levels[p]),
      }
    }

    return { name: setup.names[p].trim() || DEFAULT_SETUP.names[p], party, avatar: avatars[p], kind: 'human' }
  }

  return [build(0), build(1)]
}
