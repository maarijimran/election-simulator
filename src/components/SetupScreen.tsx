import { type CSSProperties, useState } from 'react'
import { LEVELS, type LevelId, levelById } from '../engine/levels'
import type { Player } from '../engine/types'
import { type Mode, type SetupResult, isBot } from '../game/setup'
import { MAP_SHAPES, MAP_VIEWBOX } from '../map/usMap'
import AvatarPicker from './AvatarPicker'
import HowToPlay from './HowToPlay'
import Icon from './Icons'
import ThemeToggle from './ThemeToggle'

interface Props {
  initial: SetupResult
  onStart: (setup: SetupResult) => void
}

const MODES: { id: Mode; title: string; text: string }[] = [
  { id: 'bot', title: 'Play the bot', text: 'Face the search-based opponent' },
  { id: 'two', title: 'Two players', text: 'Hot-seat on one screen' },
  { id: 'watch', title: 'Watch bots', text: 'Two bots play each other' },
]

const FEATURES = ['Interactive US map', 'Quiz-driven campaigns', 'Special actions', 'Expectiminimax bot']

function HeroMap() {
  return (
    <svg className="hero-map" viewBox={MAP_VIEWBOX} aria-hidden>
      {MAP_SHAPES.map((shape) => {
        const h = (shape.index * 2654435761) % 997
        return (
          <path
            key={shape.index}
            d={shape.d}
            className={`shape owner-${h % 2}`}
            style={{ '--strength': 0.35 + (h % 60) / 100 } as CSSProperties}
          />
        )
      })}
    </svg>
  )
}

export default function SetupScreen({ initial, onStart }: Props) {
  const [setup, setSetup] = useState<SetupResult>(initial)
  const [help, setHelp] = useState(false)
  const update = (patch: Partial<SetupResult>) => setSetup((s) => ({ ...s, ...patch }))
  const pair = <T,>(current: [T, T], p: Player, value: T): [T, T] => (p === 0 ? [value, current[1]] : [current[0], value])
  const humans = ([0, 1] as Player[]).filter((p) => !isBot(setup, p))

  const renderPlayer = (p: Player) => {
    const label = `Player ${p === 0 ? 'One' : 'Two'}`

    if (isBot(setup, p)) {
      const level = levelById(setup.levels[p])
      return (
        <fieldset key={p} className={`seat p${p}`}>
          <legend>
            <i className={`dot p${p}`} />
            {label} (bot)
          </legend>
          <label>
            Party
            <input value={setup.parties[p]} maxLength={24} onChange={(e) => update({ parties: pair(setup.parties, p, e.target.value) })} />
          </label>
          <div className="field">
            <span className="label">Difficulty</span>
            <div className="segmented small">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  className={setup.levels[p] === l.id ? 'on' : ''}
                  onClick={() => update({ levels: pair<LevelId>(setup.levels, p, l.id) })}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <p className="muted small">{level.blurb}</p>
          </div>
          <p className="muted small">The bot draws a random portrait.</p>
        </fieldset>
      )
    }

    const other = humans.length > 1 ? setup.avatars[p === 0 ? 1 : 0] : -1

    return (
      <fieldset key={p} className={`seat p${p}`}>
        <legend>
          <i className={`dot p${p}`} />
          {label}
        </legend>
        <div className="two-fields">
          <label>
            Name
            <input value={setup.names[p]} maxLength={20} onChange={(e) => update({ names: pair(setup.names, p, e.target.value) })} />
          </label>
          <label>
            Party
            <input value={setup.parties[p]} maxLength={24} onChange={(e) => update({ parties: pair(setup.parties, p, e.target.value) })} />
          </label>
        </div>
        <span className="label">Portrait</span>
        <AvatarPicker value={setup.avatars[p]} taken={other >= 0 ? [other] : []} onChange={(i) => update({ avatars: pair(setup.avatars, p, i) })} />
      </fieldset>
    )
  }

  return (
    <div className="shell">
      <div className="window setup-window">
        <header className="titlebar">
          <div className="brand">
            <span className="logo" aria-hidden />
            Election Simulator
          </div>
          <span className="status">New game</span>
          <div className="row">
            <ThemeToggle />
            <button className="btn" onClick={() => setHelp(true)}>
              <Icon name="help" />
              How to play
            </button>
          </div>
        </header>

        <div className="setup-body">
          <section className="hero panel">
            <HeroMap />
            <div className="hero-copy">
              <p className="eyebrow">Strategy game</p>
              <h1>Win the electoral map</h1>
              <p>
                Poll, campaign and advertise across 50 states. Out-argue your rival on the issues, play your special actions at the
                right moment and manage your funds.
              </p>
              <ul className="features">
                {FEATURES.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          </section>

          <section className="panel form">
            <header className="panel-head">Game setup</header>
            <div className="panel-body">
              <div className="field">
                <span className="label">Mode</span>
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
              </div>

              {setup.mode === 'bot' && (
                <div className="field">
                  <span className="label">You play as</span>
                  <div className="segmented">
                    {([0, 1] as Player[]).map((seat) => (
                      <button key={seat} className={setup.seat === seat ? 'on' : ''} onClick={() => update({ seat })}>
                        Player {seat === 0 ? 'One' : 'Two'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="seats">{([0, 1] as Player[]).map(renderPlayer)}</div>

              <button className="btn primary large" onClick={() => onStart(setup)}>
                {setup.mode === 'watch' ? 'Start match' : 'Choose party issues'}
              </button>
            </div>
          </section>
        </div>
      </div>

      {help && <HowToPlay onClose={() => setHelp(false)} />}
    </div>
  )
}
