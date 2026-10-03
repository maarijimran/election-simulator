import type { Kind } from '../engine/types'

export interface PhaseInfo {
  title: string
  short: string
  hint: string
}

export const PHASES: Exclude<Kind, 'pass'>[] = ['poll', 'public', 'advert', 'funds']

export const PHASE_INFO: Record<Exclude<Kind, 'pass'>, PhaseInfo> = {
  poll: {
    title: 'Polling',
    short: 'Poll',
    hint: 'Poll a state to reset its split to roughly 50-50. Costs 1 fund.',
  },
  public: {
    title: 'Public campaign',
    short: 'Campaign',
    hint: 'Answer correctly for +2 momentum. A miss hands your rival +2. Costs 1 fund.',
  },
  advert: {
    title: 'Advertising',
    short: 'Ads',
    hint: 'A safer campaign with a smaller swing of 1 momentum. Costs 1 fund.',
  },
  funds: {
    title: 'Funding',
    short: 'Funds',
    hint: 'Collect the funds held by one state you currently lead.',
  },
}
