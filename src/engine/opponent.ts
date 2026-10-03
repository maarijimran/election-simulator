export interface AnswerRecord {
  correct: number
  total: number
}

export const emptyRecord = (): AnswerRecord => ({ correct: 0, total: 0 })

// Bayesian estimate of how often a player answers correctly, with a prior worth four answers at 65%.
export function estimateAccuracy(record: AnswerRecord): number {
  const estimate = (record.correct + 0.65 * 4) / (record.total + 4)
  return Math.min(0.95, Math.max(0.05, estimate))
}
