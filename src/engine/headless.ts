import { chooseBotMove, randomParty, withSlot } from './bot'
import type { Level } from './levels'
import { estimateAccuracy, emptyRecord } from './opponent'
import type { Rng } from './rng'
import { Searcher } from './search'
import {
  type Sim,
  advanceStep,
  applyMove,
  createSim,
  createWorld,
  finalizeGame,
  genMoves,
  isTerminal,
  moverOf,
  tally,
  winnerOfGame,
} from './sim'
import { type Move, type Player, type World, other } from './types'

// Games without a UI, used by the tests and the benchmark script.
export interface Agent {
  accuracy: number
  choose(world: World, sim: Sim, p: Player, opponentAccuracy: number, rng: Rng): Move
}

export const randomAgent = (accuracy: number): Agent => ({
  accuracy,
  choose: (world, sim, p, _opp, rng) => {
    const moves = genMoves(world, sim, false)
    return withSlot(world, p, moves[rng.int(moves.length)], rng)
  },
})

export const greedyAgent = (accuracy: number): Agent => ({
  accuracy,
  choose: (world, sim, p, opp, rng) => withSlot(world, p, new Searcher(world, p, accuracy, opp).rank(sim)[0].move, rng),
})

export const searchAgent = (level: Level): Agent => ({
  accuracy: level.accuracy,
  choose: (world, sim, p, opp, rng) => chooseBotMove({ world, sim, player: p, level, opponentAccuracy: opp }, rng).move,
})

export interface GameOutcome {
  sim: Sim
  winner: Player
  margin: number // Player One minus Player Two, in electoral votes
}

export function playHeadless(agents: [Agent, Agent], rng: Rng): GameOutcome {
  const first = randomParty(rng)
  const world = createWorld([first, randomParty(rng, first)], rng)
  const sim = createSim(rng)
  const records = [emptyRecord(), emptyRecord()]

  while (!isTerminal(sim)) {
    const p = moverOf(sim)
    const move = agents[p].choose(world, sim, p, estimateAccuracy(records[other(p)]), rng)
    const campaign = move.kind === 'public' || move.kind === 'advert'
    const correct = campaign ? rng.chance(agents[p].accuracy) : true

    if (campaign) {
      records[p].total++
      if (correct) records[p].correct++
    }

    applyMove(sim, p, move, correct, 49 + rng.int(3))
    advanceStep(sim)
  }

  finalizeGame(sim, rng)
  return { sim, winner: winnerOfGame(sim), margin: tally(sim, 0) - tally(sim, 1) }
}
