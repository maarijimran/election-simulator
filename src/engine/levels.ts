export type LevelId = 'easy' | 'medium' | 'hard'

export interface Level {
  id: LevelId
  label: string
  blurb: string
  ms: number // thinking time per move
  maxDepth: number // plies
  accuracy: number // chance the bot answers a campaign question correctly
  blunder: number // chance it plays one of its top three moves at random
}

export const LEVELS: Level[] = [
  {
    id: 'easy',
    label: 'Easy',
    blurb: 'Shallow search, occasional mistakes, shaky on quizzes.',
    ms: 150,
    maxDepth: 2,
    accuracy: 0.55,
    blunder: 0.3,
  },
  {
    id: 'medium',
    label: 'Medium',
    blurb: 'Looks several moves ahead and rarely slips.',
    ms: 700,
    maxDepth: 5,
    accuracy: 0.75,
    blunder: 0.1,
  },
  {
    id: 'hard',
    label: 'Hard',
    blurb: 'Deep search and almost never misses a question.',
    ms: 2000,
    maxDepth: 9,
    accuracy: 0.95,
    blunder: 0,
  },
]

export const levelById = (id: LevelId): Level => LEVELS.find((l) => l.id === id) ?? LEVELS[1]
