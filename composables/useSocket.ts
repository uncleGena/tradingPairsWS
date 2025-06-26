import { ref, readonly, onScopeDispose } from 'vue'

// State should be outside the composable function to act as a singleton
const socket = ref<WebSocket | null>(null)
const status = ref('Disconnected')
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const candlesticks = ref<any[]>([])
const activeSubscriptions = new Set<string>()

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
    if (activeSubscriptions.size > 0) {
      sendSubscriptions()
    }
  }

  socket.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      const index = candlesticks.value.findIndex(c => c.k.t === data.k.t)
      if (index !== -1) {
        candlesticks.value[index] = data
      }
      else {
        candlesticks.value.unshift(data)
        if (candlesticks.value.length > 20)
          candlesticks.value.pop()
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
    const message = JSON.stringify({
      action: 'subscribe',
      symbols: Array.from(activeSubscriptions),
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
    symbols.forEach(s => activeSubscriptions.add(s))
    sendSubscriptions()
  }

  const unsubscribe = (symbols: string[]) => {
    symbols.forEach(s => activeSubscriptions.delete(s))
    sendSubscriptions()
  }

  onScopeDispose(() => {
    // This is a simple app, so we don't close the connection
    // when a single component unmounts. But in a larger app,
    // you might add reference counting here to close the socket
    // when no components are using it.
    console.log('[useSocket] Component unmounted, but socket remains open.')
  })

  return {
    status: readonly(status),
    candlesticks: readonly(candlesticks),
    subscribe,
    unsubscribe,
    close: () => socket.value?.close(),
  }
}