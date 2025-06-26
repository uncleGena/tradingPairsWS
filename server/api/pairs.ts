import { defineEventHandler, getQuery } from 'h3'
import Binance from 'node-binance-api'
import { useRuntimeConfig } from '#imports'
import type { SelectPair } from '~/types/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchQuery = (query.query as string || '').toUpperCase()

  const config = useRuntimeConfig()
  const binanceKey = config.env.binanceKey as string
  const binanceSecret = config.env.binanceSecret as string

  if (!binanceKey || !binanceSecret) {
    throw createError({
      statusCode: 503,
      statusMessage: 'Binance service is not configured on the server.',
    })
  }

  try {
    const binance = new Binance().options({
      APIKEY: binanceKey,
      APISECRET: binanceSecret,
    })

    // TODO: cache this is expensive
    const info = await binance.exchangeInfo()

    const pairs = info.symbols
      .filter((symbol: { status: string }) => symbol.status === 'TRADING')
      .map((s: { baseAsset: string, quoteAsset: string, symbol: string }) => {
        const pair: SelectPair = {
          label: `${s.baseAsset}/${s.quoteAsset}`,
          value: s.symbol,
          avatar: {
            src: `https://dummyimage.com/320x320/000/fff.png&text=${s.baseAsset}/${s.quoteAsset}`,
            alt: `${s.baseAsset}/${s.quoteAsset}`
          }
        }

        return pair
      })

    const pairsWithSearch = (() => {
      if (!searchQuery) return pairs
      return pairs.filter((pair: { label: string }) => pair.label.toUpperCase().includes(searchQuery))
    })()

    const pairsSorted = pairsWithSearch.sort((a: { label: string }, b: { label: string }) => a.label.localeCompare(b.label))

    return pairsSorted
  } catch (error) {
    console.error('Failed to fetch pairs from Binance:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to fetch trading pairs from Binance.',
    })
  }
}) 
