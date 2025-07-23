class EtymologyCache {
  constructor() {
    this.cacheKey = 'etymologyCache'
    this.dateKey = 'etymologyCacheDate'
    this.cleanupOldCaches()
  }

  cleanupOldCaches() {
    try {
      const cachedDate = localStorage.getItem(this.dateKey)
      const today = new Date().toDateString()
      
      if (cachedDate && cachedDate !== today) {
        // Clear cache if it's from a previous date
        localStorage.removeItem(this.cacheKey)
        localStorage.removeItem(this.dateKey)
      }
      
      // Set today's date
      localStorage.setItem(this.dateKey, today)
    } catch (error) {
      console.warn('Failed to cleanup cache:', error)
    }
  }

  getCache() {
    try {
      const cached = localStorage.getItem(this.cacheKey)
      return cached ? JSON.parse(cached) : {}
    } catch (error) {
      console.warn('Failed to read cache:', error)
      return {}
    }
  }

  setCache(cache) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify(cache))
    } catch (error) {
      console.warn('Failed to write cache:', error)
    }
  }

  get(word) {
    const cache = this.getCache()
    return cache[word.toLowerCase()] || null
  }

  set(word, result) {
    const cache = this.getCache()
    cache[word.toLowerCase()] = result
    this.setCache(cache)
  }

  has(word) {
    const cache = this.getCache()
    return word.toLowerCase() in cache
  }

  clear() {
    try {
      localStorage.removeItem(this.cacheKey)
      localStorage.removeItem(this.dateKey)
    } catch (error) {
      console.warn('Failed to clear cache:', error)
    }
  }

  // Get cache statistics for debugging
  getStats() {
    const cache = this.getCache()
    const cachedDate = localStorage.getItem(this.dateKey)
    return {
      entries: Object.keys(cache).length,
      date: cachedDate,
      size: JSON.stringify(cache).length
    }
  }
}

export default new EtymologyCache()