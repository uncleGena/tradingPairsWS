import { defineEventHandler, getQuery } from 'h3'
import { binanceCryptoIcons, binanceEtfIcons, binanceCurrencyIcons } from 'binance-icons'
import Binance from 'node-binance-api'
import { useRuntimeConfig } from '#imports'
import type { SelectPair } from '~/types/types'

// FIXME: use cache
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let globalInfo: any = null

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchQuery = (query.query as string || '').toUpperCase().split(',')
  console.log('searchQuerySet', searchQuery)

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

    if (!globalInfo) {
      globalInfo = await binance.exchangeInfo()
    }

    const pairs = globalInfo.symbols
      .filter((symbol: { status: string }) => symbol.status === 'TRADING')
      .map((s: { baseAsset: string, quoteAsset: string, symbol: string }) => {
        const pair: SelectPair = {
          label: `${s.baseAsset}/${s.quoteAsset}`,
          value: s.symbol,
          avatar: {
            src: `https://dummyimage.com/32x32/000/fff.png&text=${s.baseAsset}/${s.quoteAsset}`,
            alt: `${s.baseAsset}/${s.quoteAsset}`
          },
          baseIcon: {
            svg: getIcon(s.baseAsset),
            src: `https://dummyimage.com/32x32/000/fff.png&text=${s.baseAsset}`,
            alt: s.baseAsset,
          },
          quoteIcon: {
            svg: getIcon(s.quoteAsset),
            src: `https://dummyimage.com/32x32/000/fff.png&text=${s.quoteAsset}`,
            alt: s.quoteAsset,
          },
        }

        return pair
      })

    const pairsWithSearch = (() => {
      if (searchQuery.length === 0) return pairs
      
      return pairs.filter((pair: SelectPair) => {
        const inLabel = searchQuery.some(term => pair.label.toUpperCase().includes(term))
        const inValue = searchQuery.some(term => pair.value.toUpperCase().includes(term))
        return inLabel || inValue
      })
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

  function getIcon(asset: string) {
    const assetLow = asset.toLowerCase()
    return binanceCryptoIcons.get(assetLow) || binanceCurrencyIcons.get(assetLow) || binanceEtfIcons.get(assetLow) || null
  }
}) 
