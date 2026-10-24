const maximumMemoryEntries = 5000
const memoryCache = new Map()
const inFlightLoads = new Map()
let redisClient = null

const getMemoryValue = (key) => {
  const entry = memoryCache.get(key)
  if (!entry) return undefined
  if (entry.expiresAt <= Date.now()) {
    memoryCache.delete(key)
    return undefined
  }
  memoryCache.delete(key)
  memoryCache.set(key, entry)
  return entry.value
}

const setMemoryValue = (key, value, ttlSeconds) => {
  if (memoryCache.size >= maximumMemoryEntries && !memoryCache.has(key)) {
    const oldestKey = memoryCache.keys().next().value
    if (oldestKey !== undefined) memoryCache.delete(oldestKey)
  }
  memoryCache.delete(key)
  memoryCache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 })
}

const getOrLoad = async (key, ttlSeconds, loader) => {
  let useMemoryFallback = true
  if (redisClient?.isReady) {
    try {
      const cached = await redisClient.get(`devtrack:cache:${key}`)
      if (cached !== null) return JSON.parse(cached)
      useMemoryFallback = false
    } catch (error) {
      process.stderr.write(`Redis cache read failed: ${error.message}\n`)
    }
  }

  if (useMemoryFallback) {
    const memoryValue = getMemoryValue(key)
    if (memoryValue !== undefined) return memoryValue
  }

  const existingLoad = inFlightLoads.get(key)
  if (existingLoad) return existingLoad

  const load = Promise.resolve().then(loader)
  inFlightLoads.set(key, load)
  let value
  try {
    value = await load
  } finally {
    inFlightLoads.delete(key)
  }
  if (value === null || value === undefined) return value

  setMemoryValue(key, value, ttlSeconds)
  if (redisClient?.isReady) {
    try {
      await redisClient.set(`devtrack:cache:${key}`, JSON.stringify(value), { EX: ttlSeconds })
    } catch (error) {
      process.stderr.write(`Redis cache write failed: ${error.message}\n`)
    }
  }
  return value
}

const deleteCacheKey = async (key) => {
  memoryCache.delete(key)
  if (redisClient?.isReady) {
    try {
      await redisClient.del(`devtrack:cache:${key}`)
    } catch (error) {
      process.stderr.write(`Redis cache invalidation failed: ${error.message}\n`)
    }
  }
}

const setRedisCacheClient = (client) => {
  redisClient = client
}

const clearMemoryCache = () => {
  memoryCache.clear()
  inFlightLoads.clear()
}

module.exports = { clearMemoryCache, deleteCacheKey, getOrLoad, setRedisCacheClient }
