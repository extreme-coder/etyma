import { LANGUAGE_COLORS } from '../constants/languages.js'

const LanguageLegend = ({ activeLanguages, showResults }) => {
  if (activeLanguages.length === 0) return null

  return (
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
  )
}

export default LanguageLegend