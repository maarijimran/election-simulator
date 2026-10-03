import { useTheme } from '../game/theme'
import Icon from './Icons'

export default function ThemeToggle() {
  const [theme, toggle] = useTheme()
  const label = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'

  return (
    <button className="btn icon" onClick={toggle} aria-label={label} title={label}>
      <Icon name={theme === 'light' ? 'moon' : 'sun'} size={17} />
    </button>
  )
}
