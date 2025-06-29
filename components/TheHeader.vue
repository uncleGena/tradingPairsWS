<template>
  <header class="flex justify-between items-center py-4 border-b border-gray-200 dark:border-gray-800 w-full px-4">
    <h1 class="text-2xl font-bold">
      Binance Pairs
    </h1>
    <UButton 
      :icon="isDark ? 'i-ph-sun' : 'i-ph-moon'" 
      variant="ghost" 
      color="neutral" 
      size="sm" 
      class="text-sm" 
      @click="isDark = !isDark" 
    />
  </header>
</template>

<script setup lang="ts">
const colorMode = useColorMode()

const isDark = computed({
  get() {
    return colorMode.value === 'dark'
  },
  set(value) {
    colorMode.preference = value ? 'dark' : 'light'
  }
})
</script> 