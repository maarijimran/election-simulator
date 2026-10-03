import { BotClient } from '../ai/botClient'
import { ISSUES } from '../engine/data/issues'
import { STATES } from '../engine/data/states'
import type { Level } from '../engine/levels'
import { type AnswerRecord, emptyRecord, estimateAccuracy } from '../engine/opponent'
import { type Rng, createRng } from '../engine/rng'
import {
  type Sim,
  advanceStep,
  applyMove,
  chanceOutcome,
  createSim,
  createWorld,
  currentKind,
  finalizeGame,
  firstMover,
  gainOf,
  genMoves,
  isTerminal,
  issueOfSlot,
  moverOf,
  specialsLeft,
  stateFunds,
  stepOf,
  turnOf,
  usableMask,
  winnerOfGame,
} from '../engine/sim'
import {
  type Move,
  type PhaseKind,
  type Player,
  type SpecialKind,
  type World,
  FUNDRAISER_GAIN,
  NUM_STATES,
  PARTY_SIZE,
  PASS,
  SPECIALS,
  TOTAL_TURNS,
  isCampaign,
  isSpecial,
  move,
  other,
} from '../engine/types'

export interface PlayerConfig {
  name: string
  party: string
  avatar: number
  kind: 'human' | 'bot'
  level?: Level
}

export interface GameConfig {
  players: [PlayerConfig, PlayerConfig]
  parties: [number[], number[]] // issue indices held by each party
}

export interface LogEntry {
  id: number
  player: Player | null // null marks a separator
  text: string
  tone: 'neutral' | 'good' | 'bad'
}

export interface QuizView {
  player: Player
  state: number
  slot: number
  kind: 'public' | 'advert'
  issue: string
  question: string
  answers: { text: string; correct: boolean }[]
  chosen: number | null
}

export interface BotInfo {
  player: Player
  depth: number
  nodes: number
  ms: number
  outlook: number
}

export type SpecialUses = Record<SpecialKind, number>

export interface Snapshot {
  sim: Sim
  world: World
  config: GameConfig
  mover: Player
  first: Player // who acts first in the current phase
  kind: PhaseKind
  turn: number
  over: boolean
  winner: Player | null
  awaiting: 'human' | 'bot' | 'idle'
  legal: boolean[] // states the human to move can act on with the phase action
  special: { celebrity: boolean[]; scandal: boolean[]; fundraiser: boolean }
  specials: [SpecialUses, SpecialUses]
  quiz: QuizView | null
  log: LogEntry[]
  botInfo: BotInfo | null
  notice: string | null
  lastAction: { state: number; player: Player; seq: number } | null
  records: [AnswerRecord, AnswerRecord]
}

interface HumanChoice {
  move: Move
  correct: boolean
}

const BOT_PACE_MS = 800
const AUTO_PASS_MS = 900

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

const usesOf = (S: Sim, p: Player): SpecialUses =>
  Object.fromEntries(SPECIALS.map((kind) => [kind, specialsLeft(S, p, kind)])) as SpecialUses

export class GameSession {
  readonly world: World
  private sim: Sim
  private readonly rng: Rng
  private readonly bot = new BotClient()
  private readonly records: [AnswerRecord, AnswerRecord] = [emptyRecord(), emptyRecord()]
  private readonly listeners = new Set<() => void>()
  private log: LogEntry[] = []
  private quiz: QuizView | null = null
  private botInfo: BotInfo | null = null
  private notice: string | null = null
  private lastAction: Snapshot['lastAction'] = null
  private awaiting: Snapshot['awaiting'] = 'idle'
  private over = false
  private disposed = false
  private announcedTurn = -1
  private actionSeq = 0
  private pending: ((choice: HumanChoice) => void) | null = null
  private dismiss: (() => void) | null = null
  private snapshot!: Snapshot

