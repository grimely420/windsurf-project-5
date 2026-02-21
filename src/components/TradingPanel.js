import React, { useState } from 'react';
import PropTypes from 'prop-types';

const TradingPanel = ({ crypto, onTrade, balance, initialTradeType = 'buy' }) => {
  const [tradeType, setTradeType] = useState(initialTradeType);
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const currentPrice = parseFloat(crypto.PRICE || 0);
  const symbol = crypto.BASE;

  const calculateTotal = () => {
    if (!amount) return 0;
    const tradeAmount = parseFloat(amount);
    if (orderType === 'market') {
      return tradeAmount * currentPrice;
    } else {
      return tradeAmount * parseFloat(limitPrice || currentPrice);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const tradeData = {
        symbol,
        type: tradeType,
        orderType,
        amount: parseFloat(amount),
        price: orderType === 'limit' ? parseFloat(limitPrice) : currentPrice,
        total: calculateTotal()
      };

      console.log('Executing trade:', tradeData);
      
      await onTrade(tradeData);
      
      // Reset form on success
      setAmount('');
      setLimitPrice('');
      
      // Show success message
      alert(`${tradeType === 'buy' ? 'Buy' : 'Sell'} order placed successfully!`);
      
    } catch (error) {
      console.error('Trade failed:', error);
      alert(`Trade failed: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const quickAmounts = [25, 50, 100, 250, 500];

  return (
    <div className="trading-panel">
      <div className="trading-header">
        <h4>Trade {symbol}</h4>
        <div className="current-price">
          ${currentPrice.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
      </div>

      <div className="trade-type-toggle">
        <button
          className={`toggle-btn ${tradeType === 'buy' ? 'buy' : ''}`}
          onClick={() => setTradeType('buy')}
        >
          Buy
        </button>
        <button
          className={`toggle-btn ${tradeType === 'sell' ? 'sell' : ''}`}
          onClick={() => setTradeType('sell')}
        >
          Sell
        </button>
      </div>

      <form onSubmit={handleSubmit} className="trade-form">
        <div className="form-group">
          <label>Order Type</label>
          <select value={orderType} onChange={(e) => setOrderType(e.target.value)}>
            <option value="market">Market Order</option>
            <option value="limit">Limit Order</option>
          </select>
        </div>

        <div className="form-group">
          <label>Amount ({symbol})</label>
          <input
            type="number"
            step="0.00000001"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
          <div className="quick-amounts">
            {quickAmounts.map(quickAmount => (
              <button
                key={quickAmount}
                type="button"
                className="quick-amount-btn"
                onClick={() => setAmount((quickAmount / currentPrice).toFixed(8))}
              >
                ${quickAmount}
              </button>
            ))}
          </div>
        </div>

        {orderType === 'limit' && (
          <div className="form-group">
            <label>Limit Price ($)</label>
            <input
              type="number"
              step="0.01"
              value={limitPrice}
              onChange={(e) => setLimitPrice(e.target.value)}
              placeholder={currentPrice.toFixed(2)}
              required
            />
          </div>
        )}

        <div className="trade-summary">
          <div className="summary-row">
            <span>Total:</span>
            <span className="total-amount">
              ${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {balance && (
            <div className="summary-row">
              <span>Available Balance:</span>
              <span>${balance.toLocaleString()}</span>
            </div>
          )}
        </div>

        <button
          type="submit"
          className={`trade-btn ${tradeType}`}
          disabled={isLoading || !amount}
        >
          {isLoading ? 'Processing...' : `${tradeType === 'buy' ? 'Buy' : 'Sell'} ${symbol}`}
        </button>
        
        <button
          type="button"
          className="mock-trade-btn"
          onClick={() => {
            const mockTrade = {
              symbol,
              type: tradeType,
              orderType,
              amount: amount || '0.001',
              price: orderType === 'limit' ? limitPrice : currentPrice,
              total: calculateTotal() || (currentPrice * 0.001)
            };
            console.log('🧪 MOCK TRADE:', mockTrade);
            alert(`🧪 Mock ${tradeType} order:\n${mockTrade.amount} ${symbol} @ $${mockTrade.price}\nTotal: $${mockTrade.total.toFixed(2)}`);
          }}
        >
          🧪 Mock Test
        </button>
      </form>
    </div>
  );
};

TradingPanel.propTypes = {
  crypto: PropTypes.shape({
    BASE: PropTypes.string.isRequired,
    PRICE: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  }).isRequired,
  onTrade: PropTypes.func.isRequired,
  balance: PropTypes.number,
  initialTradeType: PropTypes.oneOf(['buy', 'sell']),
};

TradingPanel.defaultProps = {
  balance: 0,
  initialTradeType: 'buy',
};

export default TradingPanel;
