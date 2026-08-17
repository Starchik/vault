// Best-effort market data. Never blocks the UI — every caller treats a
// failure/empty result as "price unavailable" rather than an error.

export async function getNativeMarketData(coingeckoIds) {
  const ids = [...new Set(coingeckoIds)].filter(Boolean)
  if (!ids.length) return {}
  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids.join(
      ','
    )}&sparkline=true&price_change_percentage=24h`
    const res = await fetch(url)
    if (!res.ok) return {}
    const rows = await res.json()
    const byId = {}
    for (const row of rows) {
      byId[row.id] = {
        usd: row.current_price,
        change24h: row.price_change_percentage_24h,
        sparkline: row.sparkline_in_7d?.price || [],
      }
    }
    return byId
  } catch {
    return {}
  }
}
