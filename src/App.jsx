import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import './App.css'

const LANGUAGE_COLORS = {
  'Old English': '#8B4513',
  'Latin': '#DC143C',
  'French': '#4169E1',
  'Old Norse': '#228B22',
  'Germanic': '#FF8C00',
  'Greek': '#9932CC',
  'Celtic': '#2E8B57',
  'Sanskrit': '#B8860B',
  'Dutch': '#FF4500',
  'Italian': '#8B008B',
  'Spanish': '#FF69B4',
  'Arabic': '#556B2F',
  'Unknown': '#808080'
}

function App() {
  const [inputText, setInputText] = useState('')
  const [processedWords, setProcessedWords] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const resultsRef = useRef(null)
  const inputSectionRef = useRef(null)

  const fetchEtymology = async (word, depth = 0) => {
    // Prevent infinite recursion
    if (depth > 2) return 'Unknown'
    
    try {
      // First, try simple morphological analysis for common plurals/inflections
      if (depth === 0) { // Only on first call, not recursion
        const morphPatterns = [
          { pattern: /^(.+)s$/, singular: (m) => m[1] }, // files -> file
          { pattern: /^(.+)es$/, singular: (m) => m[1] }, // boxes -> box
          { pattern: /^(.+)ies$/, singular: (m) => m[1] + 'y' }, // flies -> fly
          { pattern: /^(.+)ed$/, singular: (m) => m[1] }, // walked -> walk
          { pattern: /^(.+)ing$/, singular: (m) => m[1] }, // walking -> walk
          { pattern: /^(.+)er$/, singular: (m) => m[1] }, // bigger -> big
          { pattern: /^(.+)est$/, singular: (m) => m[1] }, // biggest -> big
        ]
        
        for (const { pattern, singular } of morphPatterns) {
          const match = word.match(pattern)
          if (match && match[1].length > 2) { // Avoid single letters
            const baseWord = singular(match)
            const baseEtymology = await fetchEtymology(baseWord, depth + 1)
            if (baseEtymology !== 'Unknown') {
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
              const inflectionPatterns = [
                /plural\s+of\s+.*?<a[^>]*title="([^"#]+)(?:#[^"]*)?"[^>]*>/i,
                /past\s+(?:tense\s+)?(?:and\s+past\s+participle\s+)?of\s+.*?<a[^>]*title="([^"#]+)(?:#[^"]*)?"[^>]*>/i,
                /present\s+participle\s+of\s+.*?<a[^>]*title="([^"#]+)(?:#[^"]*)?"[^>]*>/i,
                /third-person\s+singular\s+.*?of\s+.*?<a[^>]*title="([^"#]+)(?:#[^"]*)?"[^>]*>/i,
                /simple\s+past\s+.*?of\s+.*?<a[^>]*title="([^"#]+)(?:#[^"]*)?"[^>]*>/i,
                /past\s+participle\s+of\s+.*?<a[^>]*title="([^"#]+)(?:#[^"]*)?"[^>]*>/i,
              ]
              
              for (const pattern of inflectionPatterns) {
                const match = englishContent.match(pattern)
                if (match && match[1]) {
                  // Recursively fetch etymology of the base form (use the linked word)
                  const baseWord = match[1].split('#')[0] // Remove any fragment
                  return fetchEtymology(baseWord, depth + 1)
                }
              }
            }
            
            // Fallback to simpler text patterns if English section not found
            const inflectionPatterns = [
              /plural\s+of\s+(\w+)/i,
              /past\s+(?:tense\s+)?(?:and\s+past\s+participle\s+)?of\s+(\w+)/i,
              /present\s+participle\s+of\s+(\w+)/i,
              /gerund\s+of\s+(\w+)/i,
              /third-person\s+singular\s+(?:simple\s+)?present\s+(?:indicative\s+)?(?:form\s+)?of\s+(\w+)/i,
              /simple\s+past\s+tense\s+and\s+past\s+participle\s+of\s+(\w+)/i,
              /comparative\s+form\s+of\s+(\w+)/i,
              /superlative\s+form\s+of\s+(\w+)/i,
              /past\s+participle\s+of\s+(\w+)/i,
              /inflection\s+of\s+(\w+)/i,
            ]
            
            for (const pattern of inflectionPatterns) {
              const match = textContent.match(pattern)
              if (match && match[1]) {
                // Recursively fetch etymology of the base form
                return fetchEtymology(match[1], depth + 1)
              }
            }
          }
        }
        
        return 'Unknown'
      }
      
      // Step 2: Fetch the etymology section content
      const etymologyResponse = await fetch(
        `https://en.wiktionary.org/w/api.php?` +
        `action=parse&page=${encodeURIComponent(word.toLowerCase())}&section=${etymologySection.index}&prop=text&format=json&origin=*`
      )
      
      if (!etymologyResponse.ok) {
        return 'Unknown'
      }
      
      const etymologyData = await etymologyResponse.json()
      
      if (!etymologyData.parse || !etymologyData.parse.text) {
        return 'Unknown'
      }
      
      // Step 3: Parse the HTML and extract etymology
      const htmlText = etymologyData.parse.text['*']
      const parser = new DOMParser()
      const doc = parser.parseFromString(htmlText, 'text/html')
      const textContent = doc.body.textContent || ''
      
      // Pattern matching for common etymology indicators
      const etymologyPatterns = [
        { pattern: /from\s+(?:the\s+)?old\s+english/i, origin: 'Old English' },
        { pattern: /from\s+(?:the\s+)?latin/i, origin: 'Latin' },
        { pattern: /from\s+(?:the\s+)?(?:old\s+)?french/i, origin: 'French' },
        { pattern: /from\s+(?:the\s+)?old\s+norse/i, origin: 'Old Norse' },
        { pattern: /from\s+(?:the\s+)?(?:proto-)?germanic/i, origin: 'Germanic' },
        { pattern: /from\s+(?:the\s+)?(?:ancient\s+)?greek/i, origin: 'Greek' },
        { pattern: /from\s+(?:the\s+)?celtic/i, origin: 'Celtic' },
        { pattern: /from\s+(?:the\s+)?sanskrit/i, origin: 'Sanskrit' },
        { pattern: /from\s+(?:the\s+)?dutch/i, origin: 'Dutch' },
        { pattern: /from\s+(?:the\s+)?italian/i, origin: 'Italian' },
        { pattern: /from\s+(?:the\s+)?spanish/i, origin: 'Spanish' },
        { pattern: /from\s+(?:the\s+)?arabic/i, origin: 'Arabic' },
        { pattern: /borrowed\s+from\s+(?:the\s+)?latin/i, origin: 'Latin' },
        { pattern: /borrowed\s+from\s+(?:the\s+)?(?:old\s+)?french/i, origin: 'French' },
        { pattern: /of\s+(?:the\s+)?latin\s+origin/i, origin: 'Latin' },
        { pattern: /of\s+(?:the\s+)?(?:old\s+)?french\s+origin/i, origin: 'French' },
        { pattern: /of\s+(?:the\s+)?germanic\s+origin/i, origin: 'Germanic' },
      ]
      
      for (const { pattern, origin } of etymologyPatterns) {
        if (pattern.test(textContent)) {
          return origin
        }
      }
      
      // Check for compound words with various patterns
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
        const firstOrigin = await fetchEtymology(firstPart, depth + 1)
        let secondOrigin = 'Unknown'
        
        // Handle suffixes/prefixes (starting with -)
        if (secondPart.startsWith('-') || secondPart.endsWith('-')) {
          // Try to fetch etymology for the affix, which might redirect to a root word
          secondOrigin = await fetchEtymology(secondPart, depth + 1)
          
          // If still unknown, fall back to common affix origins
          if (secondOrigin === 'Unknown') {
            const affixOrigins = {
              '-ly': 'Old English',
              '-ness': 'Old English',
              '-ment': 'French',
              '-tion': 'Latin',
              '-sion': 'Latin',
              '-ity': 'Latin',
              '-ous': 'Latin',
              '-ful': 'Old English',
              '-less': 'Old English',
              '-ward': 'Old English',
              '-wise': 'Old English',
              'un-': 'Old English',
              're-': 'Latin',
              'pre-': 'Latin',
              'dis-': 'Latin',
              'in-': 'Latin',
              'im-': 'Latin',
            }
            secondOrigin = affixOrigins[secondPart] || 'Unknown'
          }
        } else {
          // It's a full word, fetch its etymology
          secondOrigin = await fetchEtymology(secondPart.replace(/[^\w]/g, ''), depth + 1)
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
      
      // Check for "see also" links that might point to root words
      const seeAlsoMatch = htmlText.match(/see also[:\s]*<a[^>]*title="([^"]+)"/i)
      if (seeAlsoMatch && seeAlsoMatch[1]) {
        const linkedWord = seeAlsoMatch[1].toLowerCase()
        // Only follow the link if it's not the same word and not another affix
        if (linkedWord !== word.toLowerCase() && !linkedWord.startsWith('-') && !linkedWord.endsWith('-')) {
          return await fetchEtymology(linkedWord, depth + 1)
        }
      }
      
      // Check for language codes in the etymology
      if (/\bfro\b/.test(textContent) || /Old French/i.test(textContent)) return 'French'
      if (/\bang\b/.test(textContent) || /Old English/i.test(textContent)) return 'Old English'
      if (/\bla\b/.test(textContent) || /\blat\b/.test(textContent)) return 'Latin'
      if (/\bgrc\b/.test(textContent)) return 'Greek'
      
      return 'Unknown'
    } catch (error) {
      console.error('Error fetching etymology for', word, ':', error)
      
      // Network or connection errors
      if (error.message === 'NETWORK_ERROR' || 
          error.name === 'TypeError' || // Often indicates network issues
          error.message.includes('fetch')) {
        return 'Network Error'
      }
      
      return 'Unknown'
    }
  }

  // Calculate origin distribution for pie chart
  const originStats = useMemo(() => {
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
  }, [processedWords])

  // Get unique languages that appear in the text
  const activeLanguages = useMemo(() => {
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
  }, [processedWords])

  const processText = useCallback(async () => {
    if (!inputText.trim()) {
      setProcessedWords([])
      setShowResults(false)
      setNetworkError(false)
      return
    }
    
    // Reset states
    setShowResults(false)
    setNetworkError(false)

    setLoading(true)
    const words = inputText.split(/[\s\-\.\/]+/).filter(word => word.length > 0)
    
    const wordPromises = words.map(async (word) => {
      const cleanWord = word.replace(/[^\w]/g, '')
      if (cleanWord.length === 0) return { word, origin: 'Unknown' }
      
      const origin = await fetchEtymology(cleanWord)
      
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
    if (networkErrors.length > 0) {
      console.warn(`Network issues detected: ${networkErrors.length} words could not be processed due to connectivity problems with Wiktionary`)
      setNetworkError(true)
      setLoading(false)
      return // Don't show results if there are network errors
    }
    
    setProcessedWords(results)
    setLoading(false)
    
    // First scroll to top smoothly
    if (inputSectionRef.current) {
      inputSectionRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start',
        inline: 'nearest'
      })
    }
    
    // Then trigger fade-in animations after scroll completes
    setTimeout(() => {
      setShowResults(true)
    }, 1000) // Give time for scroll to complete
  }, [inputText])

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '672px' }}>
        <div ref={inputSectionRef} style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '300', letterSpacing: '0.1em', color: 'black', marginBottom: '8px' }}>ETYMA</h1>
          <p style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: '300', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Where Language Comes From
          </p>
        </div>
        
        <div style={{ marginBottom: '32px' }}>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Enter text to analyze..."
            rows={5}
            style={{
              width: '100%',
              border: '1px solid #e5e7eb',
              padding: '16px',
              fontSize: '0.875rem',
              fontWeight: '300',
              letterSpacing: '0.05em',
              resize: 'none',
              outline: 'none',
              transition: 'border-color 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => e.target.style.borderColor = 'black'}
            onBlur={(e) => e.target.style.borderColor = '#e5e7eb'}
          />
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '16px' }}>
            <button 
              onClick={processText} 
              disabled={loading} 
              style={{
                padding: '8px 24px',
                backgroundColor: loading ? '#d1d5db' : 'black',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '500',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#374151')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = 'black')}
            >
              {loading ? 'ANALYZING...' : 'ANALYZE'}
            </button>
          </div>
        </div>

        {networkError && (
          <div style={{
            marginBottom: '32px',
            padding: '20px',
            border: '1px solid #fee',
            backgroundColor: '#fef2f2',
            textAlign: 'center',
            boxSizing: 'border-box',
            width: '100%'
          }}>
            <div style={{
              fontSize: '2rem',
              marginBottom: '12px'
            }}>
              ⚠️
            </div>
            <p style={{
              fontSize: '0.9rem',
              color: '#dc2626',
              marginBottom: '16px',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              fontWeight: '400'
            }}>
              Can't reach Wiktionary
            </p>
            <button 
              onClick={processText} 
              disabled={loading}
              style={{
                padding: '8px 24px',
                backgroundColor: '#dc2626',
                color: 'white',
                fontSize: '0.75rem',
                fontWeight: '500',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => !loading && (e.target.style.backgroundColor = '#b91c1c')}
              onMouseOut={(e) => !loading && (e.target.style.backgroundColor = '#dc2626')}
            >
              {loading ? 'RETRYING...' : 'TRY AGAIN'}
            </button>
          </div>
        )}

        {processedWords.length > 0 && !networkError && (
          <div 
            ref={resultsRef}
            style={{ 
              marginBottom: '32px',
              opacity: showResults ? 1 : 0,
              transform: showResults ? 'translateY(0)' : 'translateY(20px)',
              transition: 'opacity 0.8s ease-out, transform 0.8s ease-out'
            }}
          >
            <div style={{
              width: '100%',
              border: '1px solid #e5e7eb',
              padding: '16px',
              fontSize: '1rem',
              fontWeight: '600',
              letterSpacing: '0.05em',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordWrap: 'break-word',
              boxSizing: 'border-box',
              fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              minHeight: '140px'
            }}>
              {processedWords.map((item, index) => {
                if (item.origin === 'compound' && item.parts) {
                  // For compound words, prioritize the second part length to get better splits
                  const wordWithoutPunctuation = item.word.replace(/[^\w]/g, '')
                  const secondPartLength = item.parts[1].text.length
                  const firstPartLength = wordWithoutPunctuation.length - secondPartLength
                  
                  // Render compound words with parts colored separately
                  return (
                    <span key={index}>
                      <span
                        style={{ 
                          color: LANGUAGE_COLORS[item.parts[0].origin] || LANGUAGE_COLORS.Unknown,
                          cursor: 'help',
                          transition: 'opacity 0.2s'
                        }}
                        title={`${item.parts[0].text}: ${item.parts[0].origin}`}
                        onMouseOver={(e) => e.target.style.opacity = '0.7'}
                        onMouseOut={(e) => e.target.style.opacity = '1'}
                      >
                        {wordWithoutPunctuation.substring(0, firstPartLength)}
                      </span>
                      <span
                        style={{ 
                          color: LANGUAGE_COLORS[item.parts[1].origin] || LANGUAGE_COLORS.Unknown,
                          cursor: 'help',
                          transition: 'opacity 0.2s'
                        }}
                        title={`${item.parts[1].text}: ${item.parts[1].origin}`}
                        onMouseOver={(e) => e.target.style.opacity = '0.7'}
                        onMouseOut={(e) => e.target.style.opacity = '1'}
                      >
                        {wordWithoutPunctuation.substring(firstPartLength)}
                      </span>
                      {item.word.match(/[^\w]$/) ? item.word.match(/[^\w]$/)[0] : ''}
                      {' '}
                    </span>
                  )
                }
                
                // Regular word rendering
                return (
                  <span
                    key={index}
                    style={{ 
                      color: LANGUAGE_COLORS[item.origin] || LANGUAGE_COLORS.Unknown,
                      cursor: 'help',
                      transition: 'opacity 0.2s'
                    }}
                    title={`Origin: ${item.origin}`}
                    onMouseOver={(e) => e.target.style.opacity = '0.7'}
                    onMouseOut={(e) => e.target.style.opacity = '1'}
                  >
                    {item.word}{' '}
                  </span>
                )
              })}
            </div>
          </div>
        )}


        {activeLanguages.length > 0 && !networkError && (
          <div style={{ 
            marginBottom: '32px',
            opacity: showResults ? 1 : 0,
            transform: showResults ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1s ease-out 0.3s, transform 1s ease-out 0.3s'
          }}>
            <div style={{
              width: '100%',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              border: '1px solid #e5e7eb',
              padding: '20px',
              boxSizing: 'border-box'
            }}>
              {activeLanguages.map((language) => (
                <div key={language} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 0'
                }}>
                  <div 
                    style={{ 
                      width: '16px',
                      height: '16px',
                      backgroundColor: LANGUAGE_COLORS[language] || LANGUAGE_COLORS.Unknown,
                      border: '1px solid #d1d5db',
                      flexShrink: 0
                    }}
                  ></div>
                  <span style={{
                    fontSize: '0.9rem',
                    fontWeight: '400',
                    letterSpacing: '0.05em',
                    color: '#374151',
                    fontFamily: 'system-ui, -apple-system, sans-serif'
                  }}>
                    {language}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {processedWords.length > 0 && originStats.length > 1 && !networkError && (
          <div style={{ 
            marginBottom: '32px',
            opacity: showResults ? 1 : 0,
            transform: showResults ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1.2s ease-out 0.6s, transform 1.2s ease-out 0.6s'
          }}>
            <div style={{
              width: '100%',
              border: '1px solid #e5e7eb',
              padding: '20px',
              boxSizing: 'border-box',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
              <svg width="200" height="200" viewBox="0 0 200 200">
                {(() => {
                  let currentAngle = 0
                  return originStats.map((stat, index) => {
                    const startAngle = currentAngle
                    const endAngle = currentAngle + stat.angle
                    currentAngle = endAngle
                    
                    // Convert angles to radians
                    const startRad = (startAngle * Math.PI) / 180
                    const endRad = (endAngle * Math.PI) / 180
                    
                    // Calculate arc path
                    const x1 = 100 + 80 * Math.cos(startRad)
                    const y1 = 100 + 80 * Math.sin(startRad)
                    const x2 = 100 + 80 * Math.cos(endRad)
                    const y2 = 100 + 80 * Math.sin(endRad)
                    
                    const largeArc = stat.angle > 180 ? 1 : 0
                    
                    const pathData = [
                      `M 100 100`,
                      `L ${x1} ${y1}`,
                      `A 80 80 0 ${largeArc} 1 ${x2} ${y2}`,
                      `Z`
                    ].join(' ')
                    
                    return (
                      <g key={index}>
                        <path
                          d={pathData}
                          fill={LANGUAGE_COLORS[stat.origin] || LANGUAGE_COLORS.Unknown}
                          stroke="none"
                          className="pie-slice"
                        />
                      </g>
                    )
                  })
                })()}
              </svg>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App