import { LANGUAGE_COLORS } from '../constants/languages.js'

const EtymologyChart = ({ originStats, showResults }) => {
  if (originStats.length <= 1) return null

  return (
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
  )
}

export default EtymologyChart