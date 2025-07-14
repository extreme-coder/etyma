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
            activeLanguages={activeLanguages}
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
    </div>
  )
}

export default App