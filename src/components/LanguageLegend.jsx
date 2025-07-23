import { LANGUAGE_COLORS } from '../constants/languages.js'

const LanguageLegend = ({ originStats, showResults }) => {
  if (originStats.length === 0) return null

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
        {originStats.map((stat) => (
          <div key={stat.origin} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '8px 0'
          }}>
            <div 
              style={{ 
                width: '16px',
                height: '16px',
                backgroundColor: LANGUAGE_COLORS[stat.origin] || LANGUAGE_COLORS.Unknown,
                border: '1px solid #d1d5db',
                flexShrink: 0
              }}
            ></div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%'
            }}>
              <span style={{
                fontSize: '0.9rem',
                fontWeight: '400',
                letterSpacing: '0.05em',
                color: '#374151',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {stat.origin}
              </span>
              <span style={{
                fontSize: '0.8rem',
                fontWeight: '300',
                color: '#6b7280',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {stat.percentage}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default LanguageLegend