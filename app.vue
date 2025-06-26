<template>
  <UApp>
    <div class="p-4">

      <main>
        <div class="mb-4">
          <label for="pair-select" class="block text-sm font-medium text-gray-700 mb-1">Select a Trading Pair</label>
          <USelectMenu
            v-model="selectedPair" 
            :items="dataPairs"
            searchable
            placeholder="Search for a pair..."
            :avatar="selectedPair?.avatar"
            :loading="pending"
            class="w-full md:w-1/2" 
            @update:search-term="debouncedSearch"
          />
        </div>
      </main>
    </div>
  </UApp>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import type { SelectPair } from '~/types/types'
import { useSocket } from '~/composables/useSocket'
import debounce from 'lodash/debounce'

const {
  // status,
  // candlesticks,
  subscribe,
  unsubscribe,
} = useSocket()

const currentSymbol = ref('BTCUSDT')

const selectedPair = ref<SelectPair | undefined>(undefined)

const pending = ref(false)
const error = ref<Error | null>(null)

const dataPairs = ref<SelectPair[]>([])

onMounted(() => {
  subscribe([currentSymbol.value])
})

onUnmounted(() => {
  unsubscribe([currentSymbol.value])
})

const debouncedSearch = debounce(searchPairs, 500)

async function searchPairs(query: string) {
  if (!query) return

  pending.value = true
  const pairs = await $fetch<SelectPair[]>('/api/pairs', {
    query: {
      query,
    }
  }).catch(() => {
    error.value = new Error('Failed to load pairs')
    return [] as SelectPair[]
  }).finally(() => {
    pending.value = false
  })

  dataPairs.value = pairs
  return pairs
}
</script>

