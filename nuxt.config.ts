// https://nuxt.com/docs/api/configuration/nuxt-config

import { LOCAL_STORAGE_COLOR_MODE } from './utils/constants'

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
    '@nuxtjs/color-mode',
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

  colorMode: {
    // preference: 'system', // default value of $colorMode.preference
    // fallback: 'light', // fallback value if not system preference found
    // hid: 'nuxt-color-mode-script',
    // globalName: '__NUXT_COLOR_MODE__',
    // componentName: 'ColorScheme',
    classPrefix: '',
    classSuffix: '',
    storage: 'localStorage', // or 'sessionStorage' or 'cookie'
    storageKey: LOCAL_STORAGE_COLOR_MODE
  }
})