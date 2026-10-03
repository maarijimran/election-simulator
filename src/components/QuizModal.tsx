import { useEffect } from 'react'
import { STATES } from '../engine/data/states'
import type { GameSession, Snapshot } from '../game/session'

interface Props {
  snap: Snapshot
  session: GameSession
}

export default function QuizModal({ snap, session }: Props) {
  const quiz = snap.quiz
  const answered = quiz?.chosen !== null && quiz?.chosen !== undefined

  useEffect(() => {
    if (!quiz) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      if (answered) session.dismissQuiz()
      else session.cancelCampaign()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [quiz, answered, session])

  if (!quiz) return null

  const correct = answered && quiz.answers[quiz.chosen!].correct
  const gain = quiz.kind === 'public' ? 2 : 1
  const rival = snap.config.players[quiz.player === 0 ? 1 : 0].name

  return (
    <div className="overlay" role="presentation">
      <div className="modal quiz" role="dialog" aria-modal="true" aria-labelledby="quiz-title">
        <p className="eyebrow">
          {quiz.kind === 'public' ? 'Public campaign' : 'Advertising'} in {STATES[quiz.state].name}
        </p>
        <h2 id="quiz-title">{quiz.issue}</h2>
        <p className="question">{quiz.question}</p>

        <ul className="answers">
          {quiz.answers.map((answer, i) => {
            const state = !answered ? '' : answer.correct ? ' right' : i === quiz.chosen ? ' wrong' : ' faded'
            return (
              <li key={answer.text}>
                <button className={`answer${state}`} disabled={answered} onClick={() => session.answer(i)} autoFocus={i === 0}>
                  <span className="key">{i + 1}</span>
                  {answer.text}
                </button>
              </li>
            )
          })}
        </ul>

        {answered ? (
          <footer>
            <p className={correct ? 'result good' : 'result bad'}>
              {correct ? `Correct. +${gain} momentum.` : `Incorrect. ${rival} gains +${gain} momentum.`}
            </p>
            <button className="btn primary" onClick={() => session.dismissQuiz()} autoFocus>
              Continue
            </button>
          </footer>
        ) : (
          <footer>
            <span className="muted small">Answering costs 1 fund.</span>
            <button className="btn" onClick={() => session.cancelCampaign()}>
              Cancel
            </button>
          </footer>
        )}
      </div>
    </div>
  )
}
