import type { Level } from './levels'
import { type Rng, createRng } from './rng'
import { Searcher } from './search'
import { type Sim, usableSlots } from './sim'
import { type Move, type Player, type World, NUM_ISSUES, PARTY_SIZE } from './types'

export interface BotRequest {
  world: World
  sim: Sim
  player: Player
  level: Level
  opponentAccuracy: number
}

export interface BotResult {
  move: Move
  depth: number
  nodes: number
  ms: number
  outlook: number // the bot's estimated chance of winning, 0-100
}

// Campaign moves need an issue slot for the quiz; the choice does not change the outcome.
export function withSlot(world: World, p: Player, m: Move, rng: Rng): Move {
  if (m.kind !== 'public' && m.kind !== 'advert') return m
  const slots = usableSlots(world, p, m.state)
  return { ...m, slot: slots[rng.int(slots.length)] }
}

export function chooseBotMove(req: BotRequest, rng: Rng = createRng()): BotResult {
  const { world, sim, player, level } = req
  const searcher = new Searcher(world, player, level.accuracy, req.opponentAccuracy)
  const result = searcher.think(sim, level.maxDepth, level.ms)
  let move = result.best

  if (level.blunder > 0 && rng.chance(level.blunder)) {
    const top = searcher.rank(sim).slice(0, 3)
    move = top[rng.int(top.length)].move
  }

  return {
    move: withSlot(world, player, move, rng),
    depth: result.depth,
    nodes: result.nodes,
    ms: result.ms,
    outlook: Math.round(50 + result.value / 20),
  }
}

export function randomParty(rng: Rng, taken: number[] = []): number[] {
  const pool = Array.from({ length: NUM_ISSUES }, (_, i) => i).filter((i) => !taken.includes(i))
  return rng.shuffle(pool).slice(0, PARTY_SIZE)
}
