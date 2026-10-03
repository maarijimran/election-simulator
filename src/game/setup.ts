import { type LevelId, levelById } from '../engine/levels'
import type { Player } from '../engine/types'
import type { PlayerConfig } from './session'

export type Mode = 'bot' | 'two' | 'watch'

export interface SetupResult {
  mode: Mode
  seat: Player // the human's seat when playing against the bot
  levels: [LevelId, LevelId]
  names: [string, string]
  parties: [string, string]
}

export const DEFAULT_SETUP: SetupResult = {
  mode: 'bot',
  seat: 0,
  levels: ['medium', 'medium'],
  names: ['Player One', 'Player Two'],
  parties: ['Blue Party', 'Red Party'],
}

export const isBot = (setup: SetupResult, p: Player) => setup.mode === 'watch' || (setup.mode === 'bot' && p !== setup.seat)

export function buildPlayers(setup: SetupResult): [PlayerConfig, PlayerConfig] {
  const build = (p: Player): PlayerConfig => {
    const fallback = DEFAULT_SETUP.names[p]
    const party = setup.parties[p].trim() || DEFAULT_SETUP.parties[p]

    if (isBot(setup, p)) {
      return { name: setup.mode === 'watch' ? `Bot ${p === 0 ? 'One' : 'Two'}` : 'Bot', party, kind: 'bot', level: levelById(setup.levels[p]) }
    }

    return { name: setup.names[p].trim() || fallback, party, kind: 'human' }
  }

  return [build(0), build(1)]
}