  constructor(
    readonly config: GameConfig,
    seed?: number,
  ) {
    this.rng = createRng(seed)
    this.world = createWorld(config.parties, this.rng)
    this.sim = createSim(this.rng)
    this.emit()
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getSnapshot = () => this.snapshot

  start(): void {
    void this.loop()
  }

  dispose(): void {
    this.disposed = true
    this.bot.dispose()
    this.pending = null
    this.dismiss?.()
    this.listeners.clear()
  }

  pass(): void {
    this.submit({ move: PASS, correct: true })
  }

  poll(state: number): void {
    if (this.isLegal('poll', state)) this.submit({ move: move('poll', state), correct: true })
  }

  takeFunds(state: number): void {
    if (this.isLegal('funds', state)) this.submit({ move: move('funds', state), correct: true })
  }

  special(kind: SpecialKind, state = -1): void {
    if (this.isLegal(kind, state)) this.submit({ move: move(kind, state), correct: chanceOutcome(kind, 0, this.rng) })
  }

  beginCampaign(state: number, slot: number): void {
    const kind = currentKind(this.sim)
    if (this.awaiting !== 'human' || this.quiz || (kind !== 'public' && kind !== 'advert')) return
    if (!this.isLegal(kind, state) || !((usableMask(this.world, moverOf(this.sim), state) >> slot) & 1)) return

    const issue = ISSUES[issueOfSlot(this.world, state, slot)]
    const quiz = slot < PARTY_SIZE ? issue.favored : issue.opposed
    this.quiz = {
      player: moverOf(this.sim),
      state,
      slot,
      kind,
      issue: issue.name,
      question: quiz.question,
      answers: this.rng.shuffle([...quiz.answers]),
      chosen: null,
    }
    this.emit()
  }

  cancelCampaign(): void {
    if (this.quiz && this.quiz.chosen === null) {
      this.quiz = null
      this.emit()
    }
  }

  answer(index: number): void {
    const quiz = this.quiz
    if (!quiz || quiz.chosen !== null || !this.pending) return

    quiz.chosen = index
    this.quiz = { ...quiz }
    this.submit({ move: move(quiz.kind, quiz.state, quiz.slot), correct: quiz.answers[index].correct })
  }

  dismissQuiz(): void {
    if (!this.quiz || this.quiz.chosen === null) return
    this.quiz = null
    this.dismiss?.()
    this.dismiss = null
    this.emit()
  }

  private isLegal(kind: Move['kind'], state: number): boolean {
    return (
      this.awaiting === 'human' &&
      !this.quiz &&
      genMoves(this.world, this.sim, false).some((m) => m.kind === kind && m.state === state)
    )
  }

  private submit(choice: HumanChoice): void {
    if (!this.pending) return
    const resolve = this.pending
    this.pending = null
    resolve(choice)
  }

  private async loop(): Promise<void> {
    while (!this.disposed && !isTerminal(this.sim)) {
      const p = moverOf(this.sim)
      this.announceTurn()

      if (genMoves(this.world, this.sim, false).length === 1) {
        await this.autoPass(p)
        continue
      }

      if (this.config.players[p].kind === 'human') {
        this.awaiting = 'human'
        this.emit()
        const choice = await new Promise<HumanChoice>((resolve) => (this.pending = resolve))
        if (this.disposed) return

        this.awaiting = 'idle'
        this.commit(p, choice.move, choice.correct)
        if (this.quiz) await new Promise<void>((resolve) => (this.dismiss = resolve))
      } else {
        await this.botTurn(p)
      }
    }

    if (!this.disposed) this.finish()
  }

  private async autoPass(p: Player): Promise<void> {
    if (this.config.players[p].kind === 'human') {
      this.notice = `${this.config.players[p].name} has no available action`
      this.emit()
      await delay(AUTO_PASS_MS)
      this.notice = null
    }
    if (!this.disposed) this.commit(p, PASS, true, false)
  }

  private async botTurn(p: Player): Promise<void> {
    const level = this.config.players[p].level!
    const started = performance.now()
    this.awaiting = 'bot'
    this.emit()

    const result = await this.bot.think({
      world: this.world,
      sim: this.sim,
      player: p,
      level,
      opponentAccuracy: estimateAccuracy(this.records[other(p)]),
    })

    await delay(Math.max(0, BOT_PACE_MS - (performance.now() - started)))
    if (this.disposed) return

    this.botInfo = { player: p, depth: result.depth, nodes: result.nodes, ms: result.ms, outlook: result.outlook }
    this.awaiting = 'idle'
    this.commit(p, result.move, chanceOutcome(result.move.kind, level.accuracy, this.rng))
  }

  private announceTurn(): void {
    if (stepOf(this.sim) !== 0 || this.announcedTurn === turnOf(this.sim)) return
    this.announcedTurn = turnOf(this.sim)

    if (this.announcedTurn === 0) {
      this.addLog(null, `Coin toss: ${this.config.players[firstMover(this.sim)].name} acts first`, 'neutral')
    }
    this.addLog(null, `Turn ${turnOf(this.sim) + 1}`, 'neutral')
  }

  private commit(p: Player, m: Move, correct: boolean, record = true): void {
    const next = this.sim.slice()
    const name = this.config.players[p].name
    const rival = this.config.players[other(p)].name
    const roll = 49 + this.rng.int(3)
    const state = m.state >= 0 ? STATES[m.state].name : ''
    const held = m.kind === 'funds' ? stateFunds(next, m.state) : 0

    if (isCampaign(m.kind)) {
      this.records[p] = { correct: this.records[p].correct + (correct ? 1 : 0), total: this.records[p].total + 1 }
    }

    applyMove(next, p, m, correct, roll)
    advanceStep(next)
    this.sim = next
    this.lastAction = m.state >= 0 ? { state: m.state, player: p, seq: ++this.actionSeq } : null

    if (record) this.logMove(p, m, correct, { name, rival, state, roll, held })
    this.emit()
  }

  private logMove(p: Player, m: Move, correct: boolean, t: { name: string; rival: string; state: string; roll: number; held: number }): void {
    const { name, rival, state } = t
    const gain = gainOf(m.kind)

    switch (m.kind) {
      case 'pass':
        this.addLog(p, `${name} passed`, 'neutral')
        break
      case 'poll':
        this.addLog(p, `${name} polled ${state}: ${t.roll}% to ${100 - t.roll}%`, 'neutral')
        break
      case 'funds':
        this.addLog(p, `${name} collected ${t.held} fund${t.held === 1 ? '' : 's'} from ${state}`, 'neutral')
        break
      case 'celebrity':
        this.addLog(p, `${name} landed a celebrity endorsement in ${state}: +${gain} momentum`, 'good')
        break
      case 'scandal':
        this.addLog(
          p,
          correct
            ? `${name} leaked a scandal in ${state}: ${rival} loses 2 momentum`
            : `${name}'s scandal in ${state} backfired: ${name} loses 2 momentum`,
          correct ? 'good' : 'bad',
        )
        break
      case 'fundraiser':
        this.addLog(p, `${name} held a fundraiser: +${FUNDRAISER_GAIN} funds`, 'good')
        break
      default: {
        const issue = ISSUES[issueOfSlot(this.world, m.state, m.slot)].name
        this.addLog(
          p,
          correct
            ? `${name} ${m.kind === 'public' ? 'campaigned' : 'advertised'} in ${state} on ${issue}: correct, +${gain} momentum`
            : `${name} missed the ${issue} question in ${state}: ${rival} gains +${gain} momentum`,
          correct ? 'good' : 'bad',
        )
      }
    }
  }

  private finish(): void {
    const final = this.sim.slice()
    finalizeGame(final, this.rng)
    this.sim = final
    this.over = true
    this.awaiting = 'idle'
    this.lastAction = null
    this.addLog(null, 'Final result', 'neutral')
    this.emit()
  }

  private addLog(player: Player | null, text: string, tone: LogEntry['tone']): void {
    this.log = [...this.log, { id: this.log.length, player, text, tone }]
  }

  private emit(): void {
    const S = this.sim
    const human = this.awaiting === 'human' && !this.quiz
    const legal = new Array<boolean>(NUM_STATES).fill(false)
    const special = {
      celebrity: new Array<boolean>(NUM_STATES).fill(false),
      scandal: new Array<boolean>(NUM_STATES).fill(false),
      fundraiser: false,
    }

    if (human) {
      for (const m of genMoves(this.world, S, false)) {
        if (isSpecial(m.kind)) {
          if (m.kind === 'fundraiser') special.fundraiser = true
          else special[m.kind][m.state] = true
        } else if (m.state >= 0) {
          legal[m.state] = true
        }
      }
    }

    this.snapshot = {
      sim: S,
      world: this.world,
      config: this.config,
      mover: moverOf(S),
      first: firstMover(S),
      kind: currentKind(S),
      turn: Math.min(turnOf(S) + 1, TOTAL_TURNS),
      over: this.over,
      winner: this.over ? winnerOfGame(S) : null,
      awaiting: this.awaiting,
      legal,
      special,
      specials: [usesOf(S, 0), usesOf(S, 1)],
      quiz: this.quiz,
      log: this.log,
      botInfo: this.botInfo,
      notice: this.notice,
      lastAction: this.lastAction,
      records: [{ ...this.records[0] }, { ...this.records[1] }],
    }

    this.listeners.forEach((listener) => listener())
  }
}
