import type { SpecialKind } from '../engine/types'

const paths: Record<string, string> = {
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M2 12h2 M20 12h2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M4.9 19.1l1.4-1.4 M17.7 6.3l1.4-1.4',
  moon: 'M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z',
  star: 'M12 3l2.8 5.7 6.2.9-4.5 4.4 1.1 6.2L12 17.3l-5.6 2.9 1.1-6.2L3 9.6l6.2-.9z',
  scandal: 'M12 3 2 20h20L12 3z M12 9.5v4.5 M12 17.2h.01',
  fundraiser: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v10 M9.6 9.6c0-1 1-1.6 2.4-1.6s2.4.6 2.4 1.6-1 1.4-2.4 1.8-2.4.8-2.4 1.8 1 1.6 2.4 1.6 2.4-.6 2.4-1.6',
  help: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M9.5 9.5a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8 M12 17h.01',
  restart: 'M4 12a8 8 0 1 0 2.5-5.8 M4 4v4h4',
}

export type IconName = keyof typeof paths | SpecialKind

export default function Icon({ name, size = 16 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={paths[name === 'celebrity' ? 'star' : name]} />
    </svg>
  )
}
