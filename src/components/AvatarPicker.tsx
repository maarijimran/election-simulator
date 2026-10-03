import { AVATARS } from '../game/avatars'
import Avatar from './Avatar'

interface Props {
  value: number
  taken: number[]
  onChange: (index: number) => void
}

export default function AvatarPicker({ value, taken, onChange }: Props) {
  return (
    <div className="avatar-picker">
      <div className="avatar-grid" role="radiogroup" aria-label="Choose a portrait">
        {AVATARS.map((look, i) => (
          <button
            key={look.name}
            role="radio"
            aria-checked={value === i}
            className={value === i ? 'on' : ''}
            disabled={taken.includes(i)}
            onClick={() => onChange(i)}
            title={taken.includes(i) ? `${look.name} (taken)` : look.name}
          >
            <Avatar index={i} size={46} />
          </button>
        ))}
      </div>
      <span className="avatar-name">{AVATARS[value].name}</span>
    </div>
  )
}
