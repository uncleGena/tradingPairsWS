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
            :loading="pending"
            multiple
            class="w-full md:w-1/2" 
            @update:search-term="debouncedSearch"
          />
          <UButton
            v-if="selectedPair.length > 0"
            class="ml-2"
            variant="outline"
            @click="onClickClear"
          >
            Clear
          </UButton>
        </div>

        <pre>activeSubscriptions: {{ activeSubscriptions }}</pre>
      </main>
    </div>
  </UApp>
</template>

<script setup lang="ts">
import type { SelectPair } from '~/types/types'
import { useSocket } from '~/composables/useSocket'
import debounce from 'lodash/debounce'

const {
  // status,
  // candlesticks,
  activeSubscriptions,
  subscribe,
  unsubscribe,
} = useSocket()

// const currentSymbol = ref('BTCUSDT')

const selectedPair = ref<SelectPair[]>([])

const pending = ref(false)
const error = ref<Error | null>(null)

const dataPairs = ref<SelectPair[]>([])

watch(selectedPair, (val, oldVal) => {
  const oldSymbols = oldVal.map(p => p.value)
  const newSymbols = val.map(p => p.value)

  unsubscribe(oldSymbols)
  subscribe(newSymbols)
})

// onMounted(() => {
//   subscribe([currentSymbol.value])
// })

// onUnmounted(() => {
//   unsubscribe([currentSymbol.value])
// })

// NOTE: this is for UI rendering optimization, Because we do not want to render all
// 3000+ pairs on the page.
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

function onClickClear() {
  selectedPair.value = []
}
</script>

