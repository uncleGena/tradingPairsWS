import Binance from 'node-binance-api'
import { useRuntimeConfig } from '#imports'

interface BinanceCandlestick {
  t: number // Kline start time
  T: number // Kline close time
  s: string // Symbol
  i: string // Interval
  f: number // First trade ID
  L: number // Last trade ID
  o: string // Open price
  c: string // Close price
  h: string // High price
  l: string // Low price
  v: string // Base asset volume
  n: number // Number of trades
  x: boolean // Is this kline closed?
  q: string // Quote asset volume
  V: string // Taker buy base asset volume
  Q: string // Taker buy quote asset volume
  B: string // Ignore
}

interface BinanceCandlestickEvent {
  e: string // Event type
  E: number // Event time
  s: string // Symbol
  k: BinanceCandlestick
}

const config = useRuntimeConfig()
const binanceKey = config.env.binanceKey as string
const binanceSecret = config.env.binanceSecret as string

let binance: Binance | null = null
if (binanceKey && binanceSecret) {
  binance = new Binance().options({
    APIKEY: binanceKey,
    APISECRET: binanceSecret,
    useServerTime: true,
    verbose: true,
    log: (log: unknown) => {
      console.log('[binance-api]', log)
    },
  })
}
else {
  console.warn('Binance API credentials missing. WebSocket server will not connect to Binance.')
}

let currentStreamKey: string | false = false
const globalSymbols = new Set<string>()
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const clientSubscriptions = new Map<any, Set<string>>()

function updateBinanceStream() {
  if (!binance)
    return

  const newGlobalSymbols = new Set<string>()
  clientSubscriptions.forEach(symbols => {
    symbols.forEach(symbol => newGlobalSymbols.add(symbol))
  })

  const setsAreEqual = globalSymbols.size === newGlobalSymbols.size && [...globalSymbols].every(s => newGlobalSymbols.has(s))
  if (setsAreEqual)
    return

  if (currentStreamKey) {
    console.log('[binance] Terminating stream for:', [...globalSymbols])
    binance.websockets.terminate(currentStreamKey)
    currentStreamKey = false
  }

  globalSymbols.clear()
  newGlobalSymbols.forEach(s => globalSymbols.add(s))

  if (globalSymbols.size === 0) {
    console.log('[binance] No active subscriptions. Stream is idle.')
    return
  }

  console.log('[binance] Starting new stream for:', [...globalSymbols])
  currentStreamKey = binance.websockets.candlesticks([...globalSymbols], '1m', (candlestick: BinanceCandlestickEvent) => {
    // console.log('[binance] Candlestick:', candlestick.E)
    if (candlestick && candlestick.s) {
      const message = JSON.stringify(candlestick)
      const symbol = candlestick.s
      for (const [client, subscriptions] of clientSubscriptions.entries()) {
        if (subscriptions.has(symbol))
          client.send(message)
      }
    }
  })
}

export default defineWebSocketHandler({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  open(peer: any) {
    console.log('[ws] client connected:', peer)
    clientSubscriptions.set(peer, new Set())
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  close(peer: any) {
    console.log('[ws] client disconnected:', peer)
    clientSubscriptions.delete(peer)
    updateBinanceStream()
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error(peer: any, error) {
    console.error('[ws] client error', peer, error)
    clientSubscriptions.delete(peer)
    updateBinanceStream()
  },

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message(peer: any, message) {
    try {
      const { action, symbols } = JSON.parse(message.text())

      if (action === 'subscribe' && Array.isArray(symbols)) {
        console.log(`[ws] client ${peer} subscribing to`, symbols)
        clientSubscriptions.set(peer, new Set(symbols))
        updateBinanceStream()
      }
    }
    catch (err) {
      console.error('Failed to parse message from client:', message.text(), err)
    }
  },
}) 