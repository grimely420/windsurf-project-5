import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import BinanceService from '../services/BinanceService';

const ExchangeManager = ({ isOpen, onClose, onExchangeSelect }) => {
  const [selectedExchange, setSelectedExchange] = useState('coinbase');
  const [exchangeStatus, setExchangeStatus] = useState({});
  const [bestPrices, setBestPrices] = useState({});

  const exchanges = [
    {
      id: 'coinbase',
      name: 'Coinbase Pro',
      icon: '🔵',
      description: 'US-based exchange, good for beginners',
      features: ['Spot Trading', 'API Access', 'USD Pairs'],
      status: 'active',
      color: '#0052FF'
    },
    {
      id: 'binance',
      name: 'Binance',
      icon: '🟡',
      description: 'Largest global exchange, low fees',
      features: ['Spot Trading', 'Futures', 'API Access', '500+ Pairs'],
      status: 'active',
      color: '#F3BA2F'
    },
    {
      id: 'kraken',
      name: 'Kraken',
      icon: '🐙',
      description: 'Security-focused, EU-based exchange',
      features: ['Spot Trading', 'API Access', 'Margin Trading'],
      status: 'coming-soon',
      color: '#7B0D1E'
    }
  ];

  useEffect(() => {
    if (isOpen) {
      checkExchangeStatus();
      loadBestPrices();
    }
  }, [isOpen]);

  const checkExchangeStatus = async () => {
    const status = {};
    
    // Check Coinbase status
    try {
      const coinbaseResponse = await fetch('https://api.pro.coinbase.com/time');
      if (coinbaseResponse.ok) {
        status.coinbase = 'online';
      } else {
        status.coinbase = 'error';
      }
    } catch (error) {
      status.coinbase = 'unknown';
    }

    // Check Binance status
    try {
      if (BinanceService.validateCredentials()) {
        const binanceTime = await BinanceService.getServerTime();
        status.binance = 'online';
      } else {
        status.binance = 'no-credentials';
      }
    } catch (error) {
      status.binance = 'error';
    }

    setExchangeStatus(status);
  };

  const loadBestPrices = async () => {
    try {
      const prices = await BinanceService.getBestPrice('BTCUSDT');
      setBestPrices(prev => ({ ...prev, BTC: prices }));
    } catch (error) {
      console.error('Failed to load best prices:', error);
    }
  };

  const handleExchangeSelect = async (exchange) => {
    setSelectedExchange(exchange.id);
    
    // Validate exchange selection
    if (exchange.status !== 'active') {
      alert(`${exchange.name} is ${exchange.status}. Please try another exchange.`);
      return;
    }

    // Check credentials for selected exchange
    if (exchange.id === 'binance' && !BinanceService.validateCredentials()) {
      alert('Binance API keys not configured. Please add your Binance API keys to continue.');
      return;
    }

    onExchangeSelect(exchange);
    onClose();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return '#10b981';
      case 'error': return '#ef4444';
      case 'no-credentials': return '#f59e0b';
      case 'unknown': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'online': return 'Online';
      case 'error': return 'Error';
      case 'no-credentials': return 'No API Keys';
      case 'unknown': return 'Checking...';
      default: return 'Unknown';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="exchange-manager-overlay">
      <div className="exchange-manager">
        <div className="exchange-manager-header">
          <h3>Select Exchange</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        <div className="exchange-content">
          <div className="exchange-grid">
            {exchanges.map(exchange => (
              <button
                key={exchange.id}
                className={`exchange-option ${selectedExchange === exchange.id ? 'selected' : ''} ${exchange.status}`}
                onClick={() => handleExchangeSelect(exchange)}
                disabled={exchange.status !== 'active'}
              >
                <div className="exchange-icon" style={{ color: exchange.color }}>
                  {exchange.icon}
                </div>
                <div className="exchange-info">
                  <div className="exchange-name">{exchange.name}</div>
                  <div className="exchange-description">{exchange.description}</div>
                  <div className="exchange-features">
                    {exchange.features.map((feature, index) => (
                      <span key={index} className="feature-tag">{feature}</span>
                    ))}
                  </div>
                </div>
                <div className="exchange-status">
                  <div className="status-indicator">
                    <div 
                      className="status-dot" 
                      style={{ backgroundColor: getStatusColor(exchangeStatus[exchange.id]) }}
                    />
                    <span className="status-text">
                      {getStatusText(exchangeStatus[exchange.id])}
                    </span>
                  </div>
                  {exchange.status === 'coming-soon' && (
                    <div className="coming-soon-badge">Coming Soon</div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {Object.keys(bestPrices).length > 0 && (
            <div className="best-prices-section">
              <h4>Best Prices Across Exchanges</h4>
              <div className="price-comparison">
                {Object.entries(bestPrices).map(([symbol, data]) => (
                  <div key={symbol} className="price-item">
                    <div className="price-symbol">{symbol.replace('USDT', '')}</div>
                    <div className="price-details">
                      <div className="exchange-price">
                        <span className="exchange-label">Coinbase:</span>
                        <span className="price-value">${data.coinbase?.price?.toFixed(2) || 'N/A'}</span>
                      </div>
                      <div className="exchange-price">
                        <span className="exchange-label">Binance:</span>
                        <span className="price-value">${data.binance?.price?.toFixed(2) || 'N/A'}</span>
                      </div>
                      {data.difference > 0 && (
                        <div className="price-difference">
                          Best: {data.best === 'binance' ? 'Binance' : 'Coinbase'} 
                          (${Math.abs(data.difference).toFixed(2)})
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ExchangeManager.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onExchangeSelect: PropTypes.func.isRequired,
};

export default ExchangeManager;
