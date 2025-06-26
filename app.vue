<template>
  <div>
    <NuxtRouteAnnouncer />
    <NuxtWelcome />
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { useSocket } from '~/composables/useSocket'

const {
  // status,
  // candlesticks,
  subscribe,
  unsubscribe,
} = useSocket()

const currentSymbol = ref('BTCUSDT')

onMounted(() => {
  subscribe([currentSymbol.value])
})

onUnmounted(() => {
  unsubscribe([currentSymbol.value])
})
</script>

