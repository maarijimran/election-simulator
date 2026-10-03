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
  chanceOf,
  chanceOutcome,
  createSim,
  createWorld,
  finalizeGame,
  firstMover,
  genMoves,
  isTerminal,
  leaderOf,
  moverOf,
  mom,
  pct,
  playerFunds,
  specialsLeft,
  stateFunds,
  stepOf,
  tally,
  turnOf,
  winnerOf,
} from './sim'
import { type Move, type Player, SCANDAL_CHANCE, TOTAL_TURNS, move, other } from './types'

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

  it('alternates who acts first between phases and between turns', () => {
    const { sim } = newGame(2)
    const opening = firstMover(sim)

    for (const [step, expected] of [[0, opening], [2, other(opening)], [4, opening]] as [number, Player][]) {
      skipTo(sim, step)
      expect(firstMover(sim)).toBe(expected)
      expect(moverOf(sim)).toBe(expected)
      advanceStep(sim)
      expect(moverOf(sim)).toBe(other(expected))
      advanceStep(sim)
    }

    while (turnOf(sim) < 1 || stepOf(sim) !== 0) advanceStep(sim)
    expect(firstMover(sim)).toBe(other(opening))
  })

  it('offers only a pass and a fundraiser to a player without funds', () => {
    const { world, sim } = newGame(3)
    const p = moverOf(sim)
    for (let i = 0; i < 3; i++) applyMove(sim, p, move('poll', 1), true, 50)
    expect(playerFunds(sim, p)).toBe(0)
    expect(
      genMoves(world, sim, false)
        .map((m) => m.kind)
        .sort(),
    ).toEqual(['fundraiser', 'pass'])
  })

  it('moves percentages with momentum at the end of a turn and tracks the leader', () => {
    const { sim } = newGame(4)
    applyMove(sim, 0, move('public', 1), true, 50)
    expect(mom(sim, 1, 0)).toBe(2)
    skipTo(sim, 6)
    expect(pct(sim, 1, 0)).toBe(5)
    expect(pct(sim, 1, 1)).toBe(-5)
    expect(leaderOf(sim, 1)).toBe(0)
  })

  it('lets the leader collect the funds held by a state once', () => {
    const { world, sim } = newGame(5)
    const probe = sim.slice()
    skipTo(probe, 6)
    const p = moverOf(probe)

    applyMove(sim, p, move('public', 1), true, 50)
    skipTo(sim, 6)
    expect(genMoves(world, sim, false).some((m) => m.kind === 'funds' && m.state === 1)).toBe(true)

    const held = stateFunds(sim, 1)
    const before = playerFunds(sim, p)
    applyMove(sim, p, move('funds', 1), true, 50)
    expect(playerFunds(sim, p)).toBe(before + held)
    expect(stateFunds(sim, 1)).toBe(0)
  })

  it('locks a state once a player reaches 100%', () => {
    const { sim } = newGame(6)
    applyMove(sim, 0, move('public', 0), true, 50)
    applyMove(sim, 0, move('public', 0), true, 50)
    while (winnerOf(sim, 0) < 0 && !isTerminal(sim)) advanceStep(sim)
    expect(winnerOf(sim, 0)).toBe(0)
    expect(turnOf(sim)).toBeLessThan(TOTAL_TURNS)
  })

  it('finishes after 20 turns and decides every state', () => {
    const { rng, sim } = newGame(7)
    while (!isTerminal(sim)) advanceStep(sim)
    finalizeGame(sim, rng)
    expect(tally(sim, 0) + tally(sim, 1)).toBe(TOTAL_VOTES)
    for (let s = 0; s < 50; s++) expect(winnerOf(sim, s)).toBeGreaterThanOrEqual(0)
  })

  it('gives open states to the polling leader before momentum, so a late swing cannot erase a lead', () => {
    const { rng, sim } = newGame(8)
    applyMove(sim, 0, move('poll', 1), true, 49) // Player Two leads 51-49
    applyMove(sim, 0, move('public', 1), true, 50)
    applyMove(sim, 0, move('public', 1), true, 50) // Player One holds full momentum
    finalizeGame(sim, rng)
    expect(winnerOf(sim, 1)).toBe(1)
  })
})

