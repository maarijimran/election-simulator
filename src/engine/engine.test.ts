import { describe, expect, it } from 'vitest'
import { randomParty, withSlot } from './bot'
import { ISSUES } from './data/issues'
import { STATES, TOTAL_VOTES } from './data/states'
import { greedyAgent, playHeadless, randomAgent, searchAgent } from './headless'
import { createRng } from './rng'
import { Searcher } from './search'
import {
  type Sim,
  advanceStep,
  applyMove,
  boostedMomentum,
  createSim,
  createWorld,
  finalizeGame,
  genMoves,
  isTerminal,
  leaderOf,
  moverOf,
  mom,
  pct,
  playerFunds,
  stateFunds,
  stepOf,
  tally,
  turnOf,
  winnerOf,
} from './sim'
import { type Move, type Player, type World, TOTAL_TURNS, move } from './types'

function newGame(seed: number) {
  const rng = createRng(seed)
  const first = randomParty(rng)
  const world = createWorld([first, randomParty(rng, first)], rng)
  return { rng, world, sim: createSim(rng) }
}

function skipTo(sim: Sim, step: number) {
  while (stepOf(sim) !== step) advanceStep(sim)
}

describe('data', () => {
  it('has 50 states worth 536 electoral votes', () => {
    expect(STATES).toHaveLength(50)
    expect(TOTAL_VOTES).toBe(536)
  })

  it('has exactly one correct answer per quiz', () => {
    expect(ISSUES).toHaveLength(20)
    for (const issue of ISSUES) {
      for (const quiz of [issue.favored, issue.opposed]) {
        expect(quiz.answers).toHaveLength(3)
        expect(quiz.answers.filter((a) => a.correct)).toHaveLength(1)
      }
    }
  })
})

describe('rules', () => {
  it('caps momentum at 3 and floors it at 0', () => {
    expect(boostedMomentum(0, 2, 0, 2)).toEqual([2, 0])
    expect(boostedMomentum(2, 1, 0, 2)).toEqual([3, 0])
    expect(boostedMomentum(3, 3, 0, 2)).toEqual([3, 1])
    expect(boostedMomentum(1, 3, 1, 1)).toEqual([0, 3])
  })

  it('creates worlds where each state likes and dislikes ten distinct issues', () => {
    const { world } = newGame(1)
    for (let s = 0; s < 50; s++) {
      const ids = [...world.favored.slice(s * 5, s * 5 + 5), ...world.opposed.slice(s * 5, s * 5 + 5)]
      expect(new Set(ids).size).toBe(10)
    }
  })

  it('only allows polling and campaigning with funds', () => {
    const { world, sim } = newGame(2)
    expect(genMoves(world, sim, false).length).toBeGreaterThan(1)
    for (let i = 0; i < 3; i++) applyMove(sim, 0, move('poll', 1), true, 50)
    expect(playerFunds(sim, 0)).toBe(0)
    expect(genMoves(world, sim, false)).toHaveLength(1)
  })

  it('moves percentages with momentum at the end of a turn and tracks the leader', () => {
    const { sim } = newGame(3)
    applyMove(sim, 0, move('public', 1), true, 50)
    expect(mom(sim, 1, 0)).toBe(2)
    skipTo(sim, 6)
    expect(pct(sim, 1, 0)).toBe(5)
    expect(pct(sim, 1, 1)).toBe(-5)
    expect(leaderOf(sim, 1)).toBe(0)
  })

  it('lets the leader collect the funds held by a state once', () => {
    const { world, sim } = newGame(4)
    applyMove(sim, 0, move('public', 1), true, 50)
    skipTo(sim, 6)
    expect(genMoves(world, sim, false).some((m) => m.kind === 'funds' && m.state === 1)).toBe(true)

    const held = stateFunds(sim, 1)
    const before = playerFunds(sim, 0)
    applyMove(sim, 0, move('funds', 1), true, 50)
    expect(playerFunds(sim, 0)).toBe(before + held)
    expect(stateFunds(sim, 1)).toBe(0)
  })

  it('locks a state once a player reaches 100%', () => {
    const { sim } = newGame(5)
    applyMove(sim, 0, move('public', 0), true, 50)
    applyMove(sim, 0, move('public', 0), true, 50)
    while (winnerOf(sim, 0) < 0 && !isTerminal(sim)) advanceStep(sim)
    expect(winnerOf(sim, 0)).toBe(0)
    expect(turnOf(sim)).toBeLessThan(TOTAL_TURNS)
  })

  it('finishes after 20 turns and decides every state', () => {
    const { rng, sim } = newGame(6)
    while (!isTerminal(sim)) advanceStep(sim)
    finalizeGame(sim, rng)
    expect(tally(sim, 0) + tally(sim, 1)).toBe(TOTAL_VOTES)
    for (let s = 0; s < 50; s++) expect(winnerOf(sim, s)).toBeGreaterThanOrEqual(0)
  })
})

