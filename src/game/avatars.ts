export type HairStyle = 'short' | 'swept' | 'buzz' | 'bob' | 'long' | 'curly' | 'bald'

export interface Look {
  name: string
  skin: string
  hair: HairStyle
  hairColor: string
  suit: string
  background: string
  tie?: string
  scarf?: string
  glasses?: 'round' | 'square'
  mustache?: boolean
  beard?: boolean
  pearls?: boolean
}

export const AVATARS: Look[] = [
  {
    name: 'Senator Hale',
    skin: '#f1c9a5',
    hair: 'short',
    hairColor: '#b9bec7',
    suit: '#22345f',
    background: '#cfd9ee',
    tie: '#c0392b',
    glasses: 'square',
  },
  {
    name: 'Governor Reyes',
    skin: '#d9a67c',
    hair: 'bob',
    hairColor: '#4a2f22',
    suit: '#2f5d8a',
    background: '#d8ebe6',
    pearls: true,
  },
  {
    name: 'Mayor Okafor',
    skin: '#8d5a3c',
    hair: 'buzz',
    hairColor: '#1d1612',
    suit: '#3b4a3a',
    background: '#f1e2c5',
    tie: '#e0a526',
    mustache: true,
  },
  {
    name: 'Chancellor Lindqvist',
    skin: '#f6d6b8',
    hair: 'swept',
    hairColor: '#d6a84a',
    suit: '#52525b',
    background: '#e6dcef',
    tie: '#2563eb',
  },
  {
    name: 'Dr. Banerjee',
    skin: '#b87b55',
    hair: 'curly',
    hairColor: '#1f1a17',
    suit: '#5b3a78',
    background: '#f4dcd6',
    scarf: '#e8b04a',
    glasses: 'round',
  },
  {
    name: 'Speaker Marlowe',
    skin: '#e8b996',
    hair: 'long',
    hairColor: '#7a3b1d',
    suit: '#8a2f3d',
    background: '#d7e7f5',
    pearls: true,
  },
  {
    name: 'Commissioner Tanaka',
    skin: '#eecaa2',
    hair: 'short',
    hairColor: '#17171b',
    suit: '#1f6f78',
    background: '#efe7d3',
    tie: '#f2f2f2',
    glasses: 'round',
  },
  {
    name: 'Elder Whitfield',
    skin: '#9a6a48',
    hair: 'bald',
    hairColor: '#e9e9ec',
    suit: '#6b4a2e',
    background: '#dde8d4',
    tie: '#2e7d5b',
    beard: true,
  },
]
