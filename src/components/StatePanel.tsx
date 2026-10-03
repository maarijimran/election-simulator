import { ISSUES } from '../engine/data/issues'
import { STATES } from '../engine/data/states'
import { mom, pct, stateFunds, usableMask, winnerOf } from '../engine/sim'
import { PARTY_SIZE } from '../engine/types'
import type { GameSession, Snapshot } from '../game/session'

interface Props {
  snap: Snapshot
  session: GameSession
  selected: number | null
}

function Momentum({ value, player }: { value: number; player: number }) {
  return (
    <span className={`pips p${player}`} aria-label={`Momentum ${value} of 3`}>
      {[0, 1, 2].map((i) => (
        <i key={i} className={i < value ? 'on' : ''} />
      ))}
    </span>
  )
}

export default function StatePanel({ snap, session, selected }: Props) {
  if (selected === null) {
    return (
      <section className="card state-panel empty">
        <p className="muted">Select a state on the map to see its issues, polling and momentum.</p>
      </section>
    )
  }

  const { sim, world, config } = snap
  const info = STATES[selected]
  const p0 = pct(sim, selected, 0)
  const p1 = pct(sim, selected, 1)
  const total = Math.max(0, p0) + Math.max(0, p1)
  const split = total > 0 ? (Math.max(0, p0) / total) * 100 : 50
  const winner = winnerOf(sim, selected)
  const human = snap.awaiting === 'human'
  const kind = snap.kind
  const campaignPhase = kind === 'public' || kind === 'advert'
  const mask = human ? usableMask(world, snap.mover, selected) : 0
  const canAct = human && snap.legal[selected]
  const held = (issue: number) => ([0, 1] as const).filter((p) => world.party[p].includes(issue))

  const chip = (slot: number, issue: number) => {
    const usable = campaignPhase && canAct && ((mask >> slot) & 1) === 1
    const holders = held(issue)

    return (
      <li key={slot}>
        <button
          className={`chip issue${usable ? ' usable' : ''}`}
          disabled={!usable}
          onClick={() => session.beginCampaign(selected, slot)}
          title={usable ? 'Campaign on this issue' : undefined}
        >
          {ISSUES[issue].name}
          {holders.map((p) => (
            <i key={p} className={`dot p${p}`} title={`${config.players[p].party} holds this issue`} />
          ))}
        </button>
      </li>
    )
  }

  return (
    <section className="card state-panel">
      <header className="state-head">
        <h2>{info.name}</h2>
        <span className="badge">{info.votes} EV</span>
        {winner >= 0 && <span className={`badge locked p${winner}`}>Won by {config.players[winner].name}</span>}
      </header>

      <div className="split" role="img" aria-label={`${config.players[0].name} ${p0}%, ${config.players[1].name} ${p1}%`}>
        <span className="p0" style={{ width: `${split}%` }}>
          {Math.max(0, p0)}%
        </span>
        <span className="p1" style={{ width: `${100 - split}%` }}>
          {Math.max(0, p1)}%
        </span>
      </div>

      <dl className="state-stats">
        <div>
          <dt>Momentum</dt>
          <dd className="momentum">
            <Momentum value={mom(sim, selected, 0)} player={0} />
            <Momentum value={mom(sim, selected, 1)} player={1} />
          </dd>
        </div>
        <div>
          <dt>State funds</dt>
          <dd>
            {stateFunds(sim, selected)} / {info.maxFunds}
          </dd>
        </div>
      </dl>

      <h4>Favors</h4>
      <ul className="chips">{Array.from({ length: PARTY_SIZE }, (_, j) => chip(j, world.favored[selected * PARTY_SIZE + j]))}</ul>

      <h4>Opposes</h4>
      <ul className="chips">
        {Array.from({ length: PARTY_SIZE }, (_, j) => chip(PARTY_SIZE + j, world.opposed[selected * PARTY_SIZE + j]))}
      </ul>

      <p className="muted small">Dots show which party holds an issue.</p>

      {human && kind === 'poll' && (
        <button className="btn primary" disabled={!canAct} onClick={() => session.poll(selected)}>
          Poll {info.name}
        </button>
      )}

      {human && kind === 'funds' && (
        <button className="btn primary" disabled={!canAct} onClick={() => session.takeFunds(selected)}>
          Collect {stateFunds(sim, selected)} fund{stateFunds(sim, selected) === 1 ? '' : 's'}
        </button>
      )}

      {human && campaignPhase && !canAct && winner < 0 && (
        <p className="muted small">None of the issues here match your party, so you cannot campaign in this state.</p>
      )}
    </section>
  )
}
