import { LANGUAGE_COLORS } from '../constants/languages.js'

const AnalyzedText = ({ processedWords, showResults }) => {
  if (processedWords.length === 0) return null

  return (
    <div 
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
  )
}

export default AnalyzedText