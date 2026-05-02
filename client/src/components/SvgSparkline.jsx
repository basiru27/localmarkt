import React from 'react';

export default function SvgSparkline({ 
  data = [], 
  height = 60, 
  color = '#0B6E4F', // LocalMarkt's primary green
  strokeWidth = 2,
  className = ''
}) {
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

  const values = data.map(d => Number(d.view_count) || 0);

  // Graceful handling of single data point
  if (values.length === 1) {
    return (
      <svg 
        width="100%" 
        height={height} 
        className={`overflow-visible ${className}`} 
        preserveAspectRatio="none"
        aria-label="Sparkline chart showing recent trends"
      >
        {/* Dashed baseline for context */}
        <line x1="0" y1={height / 2} x2="100%" y2={height / 2} stroke={color} strokeWidth={1} strokeDasharray="4 4" opacity="0.3" />
        <circle cx="100%" cy={height / 2} r="4" fill={color} />
      </svg>
    );
  }

  // Calculate dynamic scaling ranges
  const maxVal = Math.max(...values, 1); // Avoid division by zero if all values are 0
  const minVal = Math.min(...values, 0); // Ground the chart at 0 if possible
  const range = (maxVal - minVal) || 1; 

  // Provide a 10% top padding so the highest point doesn't get clipped
  const paddedRange = range * 1.1;

  // Use a virtual viewBox width of 100 for easy percentage mapping
  const width = 100;
  
  // Map data to SVG coordinates
  const points = values.map((val, index) => {
    const x = (index / (values.length - 1)) * width;
    // In SVG, y=0 is the top, so we invert it
    const y = height - ((val - minVal) / paddedRange) * height;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg 
      width="100%" 
      height={height} 
      viewBox={`0 0 ${width} ${height}`} 
      preserveAspectRatio="none"
      className={`overflow-visible ${className}`}
      aria-label="Sparkline chart showing recent trends"
    >
      <defs>
        <linearGradient id="sparkline-gradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      
      {/* The shaded area under the line */}
      <polygon 
        points={`0,${height} ${points} ${width},${height}`} 
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
      
      {/* Draw a subtle dot on the final data point (today) */}
      {values.length > 0 && (
        <circle 
          cx={width} 
          cy={height - ((values[values.length - 1] - minVal) / paddedRange) * height} 
          r="2.5" 
          fill={color} 
        />
      )}
    </svg>
  );
}