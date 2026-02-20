import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const SparklineChart = ({ data, width = 120, height = 40, trend }) => {
  // Memoize calculations to prevent re-renders
  const chartData = useMemo(() => {
    if (!data || data.length < 2) {
      return null;
    }

    const prices = data.map(entry => entry.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    // Create optimized SVG path
    const points = prices.map((price, index) => {
      const x = (index / (prices.length - 1)) * width;
      const y = height - ((price - minPrice) / priceRange) * height;
      return `${x},${y}`;
    }).join(' ');

    return {
      pathData: `M ${points}`,
      strokeColor: trend > 0 ? '#10b981' : trend < 0 ? '#ef4444' : '#6b7280',
      minPrice,
      maxPrice,
      priceRange,
      prices
    };
  }, [data, trend]);

  if (!chartData) {
    return (
      <div className="sparkline-placeholder" style={{ width, height }}>
        <span>--</span>
      </div>
    );
  }

  const { pathData, strokeColor, minPrice, maxPrice, priceRange, prices } = chartData;

  return (
    <div className="sparkline-chart">
      <svg 
        width={width} 
        height={height} 
        className="sparkline-svg"
        viewBox={`0 0 ${width} ${height}`}
      >
        {/* Main sparkline path */}
        <path
          d={pathData}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        
        {/* Gradient fill */}
        <defs>
          <linearGradient id={`gradient-${trend}`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop 
              offset="0%" 
              stopColor={strokeColor} 
              stopOpacity="0.3" 
            />
            <stop 
              offset="100%" 
              stopColor={strokeColor} 
              stopOpacity="0.05" 
            />
          </linearGradient>
        </defs>
        
        {/* Filled area under the line */}
        <path
          d={`${pathData} L ${width},${height} L 0,${height} Z`}
          fill={`url(#gradient-${trend})`}
          opacity="0.7"
        />
        
        {/* Time markers - show first and last data points */}
        {prices.length > 1 && (
          <>
            {/* Start point */}
            <circle
              cx="0"
              cy={height - ((prices[0] - minPrice) / priceRange) * height}
              r="3"
              fill={strokeColor}
              opacity="0.8"
            />
            
            {/* End point */}
            <circle
              cx={width}
              cy={height - ((prices[prices.length - 1] - minPrice) / priceRange) * height}
              r="3"
              fill={strokeColor}
              opacity="0.8"
            />
            
            {/* Time labels */}
            <text
              x="0"
              y={height + 15}
              fontSize="8"
              fill="#94a3b8"
              textAnchor="middle"
            >
              {new Date(data[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </text>
            
            <text
              x={width}
              y={height + 15}
              fontSize="8"
              fill="#94a3b8"
              textAnchor="middle"
            >
              {new Date(data[data.length - 1].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </text>
          </>
        )}
      </svg>
    </div>
  );
};

SparklineChart.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      price: PropTypes.number.isRequired,
      timestamp: PropTypes.number.isRequired
    })
  ),
  width: PropTypes.number,
  height: PropTypes.number,
  trend: PropTypes.number
};

export default SparklineChart;
