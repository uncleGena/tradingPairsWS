import { ref, readonly, onScopeDispose } from 'vue'

interface CandlestickData {
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
    symbols.forEach((s) => {
      activeSubscriptions.value[s] = null // Set to null on initial subscription
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