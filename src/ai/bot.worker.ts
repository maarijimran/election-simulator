import { type BotRequest, chooseBotMove } from '../engine/bot'

self.onmessage = (event: MessageEvent<BotRequest>) => {
  self.postMessage(chooseBotMove(event.data))
}
