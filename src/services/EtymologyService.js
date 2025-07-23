import { 
  ETYMOLOGY_PATTERNS, 
  MORPHOLOGICAL_PATTERNS, 
  INFLECTION_PATTERNS, 
  INFLECTION_FALLBACK_PATTERNS, 
  AFFIX_ORIGINS 
} from '../constants/languages.js'
import etymologyCache from './EtymologyCache.js'

class EtymologyService {
  async fetchEtymology(word, depth = 0) {
    // Prevent infinite recursion
    if (depth > 2) return 'Unknown'
    
    // Check cache first
    const cachedResult = etymologyCache.get(word)
    if (cachedResult !== null) {
      return cachedResult
    }
    
    try {
      // First, try simple morphological analysis for common plurals/inflections
      if (depth === 0) { // Only on first call, not recursion
        for (const { pattern, singular } of MORPHOLOGICAL_PATTERNS) {
          const match = word.match(pattern)
          if (match && match[1].length > 2) { // Avoid single letters
            const baseWord = singular(match)
            const baseEtymology = await this.fetchEtymology(baseWord, depth + 1)
            if (baseEtymology !== 'Unknown') {
              etymologyCache.set(word, baseEtymology)
              return baseEtymology // Return the base word's etymology
            }
          }
        }
      }

      // Step 1: Get sections to find Etymology section
      const sectionsResponse = await fetch(
        `https://en.wiktionary.org/w/api.php?` +
        `action=parse&page=${encodeURIComponent(word.toLowerCase())}&prop=sections&format=json&origin=*`
      )
      
      if (!sectionsResponse.ok) {
        // Check if it's a network/server error vs word not found
        if (sectionsResponse.status >= 500) {
          throw new Error('NETWORK_ERROR')
        } else if (sectionsResponse.status === 404 || sectionsResponse.status === 400) {
          return 'Unknown' // Word not found
        }
        throw new Error('NETWORK_ERROR')
      }
      
      const sectionsData = await sectionsResponse.json()
      
      // Check for API error responses
      if (sectionsData.error) {
        if (sectionsData.error.code === 'missingtitle' || sectionsData.error.code === 'invalidtitle') {
          return 'Unknown' // Word not found or invalid title format
        }
        throw new Error('NETWORK_ERROR')
      }
      
      if (!sectionsData.parse || !sectionsData.parse.sections) {
        return 'Unknown'
      }
      
      // Find the Etymology section
      const etymologySection = sectionsData.parse.sections.find(
        section => section.line && section.line.startsWith('Etymology')
      )
      
      if (!etymologySection) {
        // If no etymology section, check if it's an inflected form
        const inflectionResult = await this.checkInflection(word, depth)
        if (inflectionResult !== 'Unknown') {
          etymologyCache.set(word, inflectionResult)
          return inflectionResult
        }
        const result = 'Unknown'
        etymologyCache.set(word, result)
        return result
      }
      
      // Step 2: Fetch the etymology section content
      const etymologyResponse = await fetch(
        `https://en.wiktionary.org/w/api.php?` +
        `action=parse&page=${encodeURIComponent(word.toLowerCase())}&section=${etymologySection.index}&prop=text&format=json&origin=*`
      )
      
      if (!etymologyResponse.ok) {
        const result = 'Unknown'
        etymologyCache.set(word, result)
        return result
      }
      
      const etymologyData = await etymologyResponse.json()
      
      if (!etymologyData.parse || !etymologyData.parse.text) {
        const result = 'Unknown'
        etymologyCache.set(word, result)
        return result
      }
      
      // Step 3: Parse the HTML and extract etymology
      const htmlText = etymologyData.parse.text['*']
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlText, 'text/html')
      const textContent = doc.body.textContent || ''
      
      // Pattern matching for common etymology indicators
      for (const { pattern, origin } of ETYMOLOGY_PATTERNS) {
        if (pattern.test(textContent)) {
          etymologyCache.set(word, origin)
          return origin
        }
      }
      
      // Check for compound words
      const compoundResult = await this.checkCompoundWord(htmlText, textContent, word, depth)
      if (compoundResult) {
        etymologyCache.set(word, compoundResult)
        return compoundResult
      }
      
      // Check for "see also" links that might point to root words
      const seeAlsoMatch = htmlText.match(/see also[:\s]*<a[^>]*title="([^"]+)"/i)
      if (seeAlsoMatch && seeAlsoMatch[1]) {
        const linkedWord = seeAlsoMatch[1].toLowerCase()
        // Only follow the link if it's not the same word and not another affix
        if (linkedWord !== word.toLowerCase() && !linkedWord.startsWith('-') && !linkedWord.endsWith('-')) {
          const result = await this.fetchEtymology(linkedWord, depth + 1)
          etymologyCache.set(word, result)
          return result
        }
      }
      
