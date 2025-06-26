<template>
  <UCard
    variant="subtle"
    class="mb-4"
  >
    <template #header>
      <span class="flex items-center">
        <img 
          :src="selectedItem.avatar.src" 
          :alt="selectedItem.avatar.alt"
          width="40"
          height="40"
          class="w-[40px] h-[40px] rounded-xs inline-block mr-2"
        >
        <h5>{{ selectedItem.label }}</h5>
      </span>
    </template>

    <ul>
      <li v-if="activeSubscription">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span class="text-gray-500">Open:</span>
            <span class="ml-2 font-medium">{{ parseFloat(activeSubscription.o).toFixed(4) }}</span>
          </div>
          <div>
            <span class="text-gray-500">Close:</span>
            <span 
              class="ml-2 font-medium" 
              :class="{ 
                'text-green-500': upOrDown === 'up', 
                'text-red-500': upOrDown === 'down',
                'text-gray-500': upOrDown === null
              }"
            >
              {{ parseFloat(activeSubscription.c).toFixed(4) }}
            </span>
          </div>
          <div>
            <span class="text-gray-500">High:</span>
            <span class="ml-2 font-medium">{{ parseFloat(activeSubscription.h).toFixed(4) }}</span>
          </div>
          <div>
            <span class="text-gray-500">Low:</span>
            <span class="ml-2 font-medium">{{ parseFloat(activeSubscription.l).toFixed(4) }}</span>
          </div>
          <div>
            <span class="text-gray-500">Volume:</span>
            <span class="ml-2 font-medium">{{ parseFloat(activeSubscription.v).toFixed(2) }}</span>
          </div>
          <div>
            <span class="text-gray-500">Trades:</span>
            <span class="ml-2 font-medium">{{ activeSubscription.n }}</span>
          </div>
        </div>
      </li>
      <li v-else>
        <div class="text-center text-gray-500 py-4">
          Loading candlestick data...
        </div>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
import type { SelectPair, CandlestickData } from '~/types/types';

const props = withDefaults(defineProps<{
  selectedItem: SelectPair
  activeSubscription: CandlestickData | null
}>(), {
  //
})

const upOrDown = ref<'up' | 'down' | null>(null)

watch(() => props.activeSubscription, (v, prev) => {
  // console.log(v, prev)
  if (v && prev) {
    upOrDown.value = v.c > prev.c ? 'up' : 'down'
  }
})
</script>
