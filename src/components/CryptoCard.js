import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import SparklineChart from './SparklineChart';

const CryptoCard = ({ crypto, previousPrice, fiveMinuteHistory, onPriceUpdate, getCryptoFullName }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipContent, setTooltipContent] = useState('');
  const tooltipTimeoutRef = useRef(null);
  const lastReportedPriceRef = useRef(null);
  
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

  // Display 24-hour change directly from API
  const priceChange = useMemo(() => {
    if (crypto.MOVING_24_HOUR_CHANGE_PERCENTAGE) {
      const change24h = parseFloat(crypto.MOVING_24_HOUR_CHANGE_PERCENTAGE) || 0;
      const isPositive = change24h >= 0;
      
      return {
        class: isPositive ? 'positive' : 'negative',
        icon: isPositive ? '▲' : '▼',
        text: `${isPositive ? '+' : ''}${change24h.toFixed(2)}%`,
        value: change24h
      };
    }
    
    return {
      class: 'neutral',
      icon: '●',
      text: '0.00%',
      value: 0
    };
  }, [crypto.MOVING_24_HOUR_CHANGE_PERCENTAGE]);

  // Calculate 5-minute change (only calculation we need to do)
  const [fiveMinuteChange, setFiveMinuteChange] = useState(null);
  
  // Combined effect for all calculations and updates
  useEffect(() => {
    // Update 5-minute change
    if (fiveMinuteHistory && fiveMinuteHistory.length > 1) {
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
    } else if (!fiveMinuteChange && (!fiveMinuteHistory || fiveMinuteHistory.length === 0)) {
      setFiveMinuteChange({
        class: 'neutral',
        icon: '●',
        text: '0.00%',
        value: 0
      });
    }

    // Update parent with current price
    if (lastReportedPriceRef.current !== currentPrice) {
      onPriceUpdate(symbol, currentPrice);
      lastReportedPriceRef.current = currentPrice;
    }
  }, [currentPrice, fiveMinuteHistory, symbol, onPriceUpdate]);

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
          <span className="detail-label">7d Volume</span>
          <span className="detail-value">{formatVolume(crypto.MOVING_7_DAY_VOLUME || 0)}</span>
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

CryptoCard.propTypes = {
  crypto: PropTypes.shape({
    BASE: PropTypes.string.isRequired,
    PRICE: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    MOVING_7_DAY_VOLUME: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    MOVING_24_HOUR_CHANGE_PERCENTAGE: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    MOVING_24_HOUR_HIGH: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    MOVING_24_HOUR_LOW: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  }).isRequired,
  previousPrice: PropTypes.number,
  fiveMinuteHistory: PropTypes.arrayOf(
    PropTypes.shape({
      price: PropTypes.number.isRequired,
      timestamp: PropTypes.number.isRequired,
    })
  ),
  onPriceUpdate: PropTypes.func.isRequired,
  getCryptoFullName: PropTypes.func.isRequired,
};

export default CryptoCard;
