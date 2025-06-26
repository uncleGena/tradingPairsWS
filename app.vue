<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const status = ref('Connecting...')
const socket = ref<WebSocket | null>(null)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const candlesticks = ref<any[]>([])

const currentSymbol = ref('BTCUSDT')

onMounted(() => {
  const url = new URL(window.location.href)
  url.protocol = url.protocol.replace('http', 'ws')
  url.pathname = '/ws'

  socket.value = new WebSocket(url.href)

  socket.value.onopen = () => {
    status.value = 'Connected'
    console.log('[ws] connected')
    const message = JSON.stringify({
      action: 'subscribe',
      symbols: [currentSymbol.value],
    })
    socket.value?.send(message)
  }

  socket.value.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      console.log(`[ws] candlestick-update for ${data.s}:`, data)

      // Find if we already have a candlestick for this timestamp
      const index = candlesticks.value.findIndex(c => c.k.t === data.k.t)
      if (index !== -1) {
        // Update existing candlestick
        candlesticks.value[index] = data
      }
      else {
        // Add new candlestick and keep the list at a max of 20
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
    console.error('[ws] error:', error)
    status.value = 'Error'
  }

  socket.value.onclose = () => {
    console.log('[ws] disconnected')
    status.value = 'Disconnected'
  }
})

onUnmounted(() => {
  socket.value?.close()
})
</script>

<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtWelcome />
  </div>
</template>
