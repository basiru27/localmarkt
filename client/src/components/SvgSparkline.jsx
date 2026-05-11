import React, { useState } from 'react';

export default function SvgSparkline({ 
  data = [], 
  height = 192, 
  color = '#0B6E4F', // LocalMarkt's primary green
  strokeWidth = 2,
  className = '',
  dataKey = 'view_count',
  labelKey = 'views'
}) {
  const [hoverIndex, setHoverIndex] = useState(null);

  // Graceful handling of empty or missing data
  if (!data || data.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center text-text-muted text-sm bg-gray-50 rounded-lg border border-dashed border-gray-200 ${className}`} 
        style={{ height }}
      >
        No activity yet
      </div>
    );
  }

  const values = data.map(d => Number(d[dataKey]) || 0);
  
  // Calculate dynamic scaling ranges
  const maxVal = Math.max(...values, 1); // Avoid division by zero if all values are 0
  const minVal = Math.min(...values, 0); // Ground the chart at 0 if possible
  const range = (maxVal - minVal) || 1; 

  // Provide a 10% top padding so the highest point doesn't get clipped
  const paddedRange = range * 1.1;

  // Use a fixed width for the viewBox to handle aspect ratio properly
  const width = 600;
  const graphHeight = height - 40; // leave space for x-axis
  const paddingLeft = 30; // space for y-axis labels
  const graphWidth = width - paddingLeft - 20; // leave space on right
  
  // Map data to SVG coordinates
  const getX = (index) => paddingLeft + (index / (values.length - 1 || 1)) * graphWidth;
  const getY = (val) => graphHeight - ((val - minVal) / paddedRange) * graphHeight + 10; // +10 for top padding

  const points = values.map((val, index) => {
    return `${getX(index)},${getY(val)}`;
  }).join(' ');

  const formatDay = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const yTicks = [
    { label: maxVal.toString(), value: maxVal },
    { label: Math.round(minVal + range / 2).toString(), value: minVal + range / 2 },
    { label: minVal.toString(), value: minVal },
  ];

  return (
    <div className="relative w-full" style={{ height }}>
      <svg 
        width="100%" 
        height={height} 
        viewBox={`0 0 ${width} ${height}`} 
        preserveAspectRatio="none"
        className={`overflow-visible ${className}`}
        aria-label="Sparkline chart showing recent trends"
        onMouseLeave={() => setHoverIndex(null)}
      >
        <defs>
          <linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>
        
        {/* Y-axis grid lines & labels */}
        {yTicks.map((tick, i) => {
          const yPos = getY(tick.value);
          return (
            <g key={`y-${i}`}>
              <line x1={paddingLeft} y1={yPos} x2={width - 20} y2={yPos} stroke="#e5e7eb" strokeWidth={1} strokeDasharray="4 4" />
              <text x={paddingLeft - 5} y={yPos + 4} fill="#6b7280" fontSize="12" textAnchor="end">{tick.label}</text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((d, i) => (
          <text 
            key={`x-${i}`} 
            x={getX(i)} 
            y={height - 10} 
            fill="#6b7280" 
            fontSize="12" 
            textAnchor="middle"
          >
            {formatDay(d.day || d.date)}
          </text>
        ))}

        {values.length > 1 && (
          <>
            {/* The shaded area under the line */}
            <polygon 
              points={`${getX(0)},${graphHeight + 10} ${points} ${getX(values.length - 1)},${graphHeight + 10}`} 
              fill="url(#sparkline-gradient)" 
            />
            
            {/* The line itself */}
            <polyline
              fill="none"
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              strokeLinejoin="round"
              points={points}
            />
          </>
        )}

        {/* Interactive points & tooltips */}
        {values.map((val, index) => {
          const cx = getX(index);
          const cy = getY(val);
          const isHovered = hoverIndex === index;
          
          return (
            <g 
              key={`pt-${index}`}
              onMouseEnter={() => setHoverIndex(index)}
              className="cursor-pointer"
            >
              {/* Invisible larger circle for easier hovering */}
              <circle cx={cx} cy={cy} r="20" fill="transparent" />
              {/* Actual point */}
              <circle 
                cx={cx} 
                cy={cy} 
                r={isHovered ? "5" : "3"} 
                fill={isHovered ? "#fff" : color} 
                stroke={color}
                strokeWidth="2"
                className="transition-all duration-200"
              />
              {/* Tooltip Group */}
              {isHovered && (
                <g className="pointer-events-none">
                  <rect 
                    x={cx - 30} 
                    y={cy - 35} 
                    width="60" 
                    height="24" 
                    rx="4" 
                    fill="#1f2937" 
                  />
                  <text 
                    x={cx} 
                    y={cy - 18} 
                    fill="#fff" 
                    fontSize="12" 
                    fontWeight="bold" 
                    textAnchor="middle"
                  >
                    {val} {labelKey}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}