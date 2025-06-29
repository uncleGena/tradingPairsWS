import { ref, readonly, onScopeDispose } from 'vue'
import type { CandlestickData } from '~/types/types'


// This is the object structure returned by the /api/klines endpoint
// based on the node-binance-api .candles() method.
interface KlineRestObject {
  openTime: number
  open: string
  high: string
  low: string
  close: string
  volume: string
  closeTime: number
  quoteAssetVolume: string
  trades: number
  baseAssetVolume: string
  quoteVolume: string // Note: may be the same as quoteAssetVolume, included for completeness
}

const socket = ref<WebSocket | null>(null)
const status = ref('Disconnected')
const activeSubscriptions = ref<Record<string, CandlestickData | null>>({})

const connect = () => {
  if (import.meta.server) return

  // Don't reconnect if already open or connecting
  if (socket.value && socket.value.readyState < 2) {
    return
  }

  status.value = 'Connecting...'
  const url = new URL(window.location.href)
  url.protocol = url.protocol.replace('http', 'ws')
  url.pathname = '/ws'

  socket.value = new WebSocket(url.href)

  socket.value.onopen = () => {
    status.value = 'Connected'
    console.log('[ws] Connected')
    // Resubscribe if there were any active subscriptions before a disconnect
    if (Object.keys(activeSubscriptions.value).length > 0) {
      sendSubscriptions()
    }
  }

  socket.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      // Update the data for the corresponding symbol
      if (data && data.s && activeSubscriptions.value[data.s] !== undefined) {
        activeSubscriptions.value[data.s] = data.k
      }
    }
    catch (err) {
      console.error('Failed to parse message from server:', event.data, err)
    }
  }

  socket.value.onerror = (error) => {
    console.error('[ws] Error:', error)
    status.value = 'Error'
  }

  socket.value.onclose = () => {
    console.log('[ws] Disconnected')
    status.value = 'Disconnected'
    socket.value = null
  }
}

const sendSubscriptions = () => {
  if (socket.value?.readyState === WebSocket.OPEN) {
    const symbolsToSubscribe = Object.keys(activeSubscriptions.value)
    const message = JSON.stringify({
      action: 'subscribe',
      symbols: symbolsToSubscribe,
    })
    socket.value.send(message)
    console.log('[ws] Subscription message sent:', message)
  }
}

export function useSocket() {
  // Ensure the connection is established when the composable is first used
  if (!socket.value)
    connect()

  const subscribe = (symbols: string[]) => {
    const newSymbols: string[] = []
    symbols.forEach((s) => {
      // Only process symbols that are not already subscribed
      if (activeSubscriptions.value[s] === undefined) {
        newSymbols.push(s)
        activeSubscriptions.value[s] = null // Set to null to indicate loading
      }
    })

    if (newSymbols.length === 0)
      return

    // Fetch initial data for newly subscribed symbols
    newSymbols.forEach(async (symbol) => {
      try {
        const klineData = await $fetch<KlineRestObject>(`/api/klines?symbol=${symbol}`)

        // Check if we are still subscribed to this symbol before updating state
        if (klineData && activeSubscriptions.value[symbol] === null) {
          // Map the object from the REST API to the CandlestickData object format
          const mappedData: CandlestickData = {
            t: klineData.openTime,
            o: klineData.open,
            h: klineData.high,
            l: klineData.low,
            c: klineData.close,
            v: klineData.volume,
            T: klineData.closeTime,
            q: klineData.quoteAssetVolume,
            n: klineData.trades,
            V: klineData.baseAssetVolume,
            Q: klineData.quoteVolume,
            // --- Properties from websocket that are not in the base kline response ---
            s: symbol,
            i: '1m', // Assuming 1m interval as per our server implementation
            x: true, // It's a historical, closed kline
            f: 0, // First trade ID (not available from this endpoint)
            L: 0, // Last trade ID (not available from this endpoint)
            B: '', // Ignore (not available from this endpoint)
          }
          activeSubscriptions.value[symbol] = mappedData
        }
      }
      catch (e) {
        console.error(`Failed to fetch initial kline for ${symbol}`, e)
        // If it fails, we can either remove it or leave it as null.
        // Leaving it as null allows the UI to show a loading/error state
        // until the first websocket message arrives.
      }
    })

    sendSubscriptions()
  }

  const unsubscribe = (symbols: string[]) => {
    const symbolsToUnsubscribe = new Set(symbols)
    activeSubscriptions.value = Object.fromEntries(
      Object.entries(activeSubscriptions.value).filter(
        ([symbol]) => !symbolsToUnsubscribe.has(symbol),
      ),
    )
    sendSubscriptions()
  }

  onScopeDispose(() => {
    // In a simple app, we want the connection to persist.
    // In a larger app, we might implement reference counting
    // to close the socket when no components are using it.
    console.log('[useSocket] Component unmounted, socket remains open.')
  })

  return {
    status: readonly(status),
    activeSubscriptions: readonly(activeSubscriptions),
    subscribe,
    unsubscribe,
    close: () => socket.value?.close(),
  }
}