      // Check for language codes in the etymology
      if (/\bfro\b/.test(textContent) || /Old French/i.test(textContent)) {
        etymologyCache.set(word, 'French')
        return 'French'
      }
      if (/\bang\b/.test(textContent) || /Old English/i.test(textContent)) {
        etymologyCache.set(word, 'Old English')
        return 'Old English'
      }
      if (/\bla\b/.test(textContent) || /\blat\b/.test(textContent)) {
        etymologyCache.set(word, 'Latin')
        return 'Latin'
      }
      if (/\bgrc\b/.test(textContent)) {
        etymologyCache.set(word, 'Greek')
        return 'Greek'
      }
      
      const result = 'Unknown'
      etymologyCache.set(word, result)
      return result
    } catch (error) {
      console.error('Error fetching etymology for', word, ':', error)
      
      // Network or connection errors
      if (error.message === 'NETWORK_ERROR' || 
          error.name === 'TypeError' || // Often indicates network issues
          error.message.includes('fetch')) {
        const result = 'Network Error'
        // Don't cache network errors - they should be retried
        return result
      }
      
      const result = 'Unknown'
      etymologyCache.set(word, result)
      return result
    }
  }

  async checkInflection(word, depth) {
    // Get the full page content to look for inflection patterns
    const pageResponse = await fetch(
      `https://en.wiktionary.org/w/api.php?` +
      `action=parse&page=${encodeURIComponent(word.toLowerCase())}&prop=text&format=json&origin=*`
    )
    
    if (pageResponse.ok) {
      const pageData = await pageResponse.json()
      if (pageData.parse && pageData.parse.text) {
        const fullHtml = pageData.parse.text['*']
        const parser = new DOMParser()
        const doc = parser.parseFromString(fullHtml, 'text/html')
        const textContent = doc.body.textContent || ''
        
        // Look for English language section first
        const englishSectionMatch = fullHtml.match(/<h2[^>]*><span[^>]*id="English"[^>]*>English<\/span>.*?<\/h2>(.*?)(?=<h2|$)/s)
        
        if (englishSectionMatch) {
          const englishContent = englishSectionMatch[1]
          
          // Check for various English inflection patterns with links
          for (const pattern of INFLECTION_PATTERNS) {
            const match = englishContent.match(pattern)
            if (match && match[1]) {
              // Recursively fetch etymology of the base form (use the linked word)
              const baseWord = match[1].split('#')[0] // Remove any fragment
              return this.fetchEtymology(baseWord, depth + 1)
            }
          }
        }
        
        // Fallback to simpler text patterns if English section not found
        for (const pattern of INFLECTION_FALLBACK_PATTERNS) {
          const match = textContent.match(pattern)
          if (match && match[1]) {
            // Recursively fetch etymology of the base form
            return this.fetchEtymology(match[1], depth + 1)
          }
        }
      }
    }
    
    return 'Unknown'
  }

  async checkCompoundWord(htmlText, textContent, word, depth) {
    // Pattern 1: "from X + Y" 
    let htmlCompoundMatch = htmlText.match(/from\s+.*?<a[^>]*title="([^"]+)"[^>]*>([^<]+)<\/a>\s*\+[‎\s]*.*?<a[^>]*title="([^"]+)"[^>]*>([^<]+)<\/a>/i)
    
    // Pattern 2: "equivalent to X + Y"
    if (!htmlCompoundMatch) {
      htmlCompoundMatch = htmlText.match(/equivalent\s+to\s+.*?<a[^>]*title="([^"]+)"[^>]*>([^<]+)<\/a>\s*\+[‎\s]*.*?<a[^>]*title="([^"]+)"[^>]*>([^<]+)<\/a>/i)
    }
    
    let compoundMatch = null
    
    if (htmlCompoundMatch) {
      // Extract the actual words from the links
      compoundMatch = [null, htmlCompoundMatch[2].replace(/-/g, ''), htmlCompoundMatch[4].replace(/-/g, '')]
    } else {
      // Fallback to plain text matching for both patterns
      compoundMatch = textContent.match(/(?:from|equivalent\s+to)\s+([^\s\+]+)\s*\+[‎\s]*([^\s\.\,]+)/i)
    }

    if (compoundMatch) {
      const [, firstPart, secondPart] = compoundMatch
      
      // Fetch etymology for each part
      const firstOrigin = await this.fetchEtymology(firstPart, depth + 1)
      let secondOrigin = 'Unknown'
      
      // Handle suffixes/prefixes (starting with -)
      if (secondPart.startsWith('-') || secondPart.endsWith('-')) {
        // Try to fetch etymology for the affix, which might redirect to a root word
        secondOrigin = await this.fetchEtymology(secondPart, depth + 1)
        
        // If still unknown, fall back to common affix origins
        if (secondOrigin === 'Unknown') {
          secondOrigin = AFFIX_ORIGINS[secondPart] || 'Unknown'
        }
      } else {
        // It's a full word, fetch its etymology
        secondOrigin = await this.fetchEtymology(secondPart.replace(/[^\w]/g, ''), depth + 1)
      }
      
      return {
        compound: true,
        parts: [
          { text: firstPart, origin: firstOrigin },
          { text: secondPart.replace(/^-|-$/g, ''), origin: secondOrigin }
        ],
        originalWord: word
      }
    }

    return null
  }

  async processText(inputText) {
    if (!inputText.trim()) {
      return { processedWords: [], hasNetworkError: false }
    }

    const words = inputText.split(/[\s\-\.\/]+/).filter(word => word.length > 0)
    
    const wordPromises = words.map(async (word) => {
      const cleanWord = word.replace(/[^\w]/g, '')
      if (cleanWord.length === 0) return { word, origin: 'Unknown' }
      
      const origin = await this.fetchEtymology(cleanWord)
      
      // Check if it's a compound word that needs splitting
      if (origin.compound) {
        // If any part is Unknown, give it the color of the first non-Unknown part
        const nonUnknownPart = origin.parts.find(part => part.origin !== 'Unknown')
        if (nonUnknownPart) {
          origin.parts = origin.parts.map(part => ({
            ...part,
            origin: part.origin === 'Unknown' ? nonUnknownPart.origin : part.origin
          }))
        }
        return { word, origin: 'compound', parts: origin.parts }
      }
      
      return { word, origin }
    })

    const results = await Promise.all(wordPromises)
    
    // Check if there are network errors
    const networkErrors = results.filter(result => result.origin === 'Network Error')
    const hasNetworkError = networkErrors.length > 0

    if (hasNetworkError) {
      console.warn(`Network issues detected: ${networkErrors.length} words could not be processed due to connectivity problems with Wiktionary`)
    }

    return { 
      processedWords: hasNetworkError ? [] : results, 
      hasNetworkError 
    }
  }

  calculateOriginStats(processedWords) {
    const stats = {}
    let total = 0
    
    processedWords.forEach(item => {
      if (item.origin === 'compound' && item.parts) {
        // Count each part of compound words
        item.parts.forEach(part => {
          stats[part.origin] = (stats[part.origin] || 0) + 1
          total++
        })
      } else {
        stats[item.origin] = (stats[item.origin] || 0) + 1
        total++
      }
    })
    
    // Convert to percentages and angles
    const pieData = Object.entries(stats).map(([origin, count]) => ({
      origin,
      count,
      percentage: ((count / total) * 100).toFixed(1),
      angle: (count / total) * 360
    }))
    
    return pieData.sort((a, b) => b.count - a.count)
  }

  getActiveLanguages(processedWords) {
    const languages = new Set()
    
    processedWords.forEach(item => {
      if (item.origin === 'compound' && item.parts) {
        item.parts.forEach(part => {
          languages.add(part.origin)
        })
      } else {
        languages.add(item.origin)
      }
    })
    
    return Array.from(languages).sort()
  }
}

export default new EtymologyService()