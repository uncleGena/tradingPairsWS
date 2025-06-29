<template>
  <div class="relative w-12 h-8">
    <span
      v-if="baseIcon.svg"
      class="absolute top-0 left-0 z-10" 
      v-html="baseIcon.svg"
    />
    <img
      v-else
      :src="baseIcon.src"
      :alt="baseIcon.alt"
      width="32"
      height="32"
      class="absolute top-0 left-0 z-10 rounded-full"
    >
    <span
      v-if="quoteIcon.svg"
      class="absolute top-0 right-0 z-0" 
      v-html="quoteIcon.svg"
    />
    <img
      v-else
      :src="quoteIcon.src"
      :alt="quoteIcon.alt"
      width="32"
      height="32"
      class="absolute top-0 right-0 z-0 rounded-full"
    >
  </div>
</template>

<script setup lang="ts">
import type { SelectPair } from '~/types/types';

defineProps<{
  baseIcon: SelectPair['baseIcon'],
  quoteIcon: SelectPair['quoteIcon'],
}>()

</script>