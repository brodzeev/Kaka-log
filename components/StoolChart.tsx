'use client'

interface Log {
  id: string
  date: string
  type: string
  time: number
  quantity: 'small' | 'medium' | 'a lot'
  timestamp: string
  memberId: string
}

interface StoolChart {
  logs: Log[]
  primaryColor: string
  secondaryColor: string
  textColor: string
}

export default function StoolChart({ logs, primaryColor, secondaryColor, textColor }: StoolChart) {
  // Get all dates from beginning of month to today
  const today = new Date()
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
  const allDates: Date[] = []
  
  for (let d = new Date(firstDayOfMonth); d <= today; d.setDate(d.getDate() + 1)) {
    allDates.push(new Date(d))
  }

  // Convert to date strings
  const dates = allDates.map(d => d.toDateString())

  // Sort logs by date
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  // Get stool types and include "No Kaki"
  const stoolTypes = ['soft', 'liquid', 'solid', 'const', 'no-kaki']
  
  // Get stool types that have data (or no-kaki if no data for a date)
  const activeStoolTypes = stoolTypes.filter(type => {
    if (type === 'no-kaki') {
      // Check if there are dates with no logs
      return dates.some(date => !logs.some(log => log.date === date))
    }
    return logs.some(log => log.type === type)
  })

  if (activeStoolTypes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className={textColor}>No stool type data available</p>
      </div>
    )
  }

  // Chart dimensions - scale based on number of dates
  const baseChartWidth = 900
  const minDateSpacing = 20
  const chartWidth = Math.max(baseChartWidth, dates.length * minDateSpacing + 200)
  const chartHeight = 400
  const padding = 100
  const plotWidth = chartWidth - padding * 2
  const plotHeight = chartHeight - padding * 2
  const iconSize = 40

  // Color map for stool types
  const colorMap: Record<string, string> = {
    soft: '#3b82f6',
    liquid: '#06b6d4',
    solid: '#8b5cf6',
    const: '#f59e0b',
    'no-kaki': '#9ca3af'
  }

  // Get image path for stool type
  const getImagePath = (type: string) => {
    if (type === 'no-kaki') return '/images/no-kaki.png'
    return `/images/${type}.png`
  }

  // Generate points for scatter plot
  const allPoints = sortedLogs.map((log, index) => {
    const dateIndex = dates.indexOf(log.date)
    const typeIndex = activeStoolTypes.indexOf(log.type)
    
    // X position based on date
    const xPos = padding + (dateIndex / (dates.length - 1 || 1)) * plotWidth
    
    // Y position based on stool type (with jitter for multiple points)
    const baseYPos = padding + (typeIndex / (activeStoolTypes.length - 1 || 1)) * plotHeight
    const jitterAmount = 15
    const jitter = (Math.random() - 0.5) * jitterAmount
    const yPos = baseYPos + jitter

    return (
      <g key={`point-${index}`}>
        <circle
          cx={xPos}
          cy={yPos}
          r="6"
          fill={colorMap[log.type]}
          opacity="0.7"
          stroke={textColor}
          strokeWidth="1"
        />
      </g>
    )
  })

  // Add "no-kaki" points for dates with no logs
  if (activeStoolTypes.includes('no-kaki')) {
    const noKakiTypeIndex = activeStoolTypes.indexOf('no-kaki')
    dates.forEach((date, dateIndex) => {
      if (!logs.some(log => log.date === date)) {
        const xPos = padding + (dateIndex / (dates.length - 1 || 1)) * plotWidth
        const baseYPos = padding + (noKakiTypeIndex / (activeStoolTypes.length - 1 || 1)) * plotHeight
        const jitterAmount = 15
        const jitter = (Math.random() - 0.5) * jitterAmount
        const yPos = baseYPos + jitter

        allPoints.push(
          <g key={`no-kaki-${date}`}>
            <circle
              cx={xPos}
              cy={yPos}
              r="6"
              fill={colorMap['no-kaki']}
              opacity="0.7"
              stroke={textColor}
              strokeWidth="1"
            />
          </g>
        )
      }
    })
  }

  const points = allPoints

  // X-axis labels (dates) - show every 5th date to avoid crowding
  const xLabels = dates.map((date, i) => {
    // Show every 5th date or first and last
    if (i % 5 === 0 || i === dates.length - 1) {
      const xPos = padding + (i / (dates.length - 1 || 1)) * plotWidth
      const dateObj = new Date(date)
      const label = `${dateObj.getMonth() + 1}/${dateObj.getDate()}`
      return (
        <text
          key={`x-label-${i}`}
          x={xPos}
          y={chartHeight - 30}
          textAnchor="middle"
          className="text-xs"
          fill={textColor}
        >
          {label}
        </text>
      )
    }
    return null
  }).filter(Boolean)

  // Y-axis icons (stool types as images or text for "No Kaki")
  const yLabels = activeStoolTypes.map((type, i) => {
    const yPos = padding + (i / (activeStoolTypes.length - 1 || 1)) * plotHeight
    
    if (type === 'no-kaki') {
      return (
        <g key={`y-label-${type}`}>
          <circle
            cx={padding - iconSize / 2 - 15}
            cy={yPos}
            r={iconSize / 2}
            fill={colorMap[type]}
            opacity="0.7"
          />
          <text
            x={padding - iconSize / 2 - 15}
            y={yPos + 5}
            textAnchor="middle"
            className="text-xs font-bold"
            fill={textColor}
            fontSize="10"
          >
            ✗
          </text>
        </g>
      )
    }

    return (
      <g key={`y-label-${type}`}>
        <image
          x={padding - iconSize - 15}
          y={yPos - iconSize / 2}
          width={iconSize}
          height={iconSize}
          href={getImagePath(type)}
          onError={(e) => {
            // Fallback if image fails
            const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
            circle.setAttribute('cx', (padding - iconSize / 2 - 15).toString())
            circle.setAttribute('cy', (yPos).toString())
            circle.setAttribute('r', '15')
            circle.setAttribute('fill', colorMap[type])
          }}
        />
      </g>
    )
  })

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        width="100%"
        height="auto"
        style={{ minHeight: '400px' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Grid lines */}
        {activeStoolTypes.map((_, i) => {
          const yPos = padding + (i / (activeStoolTypes.length - 1 || 1)) * plotHeight
          return (
            <line
              key={`grid-${i}`}
              x1={padding}
              y1={yPos}
              x2={chartWidth - padding}
              y2={yPos}
              stroke={secondaryColor}
              strokeWidth="1"
              strokeDasharray="4"
              opacity="0.3"
            />
          )
        })}

        {/* Axes */}
        <line x1={padding} y1={padding} x2={padding} y2={chartHeight - padding} stroke={textColor} strokeWidth="2" />
        <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke={textColor} strokeWidth="2" />

        {/* X-axis label */}
        <text x={chartWidth / 2} y={chartHeight - 5} textAnchor="middle" className="text-sm font-semibold" fill={textColor}>
          Date
        </text>

        {/* Y-axis icons */}
        {yLabels}

        {/* X-axis labels */}
        {xLabels}

        {/* Points */}
        {points}
      </svg>
    </div>
  )
}
