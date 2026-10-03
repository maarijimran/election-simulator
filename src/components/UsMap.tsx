import { type CSSProperties, type KeyboardEvent, useMemo, useState } from 'react'
import { STATES } from '../engine/data/states'
import { type Sim, pct, winnerOf } from '../engine/sim'
import { MAP_SHAPES, MAP_VIEWBOX } from '../map/usMap'

interface Props {
  sim: Sim
  selected: number | null
  legal: boolean[]
  highlight: { state: number; seq: number } | null
  onSelect: (index: number) => void
}

interface Hover {
  index: number
  x: number
  y: number
}

const LABEL_AREA = 1400

export default function UsMap({ sim, selected, legal, highlight, onSelect }: Props) {
  const [hover, setHover] = useState<Hover | null>(null)
  const restricted = legal.some(Boolean) && !legal.every(Boolean)
  const shapes = useMemo(
    () => [...MAP_SHAPES].sort((a, b) => Number(a.index === selected) - Number(b.index === selected)),
    [selected],
  )

  const onKey = (event: KeyboardEvent, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onSelect(index)
    }
  }

  return (
    <div className="map" onMouseLeave={() => setHover(null)}>
      <svg viewBox={MAP_VIEWBOX} role="group" aria-label="Map of the United States">
        {shapes.map((shape) => {
          const i = shape.index
          const p0 = pct(sim, i, 0)
          const p1 = pct(sim, i, 1)
          const locked = winnerOf(sim, i) >= 0
          const owner = locked ? winnerOf(sim, i) : p0 > p1 ? 0 : p1 > p0 ? 1 : -1
          const strength = locked ? 1 : Math.min(1, 0.3 + (Math.abs(p0 - p1) / 60) * 0.7)
          const isHighlight = highlight?.state === i
          const className = [
            'shape',
            owner >= 0 ? `owner-${owner}` : 'neutral',
            locked && 'locked',
            selected === i && 'selected',
            restricted && (legal[i] ? 'legal' : 'dim'),
            isHighlight && 'flash',
          ]
            .filter(Boolean)
            .join(' ')

          return (
            <path
              key={`${i}-${isHighlight ? highlight.seq : 0}`}
              d={shape.d}
              className={className}
              style={{ '--strength': strength } as CSSProperties}
              tabIndex={0}
              role="button"
              aria-pressed={selected === i}
              aria-label={`${shape.name}, ${STATES[i].votes} electoral votes`}
              onClick={() => onSelect(i)}
              onKeyDown={(event) => onKey(event, i)}
              onMouseMove={(event) => {
                const box = event.currentTarget.ownerSVGElement?.parentElement?.getBoundingClientRect()
                if (box) setHover({ index: i, x: event.clientX - box.left, y: event.clientY - box.top })
              }}
            />
          )
        })}

        {MAP_SHAPES.filter((s) => s.area > LABEL_AREA).map((shape) => (
          <text key={shape.index} x={shape.cx} y={shape.cy} className="map-label">
            {STATES[shape.index].votes}
          </text>
        ))}
      </svg>

      {hover && (
        <div className="tooltip" style={{ left: hover.x, top: hover.y }}>
          <strong>{STATES[hover.index].name}</strong>
          <span>{STATES[hover.index].votes} EV</span>
          <span className="tip-split">
            <i className="dot p0" />
            {Math.max(0, pct(sim, hover.index, 0))}%
            <i className="dot p1" />
            {Math.max(0, pct(sim, hover.index, 1))}%
          </span>
        </div>
      )}
    </div>
  )
}
