import { type CSSProperties, useState } from 'react'
import { LEVELS, type LevelId } from '../engine/levels'
import type { Player } from '../engine/types'
import { type Mode, type SetupResult, isBot } from '../game/setup'
import { MAP_SHAPES, MAP_VIEWBOX } from '../map/usMap'

interface Props {
  initial: SetupResult
  onStart: (setup: SetupResult) => void
}

const MODES: { id: Mode; title: string; text: string }[] = [
  { id: 'bot', title: 'Play the bot', text: 'Face the search-based opponent.' },
  { id: 'two', title: 'Two players', text: 'Hot-seat on one screen.' },
  { id: 'watch', title: 'Watch bots', text: 'Two bots play each other.' },
]

function HeroMap() {
  return (
    <svg className="hero-map" viewBox={MAP_VIEWBOX} aria-hidden>
      {MAP_SHAPES.map((shape) => {
        const h = (shape.index * 2654435761) % 997
        const owner = h % 2
        return (
          <path
            key={shape.index}
            d={shape.d}
            className={`shape owner-${owner}`}
            style={{ '--strength': 0.35 + (h % 60) / 100 } as CSSProperties}
          />
        )
      })}
    </svg>
  )
}

export default function SetupScreen({ initial, onStart }: Props) {
  const [setup, setSetup] = useState<SetupResult>(initial)
  const update = (patch: Partial<SetupResult>) => setSetup((s) => ({ ...s, ...patch }))
  const setLevel = (p: Player, id: LevelId) => update({ levels: p === 0 ? [id, setup.levels[1]] : [setup.levels[0], id] })
  const setName = (p: Player, value: string) => update({ names: p === 0 ? [value, setup.names[1]] : [setup.names[0], value] })
  const setParty = (p: Player, value: string) => update({ parties: p === 0 ? [value, setup.parties[1]] : [setup.parties[0], value] })
  const players: Player[] = [0, 1]

  return (
    <main className="setup">
      <section className="hero">
        <HeroMap />
        <div className="hero-copy">
          <p className="eyebrow">Strategy game</p>
          <h1>Election Simulator</h1>
          <p>
            Poll, campaign and advertise across 50 states. Out-argue your rival on the issues, manage your funds and win the
            electoral map.
          </p>
        </div>
      </section>

      <section className="card setup-card">
        <h2>New game</h2>

        <div className="mode-grid" role="radiogroup" aria-label="Game mode">
          {MODES.map((mode) => (
            <button
              key={mode.id}
              role="radio"
              aria-checked={setup.mode === mode.id}
              className={`option${setup.mode === mode.id ? ' on' : ''}`}
              onClick={() => update({ mode: mode.id })}
            >
              <strong>{mode.title}</strong>
              <span>{mode.text}</span>
            </button>
          ))}
        </div>

        {setup.mode === 'bot' && (
          <div className="field">
            <span className="label">You play as</span>
            <div className="segmented">
              {([0, 1] as Player[]).map((seat) => (
                <button key={seat} className={setup.seat === seat ? 'on' : ''} onClick={() => update({ seat })}>
                  {seat === 0 ? 'Player One (moves first)' : 'Player Two'}
                </button>
              ))}
            </div>
          </div>
        )}

        {players
          .filter((p) => isBot(setup, p))
          .map((p) => (
            <div className="field" key={p}>
              <span className="label">{setup.mode === 'watch' ? `Bot ${p === 0 ? 'One' : 'Two'} difficulty` : 'Bot difficulty'}</span>
              <div className="level-grid">
                {LEVELS.map((level) => (
                  <button
                    key={level.id}
                    className={`option${setup.levels[p] === level.id ? ' on' : ''}`}
                    onClick={() => setLevel(p, level.id)}
                  >
                    <strong>{level.label}</strong>
                    <span>{level.blurb}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}

        <div className="names">
          {players.map((p) => (
            <fieldset key={p} className={`p${p}`}>
              <legend>
                <i className={`dot p${p}`} />
                Player {p === 0 ? 'One' : 'Two'}
                {isBot(setup, p) && ' (bot)'}
              </legend>
              {!isBot(setup, p) && (
                <label>
                  Name
                  <input value={setup.names[p]} maxLength={20} onChange={(e) => setName(p, e.target.value)} />
                </label>
              )}
              <label>
                Party
                <input value={setup.parties[p]} maxLength={24} onChange={(e) => setParty(p, e.target.value)} />
              </label>
            </fieldset>
          ))}
        </div>

        <button className="btn primary large" onClick={() => onStart(setup)}>
          {setup.mode === 'watch' ? 'Start match' : 'Choose party issues'}
        </button>
      </section>
    </main>
  )
}
