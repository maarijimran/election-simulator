import { useSyncExternalStore } from 'react'
import type { GameSession, Snapshot } from './session'

export function useSession(session: GameSession): Snapshot {
  return useSyncExternalStore(session.subscribe, session.getSnapshot)
}
