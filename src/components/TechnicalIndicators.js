import React, { useMemo } from 'react';
import PropTypes from 'prop-types';

const TechnicalIndicators = ({ priceHistory, currentPrice }) => {
  // Validate props
  const safeCurrentPrice = useMemo(() => {
    if (typeof currentPrice === 'number' && !isNaN(currentPrice)) {
      return currentPrice;
    }
    console.warn('TechnicalIndicators: Invalid currentPrice', { currentPrice });
    return 0;
  }, [currentPrice]);
  // Calculate RSI (Relative Strength Index)
  const calculateRSI = (prices, period = 14) => {
    if (prices.length < period + 1) return 50;

    let gains = 0;
    let losses = 0;
    
    for (let i = 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) {
        gains += change;
      } else {
        losses -= change;
      }
    }

    const avgGain = gains / period;
    const avgLoss = Math.abs(losses) / period;
    
    if (avgLoss === 0) return 100;
    
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return Math.round(rsi * 100) / 100;
  };

  // Calculate MACD (Moving Average Convergence Divergence)
  const calculateMACD = (prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    if (prices.length < slowPeriod) return { macd: 0, signal: 0, histogram: 0 };

    const calculateEMA = (data, period) => {
      const multiplier = 2 / (period + 1);
      let ema = data[0];
      
      for (let i = 1; i < data.length; i++) {
        ema = (data[i] * multiplier) + (ema * (1 - multiplier));
      }
      
      return ema;
    };

    const fastEMA = calculateEMA(prices, fastPeriod);
    const slowEMA = calculateEMA(prices, slowPeriod);
    
    const macdLine = fastEMA.map((val, i) => val - slowEMA[i]);
    const signalLine = calculateEMA(macdLine, signalPeriod);
    const histogram = macdLine.map((val, i) => val - signalLine[i]);

    return {
      macd: macdLine[macdLine.length - 1] || 0,
      signal: signalLine[signalLine.length - 1] || 0,
      histogram: histogram[histogram.length - 1] || 0
    };
  };

  // Calculate Moving Averages
  const calculateMovingAverages = (prices) => {
    if (prices.length === 0) return { sma20: 0, ema20: 0, sma50: 0, ema50: 0 };

    const calculateSMA = (data, period) => {
      if (data.length < period) return 0;
      const sum = data.slice(-period).reduce((a, b) => a + b, 0);
      return sum / period;
    };

    const calculateEMA = (data, period) => {
      if (data.length < period) return [];
      const multiplier = 2 / (period + 1);
      let ema = data[0];
      
      for (let i = 0; i < data.length; i++) {
        ema = (data[i] * multiplier) + (ema * (1 - multiplier));
      }
      
      return [ema];
    };

    return {
      sma20: calculateSMA(prices, 20),
      ema20: calculateEMA(prices, 20)[0],
      sma50: calculateSMA(prices, 50),
      ema50: calculateEMA(prices, 50)
    };
  };

  // Calculate Bollinger Bands
  const calculateBollingerBands = (prices, period = 20, stdDev = 2) => {
    if (prices.length < period) return { upper: 0, middle: 0, lower: 0 };

    const recentPrices = prices.slice(-period);
    const sma = recentPrices.reduce((a, b) => a + b, 0) / period;
    
    const variance = recentPrices.reduce((sum, price) => {
      return sum + Math.pow(price - sma, 2);
    }, 0) / period;
    
    const standardDeviation = Math.sqrt(variance);
    
    return {
      upper: sma + (standardDeviation * stdDev),
      middle: sma,
      lower: sma - (standardDeviation * stdDev)
    };
  };

  // Get price history from the data with enhanced validation
  const prices = useMemo(() => {
    if (!priceHistory || !Array.isArray(priceHistory) || priceHistory.length === 0) {
      console.warn('TechnicalIndicators: Invalid priceHistory data', { priceHistory });
      return [];
    }
    
    try {
      const validPrices = priceHistory
        .filter(item => item && typeof item.price === 'number' && !isNaN(item.price))
        .map(item => item.price);
      
      if (validPrices.length === 0) {
        console.warn('TechnicalIndicators: No valid prices found in priceHistory');
        return [];
      }
      
      return validPrices.sort((a, b) => a - b);
    } catch (error) {
      console.error('TechnicalIndicators: Error processing priceHistory', error);
      return [];
    }
  }, [priceHistory]);

  // Calculate all indicators with error handling
  const indicators = useMemo(() => {
    if (prices.length === 0) {
      console.warn('TechnicalIndicators: No prices available for calculations');
      return {
        rsi: 50,
        macd: { macd: 0, signal: 0, histogram: 0 },
        movingAverages: { sma20: 0, ema20: 0, sma50: 0, ema50: 0 },
        bollingerBands: { upper: 0, middle: 0, lower: 0 }
      };
    }

    try {
      return {
        rsi: calculateRSI(prices),
        macd: calculateMACD(prices),
        movingAverages: calculateMovingAverages(prices),
        bollingerBands: calculateBollingerBands(prices)
      };
    } catch (error) {
      console.error('TechnicalIndicators: Error calculating indicators', error);
      return {
        rsi: 50,
        macd: { macd: 0, signal: 0, histogram: 0 },
        movingAverages: { sma20: 0, ema20: 0, sma50: 0, ema50: 0 },
        bollingerBands: { upper: 0, middle: 0, lower: 0 }
      };
    }
  }, [prices]);

  // Get signal based on indicators
  const getSignal = () => {
    const { rsi, macd, movingAverages, bollingerBands } = indicators;
    
    let signals = [];

    // RSI signals
    if (rsi < 30) signals.push({ type: 'buy', source: 'RSI', strength: 'strong', text: 'Oversold' });
    else if (rsi > 70) signals.push({ type: 'sell', source: 'RSI', strength: 'strong', text: 'Overbought' });

    // MACD signals
    if (macd.histogram > 0 && macd.macd > macd.signal) {
      signals.push({ type: 'buy', source: 'MACD', strength: 'medium', text: 'Bullish crossover' });
    } else if (macd.histogram < 0 && macd.macd < macd.signal) {
      signals.push({ type: 'sell', source: 'MACD', strength: 'medium', text: 'Bearish crossover' });
    }

    // Moving average signals
    if (movingAverages.ema20 > movingAverages.ema50) {
      signals.push({ type: 'buy', source: 'MA', strength: 'weak', text: 'Golden cross' });
    } else if (movingAverages.ema20 < movingAverages.ema50) {
      signals.push({ type: 'sell', source: 'MA', strength: 'weak', text: 'Death cross' });
    }

    // Bollinger Bands signals
    if (safeCurrentPrice <= bollingerBands.lower) {
      signals.push({ type: 'buy', source: 'BB', strength: 'medium', text: 'Below lower band' });
    } else if (safeCurrentPrice >= bollingerBands.upper) {
      signals.push({ type: 'sell', source: 'BB', strength: 'medium', text: 'Above upper band' });
    }

    return signals;
  };

  const signals = getSignal();

  const getRSIColor = (rsi) => {
    if (rsi < 30) return '#10b981'; // Green - oversold
    if (rsi < 50) return '#22c55e'; // Light green
    if (rsi < 70) return '#f59e0b'; // Orange
    return '#ef4444'; // Red - overbought
  };

  const getMACDColor = (histogram) => {
    if (histogram > 0) return '#10b981'; // Green - bullish
    return '#ef4444'; // Red - bearish
  };

  const getSignalColor = (type) => {
    return type === 'buy' ? '#10b981' : '#ef4444';
  };

  return (
    <div className="technical-indicators">
      <div className="indicators-header">
        <h4>Technical Analysis</h4>
        <div className="current-price-display">
          ${safeCurrentPrice.toFixed(2)}
        </div>
      </div>

      <div className="indicators-grid">
        {/* RSI Indicator */}
        <div className="indicator-card">
          <div className="indicator-header">
            <span className="indicator-title">RSI (14)</span>
            <span 
              className="indicator-value" 
              style={{ color: getRSIColor(indicators.rsi) }}
            >
              {indicators.rsi}
            </span>
          </div>
          <div className="indicator-bar">
            <div className="rsi-scale">
              <div className="rsi-zone oversold">30</div>
              <div className="rsi-zone neutral">50</div>
              <div className="rsi-zone overbought">70</div>
              <div 
                className="rsi-indicator"
                style={{ 
                  left: `${Math.min(Math.max(indicators.rsi, 0), 100)}%`,
                  backgroundColor: getRSIColor(indicators.rsi)
                }}
              />
            </div>
          </div>
        </div>

        {/* MACD Indicator */}
        <div className="indicator-card">
          <div className="indicator-header">
            <span className="indicator-title">MACD (12,26,9)</span>
            <span 
              className="indicator-value"
              style={{ color: getMACDColor(indicators.macd.histogram) }}
            >
              {indicators.macd.histogram > 0 ? '+' : ''}{indicators.macd.histogram.toFixed(4)}
            </span>
          </div>
          <div className="macd-info">
            <div className="macd-line">
              <span>MACD:</span>
              <span>{indicators.macd.macd.toFixed(4)}</span>
            </div>
            <div className="signal-line">
              <span>Signal:</span>
              <span>{indicators.macd.signal.toFixed(4)}</span>
            </div>
          </div>
        </div>

        {/* Moving Averages */}
        <div className="indicator-card">
          <div className="indicator-header">
            <span className="indicator-title">Moving Averages</span>
          </div>
          <div className="ma-info">
            <div className="ma-row">
              <span>SMA 20:</span>
              <span className="ma-value">${indicators.movingAverages.sma20.toFixed(2)}</span>
            </div>
            <div className="ma-row">
              <span>EMA 20:</span>
              <span className="ma-value ema">${indicators.movingAverages.ema20.toFixed(2)}</span>
            </div>
            <div className="ma-row">
              <span>SMA 50:</span>
              <span className="ma-value">${indicators.movingAverages.sma50.toFixed(2)}</span>
            </div>
            <div className="ma-row">
              <span>EMA 50:</span>
              <span className="ma-value ema">${indicators.movingAverages.ema50.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Bollinger Bands */}
        <div className="indicator-card">
          <div className="indicator-header">
            <span className="indicator-title">Bollinger Bands (20,2)</span>
          </div>
          <div className="bb-info">
            <div className="bb-row">
              <span>Upper:</span>
              <span className="bb-value upper">${indicators.bollingerBands.upper.toFixed(2)}</span>
            </div>
            <div className="bb-row">
              <span>Middle:</span>
              <span className="bb-value middle">${indicators.bollingerBands.middle.toFixed(2)}</span>
            </div>
            <div className="bb-row">
              <span>Lower:</span>
              <span className="bb-value lower">${indicators.bollingerBands.lower.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Trading Signals */}
      <div className="signals-section">
        <h4>Trading Signals</h4>
        {signals.length === 0 ? (
          <div className="no-signals">No clear signals</div>
        ) : (
          <div className="signals-list">
            {signals.map((signal, index) => (
              <div 
                key={index} 
                className={`signal-item ${signal.type}`}
                style={{ borderLeftColor: getSignalColor(signal.type) }}
              >
                <div className="signal-header">
                  <span className={`signal-badge ${signal.type}`}>
                    {signal.type.toUpperCase()}
                  </span>
                  <span className="signal-source">{signal.source}</span>
                  <span className="signal-strength">{signal.strength}</span>
                </div>
                <div className="signal-text">{signal.text}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

TechnicalIndicators.propTypes = {
  priceHistory: PropTypes.arrayOf(
    PropTypes.shape({
      price: PropTypes.number.isRequired,
      timestamp: PropTypes.number.isRequired,
    })
  ),
  currentPrice: PropTypes.number
};

TechnicalIndicators.defaultProps = {
  priceHistory: [],
  currentPrice: 0
};

export default TechnicalIndicators;
