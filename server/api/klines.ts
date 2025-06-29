import { defineEventHandler, getQuery } from 'h3'
import Binance from 'node-binance-api'
import { useRuntimeConfig } from '#imports'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const symbol = query.symbol as string

  if (!symbol) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Symbol query parameter is required.',
    })
  }

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

    // Fetch the most recent 1-minute candlestick
    const klines = await binance.candles(symbol, '1m', { limit: 1 })

    // The endpoint returns an array, we only need the first (and only) element
    const lastKline = klines[0]

    return lastKline
  }
  catch (error) {
    console.error(`Failed to fetch klines for ${symbol} from Binance:`, error)
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to fetch klines for ${symbol}.`,
    })
  }
}) 