import React from 'react';

const SparklineChart = ({ data, width = 120, height = 40, trend }) => {
  if (!data || data.length < 2) {
    return (
      <div className="sparkline-placeholder" style={{ width, height }}>
        <span>--</span>
      </div>
    );
  }

  const prices = data.map(entry => entry.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice || 1;

  // Create SVG path
  const points = prices.map((price, index) => {
    const x = (index / (prices.length - 1)) * width;
    const y = height - ((price - minPrice) / priceRange) * height;
    return `${x},${y}`;
  }).join(' ');

  const pathData = `M ${points}`;

  // Determine stroke color based on trend
  const getStrokeColor = () => {
    if (trend > 0) return '#10b981'; // green-500
    if (trend < 0) return '#ef4444'; // red-500
    return '#6b7280'; // gray-500
  };

  return (
    <div className="sparkline-chart">
      <svg 
        width={width} 
        height={height} 
        className="sparkline-svg"
        viewBox={`0 0 ${width} ${height}`}
      >
        <path
          d={pathData}
          fill="none"
          stroke={getStrokeColor()}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Add gradient fill for better visualization */}
        <defs>
          <linearGradient id={`gradient-${trend}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop 
              offset="0%" 
              stopColor={getStrokeColor()} 
              stopOpacity="0.3" 
            />
            <stop 
              offset="100%" 
              stopColor={getStrokeColor()} 
              stopOpacity="0.05" 
            />
          </linearGradient>
        </defs>
        <path
          d={`${pathData} L ${width},${height} L 0,${height} Z`}
          fill={`url(#gradient-${trend})`}
          opacity="0.7"
        />
      </svg>
    </div>
  );
};

export default SparklineChart;
