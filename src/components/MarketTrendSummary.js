import React from 'react';

const MarketTrendSummary = ({ cryptoData }) => {
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
  const positiveCount = cryptoData.filter(crypto => (crypto.MOVING_24_HOUR_CHANGE_PERCENTAGE || 0) > 0).length;
  const negativeCount = cryptoData.filter(crypto => (crypto.MOVING_24_HOUR_CHANGE_PERCENTAGE || 0) < 0).length;
  const neutralCount = cryptoData.length - positiveCount - negativeCount;

  // Determine overall market sentiment
  let marketSentiment = 'neutral';
  let sentimentIcon = '●';
  let sentimentColor = 'neutral';
  
  if (averageChange > 2) {
    marketSentiment = 'bullish';
    sentimentIcon = '🚀';
    sentimentColor = 'positive';
  } else if (averageChange > 0.5) {
    marketSentiment = 'positive';
    sentimentIcon = '▲';
    sentimentColor = 'positive';
  } else if (averageChange < -2) {
    marketSentiment = 'bearish';
    sentimentIcon = '📉';
    sentimentColor = 'negative';
  } else if (averageChange < -0.5) {
    marketSentiment = 'negative';
    sentimentIcon = '▼';
    sentimentColor = 'negative';
  }

  return (
    <div className="market-trend-summary">
      <h3>Market Trend</h3>
      <div className="trend-overview">
        <div className="sentiment-indicator">
          <span className={`sentiment-icon ${sentimentColor}`}>
            {sentimentIcon}
          </span>
          <div className="sentiment-details">
            <div className="sentiment-label">{marketSentiment.toUpperCase()}</div>
            <div className={`sentiment-change ${sentimentColor}`}>
              {averageChange >= 0 ? '+' : ''}{averageChange.toFixed(2)}%
            </div>
          </div>
        </div>
        
        <div className="trend-breakdown">
          <div className="trend-stat">
            <span className="stat-label">Gainers:</span>
            <span className="stat-value positive">{positiveCount}</span>
          </div>
          <div className="trend-stat">
            <span className="stat-label">Losers:</span>
            <span className="stat-value negative">{negativeCount}</span>
          </div>
          <div className="trend-stat">
            <span className="stat-label">Neutral:</span>
            <span className="stat-value neutral">{neutralCount}</span>
          </div>
        </div>
      </div>
      
      <div className="market-summary-text">
        {marketSentiment === 'bullish' && 'Market is strongly bullish with significant gains across cryptocurrencies.'}
        {marketSentiment === 'positive' && 'Market sentiment is positive with moderate gains.'}
        {marketSentiment === 'neutral' && 'Market is showing mixed or neutral sentiment.'}
        {marketSentiment === 'negative' && 'Market sentiment is negative with moderate declines.'}
        {marketSentiment === 'bearish' && 'Market is bearish with significant declines across cryptocurrencies.'}
      </div>
    </div>
  );
};

export default MarketTrendSummary;