// Plain expectiminimax with the same ordering and beam, used as the reference for the pruned search.
function reference(se: Searcher, world: World, S: Sim, depth: number, ply: number, me: Player, pMe: number, pOpp: number): number {
  if (isTerminal(S) || depth <= 0) return se.leaf(S)

  const list = se.rank(S)
  const p = moverOf(S)
  const childDepth = list.length === 1 ? depth : depth - 1
  const values = list.slice(0, Searcher.beamWidth(ply)).map(({ move: m }) => {
    const kid = (ok: boolean) => {
      const next = S.slice()
      applyMove(next, p, m, ok, 50)
      advanceStep(next)
      return reference(se, world, next, childDepth, ply + 1, me, pMe, pOpp)
    }
    if (m.kind !== 'public' && m.kind !== 'advert') return kid(true)
    const w = p === me ? pMe : pOpp
    return w * kid(true) + (1 - w) * kid(false)
  })

  return p === me ? Math.max(...values) : Math.min(...values)
}

describe('search', () => {
  it('matches brute-force expectiminimax on mid-game positions', () => {
    for (let g = 0; g < 4; g++) {
      const { rng, world, sim } = newGame(10 + g)
      const greedy = greedyAgent(0.7)

      for (let k = 0; k < 8 * (2 + g * 3) + g && !isTerminal(sim); k++) {
        const p = moverOf(sim)
        const m = greedy.choose(world, sim, p, 0.65, rng)
        applyMove(sim, p, m, rng.chance(0.7), 50)
        advanceStep(sim)
      }

      for (const me of [0, 1] as Player[]) {
        for (let depth = 1; depth <= 3; depth++) {
          const se = new Searcher(world, me, 0.8, 0.6)
          const pruned = se.search(sim.slice(), depth, 0, -Infinity, Infinity)
          expect(pruned).toBeCloseTo(reference(se, world, sim, depth, 0, me, 0.8, 0.6), 6)
        }
      }
    }
  })

  it('returns a legal move within the time budget', () => {
    const { rng, world, sim } = newGame(21)
    const start = performance.now()
    const m: Move = withSlot(world, 0, new Searcher(world, 0, 0.8, 0.6).think(sim, 8, 100).best, rng)
    expect(performance.now() - start).toBeLessThan(400)
    expect(genMoves(world, sim, false).some((x) => x.kind === m.kind && x.state === m.state)).toBe(true)
  })
})

describe('bot strength', () => {
  const level = { id: 'medium' as const, label: '', blurb: '', ms: 30, maxDepth: 12, accuracy: 0.8, blunder: 0 }

  it('beats a random player from either seat', () => {
    let wins = 0
    for (let g = 0; g < 4; g++) {
      const seat = (g % 2) as Player
      const agents = [randomAgent(0.8), randomAgent(0.8)] as [ReturnType<typeof randomAgent>, ReturnType<typeof randomAgent>]
      agents[seat] = searchAgent(level)
      const outcome = playHeadless(agents, createRng(100 + g))
      if (outcome.winner === seat) wins++
    }
    expect(wins).toBeGreaterThanOrEqual(3)
  })

  it('always plays to the final turn', () => {
    const outcome = playHeadless([randomAgent(0.7), randomAgent(0.7)], createRng(9))
    expect(turnOf(outcome.sim)).toBe(TOTAL_TURNS)
  })
})
