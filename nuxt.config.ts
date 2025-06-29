// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  devServer: {
    port: 3041,
  },

  runtimeConfig: {
    env: {
      binanceKey: process.env.NUXT_ENV_BINANCE_KEY || '',
      binanceSecret: process.env.NUXT_ENV_BINANCE_SECRET || '',
    }
  },

  modules: [
    '@vueuse/nuxt',
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/image',
    '@nuxt/scripts',
    '@nuxt/ui'
  ],

  nitro: {
    experimental: {
      websocket: true
    }
  },

  css: ['~/assets/css/main.css'],

  
})