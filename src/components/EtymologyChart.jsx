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
        <svg width="240" height="240" viewBox="0 0 240 240">
          {(() => {
            let currentAngle = 0
            return originStats.map((stat, index) => {
              const startAngle = currentAngle
              const endAngle = currentAngle + stat.angle
              currentAngle = endAngle
              
              // Convert angles to radians
              const startRad = (startAngle * Math.PI) / 180
              const endRad = (endAngle * Math.PI) / 180
              
              // Calculate arc path (centered at 120, 120 in the 240x240 viewBox)
              const centerX = 120
              const centerY = 120
              const radius = 80
              
              const x1 = centerX + radius * Math.cos(startRad)
              const y1 = centerY + radius * Math.sin(startRad)
              const x2 = centerX + radius * Math.cos(endRad)
              const y2 = centerY + radius * Math.sin(endRad)
              
              const largeArc = stat.angle > 180 ? 1 : 0
              
              const pathData = [
                `M ${centerX} ${centerY}`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
                `Z`
              ].join(' ')
              
              // Calculate text position (outside the chart)
              const midAngle = (startAngle + endAngle) / 2
              const midRad = (midAngle * Math.PI) / 180
              const textX = centerX + 110 * Math.cos(midRad)
              const textY = centerY + 110 * Math.sin(midRad)

              return (
                <g key={index}>
                  <path
                    d={pathData}
                    fill={LANGUAGE_COLORS[stat.origin] || LANGUAGE_COLORS.Unknown}
                    stroke="none"
                    className="pie-slice"
                  />
                  {stat.angle > 15 && ( // Only show percentage if slice is large enough
                    <text
                      x={textX}
                      y={textY}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontSize="11"
                      fontWeight="300"
                      fill={LANGUAGE_COLORS[stat.origin] || LANGUAGE_COLORS.Unknown}
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {stat.percentage}%
                    </text>
                  )}
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