import { moveGain, margin } from './evaluate'
import {
  type Sim,
  advanceStep,
  applyMove,
  genMoves,
  isTerminal,
  moverOf,
  turnOf,
} from './sim'
import { type Move, type Player, type World, TOTAL_TURNS } from './types'

// Expectiminimax with alpha-beta pruning, iterative deepening and a time budget.
//  - The bot maximizes, the opponent minimizes.
//  - Campaign answers are chance nodes: the bot uses its own accuracy, the opponent a learned estimate.
//  - Polls are searched as their expected outcome (an even split).
//  - Moves are ordered by moveGain() and only the best few are searched below the root.
//  - Forced moves (only "pass" available) do not consume depth.
// Values lie in [-VALUE_BOUND, VALUE_BOUND] from the bot's point of view.

const VALUE_BOUND = 1000

export interface ScoredMove {
  score: number
  move: Move
}

export interface SearchResult {
  best: Move
  depth: number
  nodes: number
  value: number
  ms: number
}

export class Searcher {
  private deadline = Infinity
  private nodes = 0
  private aborted = false
  private cutByDepth = false

  constructor(
    private readonly world: World,
    private readonly me: Player,
    private readonly pMe: number,
    private readonly pOpp: number,
  ) {}

  static beamWidth(ply: number): number {
    return ply === 0 ? Infinity : ply === 1 ? 10 : ply === 2 ? 7 : 5
  }

  think(S: Sim, maxDepth: number, timeMs: number): SearchResult {
    const list = this.rank(S)
    const p = moverOf(S)
    const start = performance.now()
    const result: SearchResult = { best: list[0].move, depth: 0, nodes: 0, value: 0, ms: 0 }

    this.deadline = start + timeMs
    this.nodes = 0
    this.aborted = false

    for (let depth = 1; list.length > 1 && depth <= maxDepth; depth++) {
      this.cutByDepth = false
      let alpha = -Infinity
      let bestValue = -Infinity
      let bestIndex = 0

      for (let i = 0; i < list.length; i++) {
        const value = this.valueMove(S, p, list[i].move, depth - 1, 0, alpha, Infinity)
        if (this.aborted) break

        if (value > bestValue) {
          bestValue = value
          bestIndex = i
          alpha = Math.max(alpha, value)
        }
      }

      if (this.aborted) break

      result.best = list[bestIndex].move
      result.depth = depth
      result.value = bestValue

      // Searching the best move first next iteration tightens the window for the rest.
      list.unshift(...list.splice(bestIndex, 1))

      if (!this.cutByDepth) break
    }

    result.nodes = this.nodes
    result.ms = performance.now() - start
    return result
  }

  rank(S: Sim): ScoredMove[] {
    const p = moverOf(S)
    const pCorrect = p === this.me ? this.pMe : this.pOpp

    return genMoves(this.world, S, true)
      .map((move) => ({ move, score: moveGain(S, p, move, pCorrect) }))
      .sort((a, b) => b.score - a.score)
  }

  leaf(S: Sim): number {
    const turnsLeft = TOTAL_TURNS - turnOf(S)
    const value = VALUE_BOUND * Math.tanh(margin(S) / (12 + 5 * turnsLeft))
    return this.me === 0 ? value : -value
  }

  search(S: Sim, depth: number, ply: number, alpha: number, beta: number): number {
    if (isTerminal(S)) return this.leaf(S)

    if (depth <= 0) {
      this.cutByDepth = true
      return this.leaf(S)
    }

    if ((++this.nodes & 1023) === 0 && performance.now() >= this.deadline) this.aborted = true
    if (this.aborted) return 0

    const list = this.rank(S)
    const p = moverOf(S)
    const maximizing = p === this.me
    const childDepth = list.length === 1 ? depth : depth - 1
    const width = Math.min(list.length, Searcher.beamWidth(ply))
    let best = maximizing ? -Infinity : Infinity

    for (let i = 0; i < width; i++) {
      const value = this.valueMove(S, p, list[i].move, childDepth, ply, alpha, beta)
      if (this.aborted) return 0

      if (maximizing) {
        best = Math.max(best, value)
        alpha = Math.max(alpha, best)
      } else {
        best = Math.min(best, value)
        beta = Math.min(beta, best)
      }

      if (alpha >= beta) break
    }

    return best
  }

  private child(S: Sim, p: Player, m: Move, correct: boolean, depth: number, ply: number, alpha: number, beta: number) {
    const next = S.slice()
    applyMove(next, p, m, correct, 50)
    advanceStep(next)
    return this.search(next, depth, ply + 1, alpha, beta)
  }

  // Value of a move: a plain child for deterministic moves, a chance node (quiz answer) for campaigns.
  // The chance node uses Star1 pruning: each outcome gets a window that assumes the other outcome
  // is as good or as bad as the value bounds allow.
  private valueMove(S: Sim, p: Player, m: Move, depth: number, ply: number, alpha: number, beta: number): number {
    if (m.kind !== 'public' && m.kind !== 'advert') return this.child(S, p, m, true, depth, ply, alpha, beta)

    const w0 = p === this.me ? this.pMe : this.pOpp
    const w1 = 1 - w0
    const a0 = (alpha - w1 * VALUE_BOUND) / w0
    const b0 = (beta + w1 * VALUE_BOUND) / w0
    const v0 = this.child(S, p, m, true, depth, ply, Math.max(a0, -VALUE_BOUND), Math.min(b0, VALUE_BOUND))

    if (this.aborted) return 0
    if (v0 <= a0) return w0 * v0 + w1 * VALUE_BOUND
    if (v0 >= b0) return w0 * v0 - w1 * VALUE_BOUND

    const a1 = (alpha - w0 * v0) / w1
    const b1 = (beta - w0 * v0) / w1
    const v1 = this.child(S, p, m, false, depth, ply, Math.max(a1, -VALUE_BOUND), Math.min(b1, VALUE_BOUND))
    return w0 * v0 + w1 * v1
  }
}
