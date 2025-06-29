<template>
  <UCard
    variant="subtle"
    class="mb-4"
  >
    <template #header>
      <span class="flex items-center">
        <IconTwoTokens
          :base-icon="selectedItem.baseIcon"
          :quote-icon="selectedItem.quoteIcon"
          class="mr-2"
        />
        <h5>{{ selectedItem.label }}</h5>
      </span>
    </template>

    <ul class="block min-w-[250px]">
      <li v-if="activeSubscription">
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div class="flex flex-col">
            <span class="text-gray-500">Open:</span>
            <span class="font-medium">{{ parseFloat(activeSubscription.o).toFixed(4) }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-gray-500">Close:</span>
            <span 
              class="font-medium" 
              :class="{ 
                'text-green-500': upOrDown === 'up', 
                'text-red-500': upOrDown === 'down',
                'text-gray-500': upOrDown === null
              }"
            >
              {{ parseFloat(activeSubscription.c).toFixed(4) }}
            </span>
          </div>
          <div class="flex flex-col">
            <span class="text-gray-500">High:</span>
            <span class="font-medium">{{ parseFloat(activeSubscription.h).toFixed(4) }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-gray-500">Low:</span>
            <span class="font-medium">{{ parseFloat(activeSubscription.l).toFixed(4) }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-gray-500">Volume:</span>
            <span class="font-medium">{{ parseFloat(activeSubscription.v).toFixed(2) }}</span>
          </div>
          <div class="flex flex-col">
            <span class="text-gray-500">Trades:</span>
            <span class=" font-medium">{{ activeSubscription.n }}</span>
          </div>
        </div>
      </li>
      <li v-else>
        <div class="text-center text-gray-500 py-6 min-h-[152px]">
          Loading candlestick data...
        </div>
      </li>
    </ul>
  </UCard>
</template>

<script setup lang="ts">
import type { SelectPair, CandlestickData } from '~/types/types';
import IconTwoTokens from '../icon/IconTwoTokens.vue';

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
