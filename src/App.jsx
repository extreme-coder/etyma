import { useState, useCallback, useMemo, useRef } from 'react'
import './App.css'
import etymologyService from './services/EtymologyService.js'
import AnalyzedText from './components/AnalyzedText.jsx'
import LanguageLegend from './components/LanguageLegend.jsx'
import EtymologyChart from './components/EtymologyChart.jsx'
import ErrorMessage from './components/ErrorMessage.jsx'

function App() {
  const [inputText, setInputText] = useState('')
  const [processedWords, setProcessedWords] = useState([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const resultsRef = useRef(null)
  const inputSectionRef = useRef(null)


  // Calculate origin distribution for pie chart
  const originStats = useMemo(() => {
    return etymologyService.calculateOriginStats(processedWords)
  }, [processedWords])

  // Get unique languages that appear in the text
  const activeLanguages = useMemo(() => {
    return etymologyService.getActiveLanguages(processedWords)
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
    
    const { processedWords: results, hasNetworkError } = await etymologyService.processText(inputText)
    
    if (hasNetworkError) {
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
    <div style={{ minHeight: '100vh', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative' }}>
      <div style={{ width: '100%', maxWidth: '672px' }}>
        <div ref={inputSectionRef} style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '300', letterSpacing: '0.1em', color: 'black', marginBottom: '8px' }}>ETYMA</h1>
          <p style={{ color: '#6b7280', fontSize: '0.75rem', fontWeight: '300', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Illuminating Word Origins
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
              fontSize: '16px',
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

        <ErrorMessage 
          isVisible={networkError}
          onRetry={processText}
          loading={loading}
        />

        {!networkError && (
          <AnalyzedText 
            processedWords={processedWords}
            showResults={showResults}
          />
        )}


        {!networkError && (
          <LanguageLegend 
            originStats={originStats}
            showResults={showResults}
          />
        )}

        {!networkError && (
          <EtymologyChart 
            originStats={originStats}
            showResults={showResults}
          />
        )}
      </div>
      
      {/* Social links */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', display: 'flex', gap: '12px' }}>
        <a 
          href="https://www.linkedin.com/in/aryan-singh-b49627247/" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: 'black',
            textDecoration: 'none',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.target.style.opacity = '0.6'}
          onMouseOut={(e) => e.target.style.opacity = '1'}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
          </svg>
        </a>
        <a 
          href="https://github.com/extreme-coder/etyma" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{
            color: 'black',
            textDecoration: 'none',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={(e) => e.target.style.opacity = '0.6'}
          onMouseOut={(e) => e.target.style.opacity = '1'}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
          </svg>
        </a>
      </div>
    </div>
  )
}

export default App