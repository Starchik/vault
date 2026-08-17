// Token discovery: fetch a chain's full token list from a public,
// no-API-key registry (1inch's token list, mirrored per chainId) and let
// the user search it by name or ticker instead of only pasting an address.

const cache = new Map() // chainId -> Promise<Token[]>

function normalizeList(json) {
  // 1inch returns { tokens: { "0xaddr": {symbol,name,decimals,logoURI}, ... } }
  const tokens = json?.tokens || json
  return Object.entries(tokens).map(([address, t]) => ({
    address,
    symbol: t.symbol,
    name: t.name,
    decimals: t.decimals,
    logoURI: t.logoURI,
  }))
}

export async function getTokenList(chain) {
  if (cache.has(chain.id)) return cache.get(chain.id)

  const promise = (async () => {
    try {
      const res = await fetch(`https://tokens.1inch.io/v1.2/${chain.chainId}`)
      if (!res.ok) throw new Error('list unavailable')
      const json = await res.json()
      return normalizeList(json)
    } catch {
      return []
    }
  })()

  cache.set(chain.id, promise)
  return promise
}

export async function searchTokens(chain, query) {
  const list = await getTokenList(chain)
  const q = query.trim().toLowerCase()
  if (!q) return []
  return list
    .filter((t) => t.symbol?.toLowerCase().includes(q) || t.name?.toLowerCase().includes(q))
    .sort((a, b) => {
      // exact/starts-with ticker matches first
      const aSym = a.symbol.toLowerCase()
      const bSym = b.symbol.toLowerCase()
      const aScore = aSym === q ? 0 : aSym.startsWith(q) ? 1 : 2
      const bScore = bSym === q ? 0 : bSym.startsWith(q) ? 1 : 2
      return aScore - bScore
    })
    .slice(0, 40)
}
