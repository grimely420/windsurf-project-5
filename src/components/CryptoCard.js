import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import SparklineChart from './SparklineChart';

const CryptoCard = ({ crypto, fiveMinuteHistory, getCryptoFullName, onOpenTradeManager }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const tooltipTimeoutRef = useRef(null);
  
  // Memoize expensive calculations
  const symbol = useMemo(() => {
    // Extract just the base symbol (BTC, ETH, BNB) from the API pair
    const baseSymbol = crypto.BASE ? crypto.BASE.split('-')[0] : 'UNKNOWN';
    return baseSymbol;
  }, [crypto.BASE]);
  const fullName = useMemo(() => getCryptoFullName(symbol), [symbol, getCryptoFullName]);
  const currentPrice = useMemo(() => parseFloat(crypto.PRICE || 0), [crypto.PRICE]);
  
  // Memoize formatting functions
  const formatPrice = useCallback((price) => {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`;
    } else {
      return `$${price.toFixed(4)}`;
    }
  }, []);

  const formatVolume = useCallback((volume) => {
    if (volume >= 1000000000) {
      return `$${(volume / 1000000000).toFixed(2)}B`;
    } else if (volume >= 1000000) {
      return `$${(volume / 1000000).toFixed(2)}M`;
    } else if (volume >= 1000) {
      return `$${(volume / 1000).toFixed(2)}K`;
    } else {
      return `$${volume.toFixed(2)}`;
    }
  }, []);

  // Calculate trend directly from data for sparkline (real-time)
  const sparklineTrend = useMemo(() => {
    if (!fiveMinuteHistory || fiveMinuteHistory.length < 2) return 0;
    const sortedHistory = [...fiveMinuteHistory].sort((a, b) => a.timestamp - b.timestamp);
    const oldestPrice = sortedHistory[0].price;
    // Use current price for real-time trend calculation
    return ((currentPrice - oldestPrice) / oldestPrice) * 100;
  }, [fiveMinuteHistory, currentPrice]);

  // Calculate 5-minute change (stable calculation) - Dollar amount
  const [fiveMinuteChange, setFiveMinuteChange] = useState(null);
  
  // Combined effect for all calculations and updates
  useEffect(() => {
    // Debug: Log the data
    console.log('CryptoCard Debug:', {
      symbol,
      currentPrice,
      fiveMinuteHistory: fiveMinuteHistory ? fiveMinuteHistory.length : 0,
      hasHistory: fiveMinuteHistory && fiveMinuteHistory.length > 1
    });
    
    // Update 5-minute change - Dollar amount (simplified)
    if (fiveMinuteHistory && fiveMinuteHistory.length > 1) {
      const sortedHistory = [...fiveMinuteHistory].sort((a, b) => a.timestamp - b.timestamp);
      const oldestPrice = sortedHistory[0].price;
      
      console.log('5-minute calculation:', { oldestPrice, currentPrice });
      
      if (oldestPrice > 0) {
        const dollarChange = currentPrice - oldestPrice;
        const isPositive = dollarChange >= 0;
        
        const newChange = {
          class: isPositive ? 'positive' : 'negative',
          icon: isPositive ? '▲' : '▼',
          text: `${isPositive ? '+' : ''}${formatPrice(Math.abs(dollarChange))}`,
          value: dollarChange
        };
        
        console.log('Setting 5-minute change:', newChange);
        setFiveMinuteChange(newChange);
      }
    } else if (!fiveMinuteChange) {
      // Set neutral with no icon when no history
      console.log('No 5-minute history, setting neutral');
      setFiveMinuteChange({
        class: 'neutral',
        icon: '',
        text: '$0.00',
        value: 0
      });
    }
  }, [currentPrice, fiveMinuteHistory, formatPrice, symbol]);

  const handleTooltip = useCallback((content) => {
    // Clear existing timeout
    if (tooltipTimeoutRef.current) {
      clearTimeout(tooltipTimeoutRef.current);
    }
    
    setTooltipContent(content);
    setShowTooltip(true);
    
    // Set new timeout
    tooltipTimeoutRef.current = setTimeout(() => {
      setShowTooltip(false);
      setTooltipContent('');
    }, 2000);
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="crypto-card">
      <div className="crypto-header">
        <div className="crypto-name">
          <div className="crypto-icon">{symbol.substring(0, 2)}</div>
          <div>
            <div className="crypto-fullname">{fullName}</div>
          </div>
        </div>
      </div>
      
      <div className="crypto-price">
        {formatPrice(currentPrice)}
      </div>
      
      <div className="sparkline-container">
        <SparklineChart 
          data={fiveMinuteHistory} 
          trend={sparklineTrend}
          width={150}
          height={50}
        />
      </div>
      
      <div className="price-change-container">
        <div 
          className={`price-change five-minute ${fiveMinuteChange?.class || 'neutral'}`}
          onMouseEnter={() => handleTooltip(`5-minute change: ${fiveMinuteChange?.text || '$0.00'}`)}
          style={{ cursor: 'help' }}
        >
          <span className="change-label">5m:</span>
          <span className="change-icon">{fiveMinuteChange?.icon}</span>
          <span className="change-text">{fiveMinuteChange?.text}</span>
        </div>
      </div>
      
      <div className="crypto-details">
        <div className="detail-item">
          <span className="detail-label">1d Volume</span>
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
      
      <div className="trading-buttons">
        <button 
          className="trade-btn buy-btn"
          onClick={() => onOpenTradeManager(crypto, 'buy')}
        >
          Buy {symbol}
        </button>
        <button 
          className="trade-btn sell-btn"
          onClick={() => onOpenTradeManager(crypto, 'sell')}
        >
          Sell {symbol}
        </button>
      </div>
      
      {showTooltip && (
        <div className="crypto-tooltip">
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

CryptoCard.propTypes = {
  crypto: PropTypes.shape({
    BASE: PropTypes.string.isRequired,
    PRICE: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    MOVING_24_HOUR_VOLUME: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    MOVING_24_HOUR_CHANGE_PERCENTAGE: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    MOVING_24_HOUR_HIGH: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    MOVING_24_HOUR_LOW: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  fiveMinuteHistory: PropTypes.arrayOf(
    PropTypes.shape({
      price: PropTypes.number.isRequired,
      timestamp: PropTypes.number.isRequired,
    })
  ),
  getCryptoFullName: PropTypes.func.isRequired,
  onOpenTradeManager: PropTypes.func.isRequired,
};

export default CryptoCard;
