import React from 'react';

const MarketTrendSummary = ({ cryptoData, status, statusText }) => {
  if (!cryptoData || cryptoData.length === 0) {
    return (
      <div className="market-trend-summary">
        <h3>Market Trend</h3>
        <div className="trend-loading">Loading market data...</div>
      </div>
    );
  }

  // Calculate market trend
  const totalChange = cryptoData.reduce((sum, crypto) => {
    return sum + (crypto.MOVING_24_HOUR_CHANGE_PERCENTAGE || 0);
  }, 0);

  const averageChange = totalChange / cryptoData.length;

  // Determine overall market sentiment
  let marketSentiment = 'neutral';
  let sentimentIcon = '●';
  let sentimentColor = 'neutral';
  
  if (averageChange > 2) {
    marketSentiment = 'bullish';
    sentimentIcon = '🚀';
    sentimentColor = 'positive';
  } else if (averageChange < -2) {
    marketSentiment = 'bearish';
    sentimentIcon = '📉';
    sentimentColor = 'negative';
  } else if (averageChange > 0) {
    marketSentiment = 'slightly bullish';
    sentimentIcon = '📈';
    sentimentColor = 'positive';
  } else if (averageChange < 0) {
    marketSentiment = 'slightly bearish';
    sentimentIcon = '📉';
    sentimentColor = 'negative';
  }

  return (
    <div className="market-trend-summary">
      <h3>Market Trend</h3>
      <div className="trend-overview">
        <div className="sentiment-display">
          <span className="sentiment-icon">{sentimentIcon}</span>
          <span className={`sentiment-text ${sentimentColor}`}>
            {marketSentiment.charAt(0).toUpperCase() + marketSentiment.slice(1)}
          </span>
        </div>
        
        <div className="trend-stats">
          <div className="stat-item">
            <span className="stat-label">Avg Change:</span>
            <span className={`stat-value ${sentimentColor}`}>
              {averageChange >= 0 ? '+' : ''}{averageChange.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>
      
      <div className={`status-indicator ${status}`}>
        <span className="status-dot"></span>
        <span className="status-text">{statusText}</span>
      </div>
    </div>
  );
};

export default MarketTrendSummary;
