import React, { useEffect, useState } from 'react';
import SparklineChart from './SparklineChart';

const CryptoCard = ({ crypto, previousPrice, fiveMinuteHistory, onPriceUpdate, getCryptoFullName }) => {
  const [priceChange, setPriceChange] = useState(null);
  const [fiveMinuteChange, setFiveMinuteChange] = useState(null);
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  
  const symbol = crypto.BASE || 'UNKNOWN';
  const fullName = getCryptoFullName(symbol);
  const currentPrice = parseFloat(crypto.PRICE || 0);

  // Handle instant price change
  useEffect(() => {
    if (previousPrice && previousPrice !== currentPrice && previousPrice !== 0) {
      const change = ((currentPrice - previousPrice) / previousPrice) * 100;
      const isPositive = change >= 0;
      
      setPriceChange({
        class: isPositive ? 'positive' : 'negative',
        icon: isPositive ? '▲' : '▼',
        text: `${isPositive ? '+' : ''}${change.toFixed(2)}%`,
        value: change
      });
    } else if (!priceChange) {
      setPriceChange({
        class: 'neutral',
        icon: '●',
        text: '0.00%',
        value: 0
      });
    }
  }, [currentPrice, previousPrice]);

  // Handle 5-minute change
  useEffect(() => {
    if (fiveMinuteHistory && fiveMinuteHistory.length > 1) {
      // Find the oldest price (sort by timestamp to be safe)
      const sortedHistory = [...fiveMinuteHistory].sort((a, b) => a.timestamp - b.timestamp);
      const oldestPrice = sortedHistory[0].price;
      
      if (oldestPrice !== 0) {
        const change = ((currentPrice - oldestPrice) / oldestPrice) * 100;
        const isPositive = change >= 0;
        
        setFiveMinuteChange({
          class: isPositive ? 'positive' : 'negative',
          icon: isPositive ? '▲' : '▼',
          text: `${isPositive ? '+' : ''}${change.toFixed(2)}%`,
          value: change
        });
      }
    } else if (!fiveMinuteChange) {
      setFiveMinuteChange({
        class: 'neutral',
        icon: '●',
        text: '0.00%',
        value: 0
      });
    }
  }, [currentPrice, fiveMinuteHistory]);

  // Update parent with current price
  useEffect(() => {
    onPriceUpdate(symbol, currentPrice);
  }, [currentPrice, symbol, onPriceUpdate]);

  const formatPrice = (price) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  };

  const formatVolume = (volume) => {
    if (volume >= 1000000000) {
      return `$${(volume / 1000000000).toFixed(2)}B`;
    } else if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(2)}K`;
    } else {
      return `$${volume.toFixed(2)}`;
    }
  };

  const handleTooltip = (content) => {
    setTooltipContent(content);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 2000);
  };

  return (
    <div className="crypto-card">
      <div className="crypto-header">
        <div className="crypto-name">
          <div className="crypto-icon">{symbol.substring(0, 2)}</div>
          <div>
            <div className="crypto-symbol">{symbol}</div>
            <div className="crypto-fullname">{fullName}</div>
          </div>
        </div>
        <div className="trend-indicator">
          <span 
            className={`trend-arrow ${priceChange?.class || 'neutral'}`}
            onMouseEnter={() => handleTooltip(`Instant change: ${priceChange?.text || '0.00%'}`)}
            style={{ cursor: 'help' }}
          >
            {priceChange?.icon}
          </span>
        </div>
      </div>
      
      <div className="crypto-price">
        {formatPrice(currentPrice)}
      </div>
      
      <div className="sparkline-container">
        <SparklineChart 
          data={fiveMinuteHistory} 
          trend={fiveMinuteChange?.value || 0}
          width={150}
          height={50}
        />
      </div>
      
      <div className="price-change-container">
        <div 
          className={`price-change ${priceChange?.class || 'neutral'}`}
          onMouseEnter={() => handleTooltip(`Last update: ${priceChange?.text || '0.00%'}`)}
          style={{ cursor: 'help' }}
        >
          <span className="change-icon">{priceChange?.icon}</span>
          <span className="change-text">{priceChange?.text}</span>
        </div>
        <div 
          className={`price-change five-minute ${fiveMinuteChange?.class || 'neutral'}`}
          onMouseEnter={() => handleTooltip(`5-minute trend: ${fiveMinuteChange?.text || '0.00%'}`)}
          style={{ cursor: 'help' }}
        >
          <span className="change-label">5m:</span>
          <span className="change-icon">{fiveMinuteChange?.icon}</span>
          <span className="change-text">{fiveMinuteChange?.text}</span>
        </div>
      </div>
      
      <div className="crypto-details">
        <div className="detail-item">
          <span className="detail-label">24h Volume</span>
          <span className="detail-value">{formatVolume(crypto.MOVING_24_HOUR_VOLUME || 0)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">24h Change</span>
          <span className={`detail-value ${(crypto.MOVING_24_HOUR_CHANGE_PERCENTAGE || 0) >= 0 ? 'positive' : 'negative'}`}>
            {(crypto.MOVING_24_HOUR_CHANGE_PERCENTAGE || 0) >= 0 ? '+' : ''}{(crypto.MOVING_24_HOUR_CHANGE_PERCENTAGE || 0).toFixed(2)}%
          </span>
        </div>
        <div className="detail-item">
          <span className="detail-label">24h High</span>
          <span className="detail-value">{formatPrice(crypto.MOVING_24_HOUR_HIGH || 0)}</span>
        </div>
        <div className="detail-item">
          <span className="detail-label">24h Low</span>
          <span className="detail-value">{formatPrice(crypto.MOVING_24_HOUR_LOW || 0)}</span>
        </div>
      </div>
      
      {showTooltip && (
        <div className="tooltip">
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

export default CryptoCard;
