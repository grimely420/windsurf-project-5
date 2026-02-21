import React, { useState, useEffect } from 'react';
import TradingPanel from './TradingPanel';
import TradingService from '../services/TradingService';

const TradeManager = ({ crypto, isOpen, onClose, initialTradeType = 'buy' }) => {
  const [balance, setBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [recentTrades, setRecentTrades] = useState([]);

  useEffect(() => {
    if (isOpen) {
      loadBalance();
      loadRecentTrades();
    }
  }, [isOpen, crypto]);

  const loadBalance = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Try to get real balance, fallback to simulated
      try {
        const realBalance = await TradingService.getBalance('coinbase');
        setBalance(realBalance);
      } catch (apiError) {
        console.log('API not available, using simulated balance');
        setBalance(10000); // Default simulated balance
      }
    } catch (error) {
      setError('Failed to load balance');
      console.error('Balance loading error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentTrades = () => {
    // Load from localStorage or API
    const stored = localStorage.getItem(`trades_${crypto.BASE}`);
    if (stored) {
      setRecentTrades(JSON.parse(stored));
    }
  };

  const handleTrade = async (tradeData) => {
    try {
      setError(null);
      
      let result;
      try {
        // Try real trade first
        if (tradeData.orderType === 'market') {
          result = await TradingService.placeMarketOrder(
            'coinbase',
            tradeData.symbol,
            tradeData.type,
            tradeData.amount
          );
        } else {
          result = await TradingService.placeLimitOrder(
            'coinbase',
            tradeData.symbol,
            tradeData.type,
            tradeData.amount,
            tradeData.price
          );
        }
      } catch (apiError) {
        console.log('API trade failed, using simulation');
        // Fallback to simulation
        result = await TradingService.simulateTrade(tradeData);
      }

      // Update recent trades
      const newTrade = {
        ...result,
        timestamp: new Date().toISOString()
      };
      
      const updatedTrades = [newTrade, ...recentTrades.slice(0, 9)]; // Keep last 10
      setRecentTrades(updatedTrades);
      
      // Save to localStorage
      localStorage.setItem(`trades_${crypto.BASE}`, JSON.stringify(updatedTrades));
      
      // Update balance (simulation only)
      if (result.simulated) {
        const newBalance = tradeData.type === 'buy' 
          ? balance - tradeData.total
          : balance + tradeData.total;
        setBalance(Math.max(0, newBalance));
      }

      // Show success message
      alert(`Trade successful! ${tradeData.type === 'buy' ? 'Bought' : 'Sold'} ${tradeData.amount} ${tradeData.symbol}`);
      
    } catch (error) {
      setError(`Trade failed: ${error.message}`);
      console.error('Trade error:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="trade-manager-overlay">
      <div className="trade-manager">
        <div className="trade-manager-header">
          <h3>Trading Panel</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="trade-error">
            {error}
          </div>
        )}

        <div className="trade-content">
          <div className="trading-panel-section">
            <TradingPanel 
              crypto={crypto} 
              onTrade={handleTrade}
              balance={balance}
              initialTradeType={initialTradeType}
            />
          </div>

          <div className="recent-trades-section">
            <h4>Recent Trades</h4>
            {recentTrades.length === 0 ? (
              <p>No recent trades</p>
            ) : (
              <div className="trades-list">
                {recentTrades.map((trade, index) => (
                  <div key={index} className="trade-item">
                    <div className="trade-header">
                      <span className={`trade-type ${trade.type}`}>
                        {trade.type.toUpperCase()}
                      </span>
                      <span className="trade-status">
                        {trade.simulated ? 'SIMULATED' : trade.status}
                      </span>
                    </div>
                    <div className="trade-details">
                      <div>
                        {trade.amount} {trade.symbol} @ ${trade.price}
                      </div>
                      <div className="trade-total">
                        Total: ${trade.total}
                      </div>
                    </div>
                    <div className="trade-time">
                      {new Date(trade.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TradeManager;
