import { useId } from 'react'
import { AVATARS, type Look } from '../game/avatars'

interface Props {
  index: number
  size?: number
  className?: string
}

function BackHair({ look }: { look: Look }) {
  if (look.hair === 'long') return <path d="M23 34 C23 10 77 10 77 34 L82 88 L18 88 Z" fill={look.hairColor} />
  if (look.hair === 'bob') return <path d="M25 32 C25 12 75 12 75 32 L77 62 L23 62 Z" fill={look.hairColor} />
  return null
}

function FrontHair({ look }: { look: Look }) {
  const fill = look.hairColor

  switch (look.hair) {
    case 'short':
      return <path d="M28 42 C25 20 40 13 50 13 C62 13 76 20 72 42 C69 31 60 26 50 26 C40 26 31 31 28 42 Z" fill={fill} />
    case 'swept':
      return <path d="M27 43 C22 17 46 8 64 15 C76 20 77 33 73 43 C70 33 62 25 50 24 C40 24 31 31 27 43 Z M44 14 C54 6 70 10 72 20 C62 14 52 14 44 14 Z" fill={fill} />
    case 'buzz':
      return <path d="M29 40 C29 23 39 19 50 19 C61 19 71 23 71 40 C66 30 58 26 50 26 C42 26 34 30 29 40 Z" fill={fill} opacity={0.92} />
    case 'bob':
    case 'long':
      return <path d="M27 44 C24 18 42 12 50 12 C60 12 77 18 73 44 C68 32 58 27 50 27 C40 27 32 32 27 44 Z" fill={fill} />
    case 'curly':
      return (
        <g fill={fill}>
          {[
            [30, 33, 9],
            [37, 22, 9],
            [48, 17, 9.5],
            [59, 18, 9],
            [67, 25, 9],
            [71, 36, 8],
            [27, 45, 6],
            [73, 46, 6],
          ].map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
          ))}
        </g>
      )
    default:
      return (
        <g fill={fill}>
          <ellipse cx="29" cy="45" rx="4.5" ry="9" />
          <ellipse cx="71" cy="45" rx="4.5" ry="9" />
        </g>
      )
  }
}

export default function Avatar({ index, size = 56, className }: Props) {
  const look = AVATARS[index % AVATARS.length]
  const clip = useId()
  const line = 'rgba(0,0,0,0.28)'

  return (
    <svg
      className={`avatar${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label={`Cartoon portrait of ${look.name}`}
    >
      <defs>
        <clipPath id={clip}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clip})`}>
        <rect width="100" height="100" fill={look.background} />
        <BackHair look={look} />

        <path d="M4 102 C4 80 28 72 50 72 C72 72 96 80 96 102 Z" fill={look.suit} />
        <path d="M41 72 L50 88 L59 72 Z" fill="#f8fafc" />
        {look.tie && (
          <g fill={look.tie}>
            <path d="M47 76 H53 L52 80 H48 Z" />
            <path d="M48 80 H52 L54.5 95 L50 99 L45.5 95 Z" />
          </g>
        )}
        {look.scarf && <path d="M34 72 H66 L64 83 H36 Z M58 80 L66 98 H57 Z" fill={look.scarf} />}
        {look.pearls && (
          <g fill="#f8f5ee" stroke={line} strokeWidth="0.4">
            {[38, 42, 46, 50, 54, 58, 62].map((x, i) => (
              <circle key={x} cx={x} cy={73 + Math.abs(3 - i) * -0.6 + 2.4} r="2" />
            ))}
          </g>
        )}

        <rect x="43" y="58" width="14" height="18" rx="5" fill={look.skin} />
        <rect x="43" y="66" width="14" height="6" fill="rgba(0,0,0,0.12)" />

        <circle cx="29" cy="46" r="4.5" fill={look.skin} stroke={line} strokeWidth="0.6" />
        <circle cx="71" cy="46" r="4.5" fill={look.skin} stroke={line} strokeWidth="0.6" />
        <ellipse cx="50" cy="44" rx="21" ry="24" fill={look.skin} stroke={line} strokeWidth="0.6" />

        <FrontHair look={look} />
        {look.beard && <path d="M29 50 C31 78 69 78 71 50 C67 62 59 66 50 66 C41 66 33 62 29 50 Z" fill={look.hairColor} />}

        <g stroke={look.hair === 'bald' ? '#cfcfd4' : look.hairColor} strokeWidth="2" strokeLinecap="round" fill="none">
          <path d="M37 37.5 Q42 34.5 47 37" />
          <path d="M53 37 Q58 34.5 63 37.5" />
        </g>
        <g fill="#1b1b1f">
          <ellipse cx="42" cy="45" rx="2.4" ry="3" />
          <ellipse cx="58" cy="45" rx="2.4" ry="3" />
        </g>
        <g fill="#fff">
          <circle cx="43" cy="43.8" r="0.9" />
          <circle cx="59" cy="43.8" r="0.9" />
        </g>
        <path d="M50 47 Q47 54 50.5 55" stroke={line} strokeWidth="1.2" fill="none" strokeLinecap="round" />
        <path d="M43 58.5 Q50 64.5 57 58.5" stroke="#8a3b3b" strokeWidth="1.8" fill="none" strokeLinecap="round" />

        {look.mustache && (
          <path d="M40 56.5 Q45 53 50 56 Q55 53 60 56.5 Q55 60 50 57.5 Q45 60 40 56.5 Z" fill={look.hairColor} />
        )}

        {look.glasses === 'round' && (
          <g fill="rgba(255,255,255,0.18)" stroke="#2b2b30" strokeWidth="1.5">
            <circle cx="42" cy="45" r="6.6" />
            <circle cx="58" cy="45" r="6.6" />
            <path d="M48.6 44.5 H51.4" fill="none" />
          </g>
        )}
        {look.glasses === 'square' && (
          <g fill="rgba(255,255,255,0.18)" stroke="#2b2b30" strokeWidth="1.5">
            <rect x="35" y="40" width="13" height="10" rx="2" />
            <rect x="52" y="40" width="13" height="10" rx="2" />
            <path d="M48 44 H52" fill="none" />
          </g>
        )}

      </g>

      <circle cx="50" cy="50" r="49" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="2" />
    </svg>
  )
}

export const AVATAR_COUNT = AVATARS.length
