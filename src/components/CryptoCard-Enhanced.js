import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import SparklineChart from './SparklineChart';

const CryptoCard = ({ crypto, fiveMinuteHistory, getCryptoFullName, onOpenTradeManager }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const [showTradeManager, setShowTradeManager] = useState(false);
  const [initialTradeType, setInitialTradeType] = useState('buy');
  const [isHovered, setIsHovered] = useState(false);
  const [priceChangeAnimation, setPriceChangeAnimation] = useState('');

  const symbol = crypto.BASE;
  const currentPrice = parseFloat(crypto.PRICE || 0);
  const fullName = getCryptoFullName(symbol);

  // Enhanced 5-minute price change calculation with animation
  const fiveMinuteChange = useMemo(() => {
    if (!fiveMinuteHistory || fiveMinuteHistory.length < 2) {
      return {
        class: 'neutral',
        icon: '',
        text: '$0.00',
        value: 0
      };
    }

    const oldestPrice = fiveMinuteHistory[0].price;
    const newestPrice = fiveMinuteHistory[fiveMinuteHistory.length - 1].price;
    const dollarChange = newestPrice - oldestPrice;
    const isPositive = dollarChange >= 0;
    
    const change = {
      class: isPositive ? 'positive' : 'negative',
      icon: isPositive ? '▲' : '▼',
      text: `${isPositive ? '+' : ''}${formatPrice(Math.abs(dollarChange))}`,
      value: dollarChange
    };

    // Trigger animation
    setPriceChangeAnimation(change.class);
    setTimeout(() => setPriceChangeAnimation(''), 600);

    return change;
  }, [fiveMinuteHistory, currentPrice, formatPrice, symbol]);

  const formatPrice = (price) => {
    if (symbol === 'BTC') {
      return price.toLocaleString('en-US', { minimumFractionDigits: 2 });
    } else if (symbol === 'ETH') {
      return price.toLocaleString('en-US', { minimumFractionDigits: 3 });
    } else {
      return price.toFixed(Math.abs(price) >= 1 ? 2 : 4);
    }
  };

  const handleTooltip = useCallback((content) => {
    setTooltipContent(content);
    setShowTooltip(true);
    
    // Clear existing timeout
    if (window.tooltipTimeout) {
      clearTimeout(window.tooltipTimeout);
    }
    
    // Auto-hide after 3 seconds
    window.tooltipTimeout = setTimeout(() => {
      setShowTooltip(false);
      setTooltipContent('');
    }, 3000);
  }, []);

  const openTrade = useCallback((type) => {
    setInitialTradeType(type);
    setShowTradeManager(true);
  }, []);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <div 
      className={`crypto-card ${isHovered ? 'hovered' : ''} ${priceChangeAnimation}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="crypto-header">
        <div className="crypto-info">
          <div className="crypto-symbol">{symbol}</div>
          <div className="crypto-name">{fullName}</div>
        </div>
        <div className="current-price">
          ${formatPrice(currentPrice)}
        </div>
      </div>

      <div className="price-change-container">
        <div className={`price-change ${fiveMinuteChange.class}`}>
          <span className="change-icon">{fiveMinuteChange.icon}</span>
          <span className="change-text">{fiveMinuteChange.text}</span>
        </div>
        <div className="change-percentage">
          {currentPrice > 0 && (
            <span>
              ({((fiveMinuteChange.value / currentPrice) * 100).toFixed(2)}%)
            </span>
          )}
        </div>
      </div>

      <div className="crypto-chart">
        <SparklineChart 
          data={fiveMinuteHistory.map(item => item.price)}
          width={200}
          height={60}
          color={fiveMinuteChange.class === 'positive' ? '#10b981' : '#ef4444'}
        />
      </div>

      <div className="crypto-stats">
        <div className="stat-item">
          <span className="stat-label">24h Volume</span>
          <span className="stat-value">
            ${(Math.random() * 1000000000).toLocaleString()}
          </span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Market Cap</span>
          <span className="stat-value">
            ${(Math.random() * 50000000000).toLocaleString()}
          </span>
        </div>
      </div>

      <div className="trading-buttons">
        <button 
          className="buy-btn"
          onClick={() => openTrade('buy')}
        >
          Buy {symbol}
        </button>
        <button 
          className="sell-btn"
          onClick={() => openTrade('sell')}
        >
          Sell {symbol}
        </button>
      </div>

      {showTooltip && (
        <div className="crypto-tooltip">
          {tooltipContent}
        </div>
      )}

      <div className="card-glow"></div>
    </div>
  );
};

CryptoCard.propTypes = {
  crypto: PropTypes.shape({
    BASE: PropTypes.string.isRequired,
    PRICE: PropTypes.string.isRequired,
    VOLUME24HOUR: PropTypes.string,
    CHANGE24HOUR: PropTypes.string,
    LOW24HOUR: PropTypes.string,
    HIGH24HOUR: PropTypes.string
  }).isRequired,
  fiveMinuteHistory: PropTypes.arrayOf(
    PropTypes.shape({
      price: PropTypes.number.isRequired,
      timestamp: PropTypes.number.isRequired
    })
  ),
  getCryptoFullName: PropTypes.func.isRequired,
  onOpenTradeManager: PropTypes.func
};

export default CryptoCard;
