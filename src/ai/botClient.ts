import { type BotRequest, type BotResult, chooseBotMove } from '../engine/bot'

// Runs the search in a Web Worker so the interface stays responsive while the bot thinks.
export class BotClient {
  private worker: Worker | null = null

  think(request: BotRequest): Promise<BotResult> {
    if (typeof Worker === 'undefined') return Promise.resolve(chooseBotMove(request))

    const worker = (this.worker ??= new Worker(new URL('./bot.worker.ts', import.meta.url), { type: 'module' }))

    return new Promise((resolve, reject) => {
      worker.onmessage = (event: MessageEvent<BotResult>) => resolve(event.data)
      worker.onerror = (event) => reject(new Error(event.message))
      worker.postMessage(request)
    })
  }

  dispose(): void {
    this.worker?.terminate()
    this.worker = null
  }
}