describe('special actions', () => {
  it('celebrity endorsement costs 2 funds and swings momentum by 2', () => {
    const { world, sim } = newGame(10)
    const p = moverOf(sim)
    applyMove(sim, other(p), move('public', 3), true, 50)
    const rivalMomentum = mom(sim, 3, other(p))
    const funds = playerFunds(sim, p)

    expect(genMoves(world, sim, false).some((m) => m.kind === 'celebrity' && m.state === 3)).toBe(true)
    applyMove(sim, p, move('celebrity', 3), true, 50)
    expect(playerFunds(sim, p)).toBe(funds - 2)
    expect(mom(sim, 3, p)).toBe(2)
    expect(mom(sim, 3, other(p))).toBe(Math.max(0, rivalMomentum - 2))
    expect(specialsLeft(sim, p, 'celebrity')).toBe(1)
  })

  it('a scandal either drains the rival or backfires on the sender', () => {
    const { sim } = newGame(11)
    const p = moverOf(sim)
    applyMove(sim, p, move('public', 5), true, 50)
    applyMove(sim, other(p), move('public', 5), true, 50)
    const mine = mom(sim, 5, p)
    const theirs = mom(sim, 5, other(p))

    const hit = sim.slice()
    applyMove(hit, p, move('scandal', 5), true, 50)
    expect(mom(hit, 5, other(p))).toBe(Math.max(0, theirs - 2))
    expect(mom(hit, 5, p)).toBe(mine)

    const miss = sim.slice()
    applyMove(miss, p, move('scandal', 5), false, 50)
    expect(mom(miss, 5, p)).toBe(Math.max(0, mine - 2))
    expect(mom(miss, 5, other(p))).toBe(theirs)
    expect(playerFunds(miss, p)).toBe(playerFunds(sim, p) - 1)
  })

  it('a fundraiser adds funds without spending any', () => {
    const { sim } = newGame(12)
    const p = moverOf(sim)
    applyMove(sim, p, move('fundraiser', -1), true, 50)
    expect(playerFunds(sim, p)).toBe(5)
    expect(specialsLeft(sim, p, 'fundraiser')).toBe(1)
  })

  it('limits each special to two uses per player and never offers them in the funding phase', () => {
    const { world, sim } = newGame(13)
    const p = moverOf(sim)
    applyMove(sim, p, move('fundraiser', -1), true, 50)
    applyMove(sim, p, move('fundraiser', -1), true, 50)
    expect(genMoves(world, sim, false).some((m) => m.kind === 'fundraiser')).toBe(false)

    skipTo(sim, 6)
    expect(genMoves(world, sim, false).every((m) => ['pass', 'funds'].includes(m.kind))).toBe(true)
  })

  it('only scandals carry a fixed chance', () => {
    expect(chanceOf('scandal', 0.9)).toBe(SCANDAL_CHANCE)
    expect(chanceOf('public', 0.9)).toBe(0.9)
    expect(chanceOf('celebrity', 0.9)).toBeNull()
    expect(chanceOf('poll', 0.9)).toBeNull()
    expect(chanceOutcome('fundraiser', 0, createRng(1))).toBe(true)
  })
})

// Plain expectiminimax with the same ordering and beam, used as the reference for the pruned search.
function reference(se: Searcher, S: Sim, depth: number, ply: number, me: Player, pMe: number, pOpp: number): number {
  if (isTerminal(S) || depth <= 0) return se.leaf(S)

  const list = se.rank(S)
  const p = moverOf(S)
  const childDepth = list.length === 1 ? depth : depth - 1
  const values = list.slice(0, Searcher.beamWidth(ply)).map(({ move: m }) => {
    const kid = (ok: boolean) => {
      const next = S.slice()
      applyMove(next, p, m, ok, 50)
      advanceStep(next)
      return reference(se, next, childDepth, ply + 1, me, pMe, pOpp)
    }
    const w = chanceOf(m.kind, p === me ? pMe : pOpp)
    return w === null ? kid(true) : w * kid(true) + (1 - w) * kid(false)
  })

  return p === me ? Math.max(...values) : Math.min(...values)
}

describe('search', () => {
  it('matches brute-force expectiminimax on mid-game positions', () => {
    for (let g = 0; g < 4; g++) {
      const { rng, world, sim } = newGame(20 + g)
      const greedy = greedyAgent(0.7)

      for (let k = 0; k < 8 * (2 + g * 3) + g && !isTerminal(sim); k++) {
        const p = moverOf(sim)
        const m = greedy.choose(world, sim, p, 0.65, rng)
        applyMove(sim, p, m, chanceOutcome(m.kind, 0.7, rng), 50)
        advanceStep(sim)
      }

      for (const me of [0, 1] as Player[]) {
        for (let depth = 1; depth <= 3; depth++) {
          const se = new Searcher(world, me, 0.8, 0.6)
          const pruned = se.search(sim.slice(), depth, 0, -Infinity, Infinity)
          expect(pruned).toBeCloseTo(reference(se, sim, depth, 0, me, 0.8, 0.6), 6)
        }
      }
    }
  })

  it('returns a legal move within the time budget', () => {
    const { rng, world, sim } = newGame(31)
    const p = moverOf(sim)
    const start = performance.now()
    const m: Move = withSlot(world, p, new Searcher(world, p, 0.8, 0.6).think(sim, 8, 100).best, rng)
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

  it('gives neither seat an edge between equal greedy players', () => {
    const rng = createRng(77)
    let starterWins = 0
    const games = 300
    for (let g = 0; g < games; g++) {
      const outcome = playHeadless([greedyAgent(0.8), greedyAgent(0.8)], rng)
      if (outcome.winner === outcome.starter) starterWins++
    }
    expect(starterWins / games).toBeGreaterThan(0.4)
    expect(starterWins / games).toBeLessThan(0.6)
  })
})
