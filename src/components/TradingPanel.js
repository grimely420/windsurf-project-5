import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

const TradingPanel = ({ crypto, onTrade, balance, initialTradeType = 'buy' }) => {
  // State management with validation
  const [tradeType, setTradeType] = useState(initialTradeType);
  const [amount, setAmount] = useState('');
  const [orderType, setOrderType] = useState('market');
  const [limitPrice, setLimitPrice] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [timeInForce, setTimeInForce] = useState('GTC'); // Good Till Canceled
  
  // Validation and error states
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [tradeHistory, setTradeHistory] = useState([]);
  
  const currentPrice = parseFloat(crypto.PRICE || 0);
  const symbol = crypto.BASE;
  
  // Validation functions
  const validateAmount = useCallback((value) => {
    const num = parseFloat(value);
    if (!value || isNaN(num)) return 'Please enter a valid amount';
    if (num <= 0) return 'Amount must be greater than 0';
    if (num > 1000000) return 'Amount exceeds maximum limit';
    if (balance && num > balance) return `Insufficient balance. Available: ${balance.toFixed(4)}`;
    return null;
  }, [balance]);
  
  const validateLimitPrice = useCallback((value) => {
    if (orderType !== 'limit') return null;
    const num = parseFloat(value);
    if (!value || isNaN(num)) return 'Please enter a valid limit price';
    if (num <= 0) return 'Limit price must be greater than 0';
    if (tradeType === 'buy' && num > currentPrice * 1.1) return 'Limit price too high (max 10% above current)';
    if (tradeType === 'sell' && num < currentPrice * 0.9) return 'Limit price too low (min 90% of current)';
    return null;
  }, [orderType, tradeType, currentPrice]);
  
  const validateStopLoss = useCallback((value) => {
    if (!advancedMode || !value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return 'Please enter a valid stop loss price';
    if (num <= 0) return 'Stop loss must be greater than 0';
    if (tradeType === 'buy' && num >= currentPrice) return 'Stop loss must be below current price for buy orders';
    if (tradeType === 'sell' && num <= currentPrice) return 'Stop loss must be above current price for sell orders';
    return null;
  }, [advancedMode, tradeType, currentPrice]);
  
  const validateTakeProfit = useCallback((value) => {
    if (!advancedMode || !value) return null;
    const num = parseFloat(value);
    if (isNaN(num)) return 'Please enter a valid take profit price';
    if (num <= 0) return 'Take profit must be greater than 0';
    if (tradeType === 'buy' && num <= currentPrice) return 'Take profit must be above current price for buy orders';
    if (tradeType === 'sell' && num >= currentPrice) return 'Take profit must be below current price for sell orders';
    return null;
  }, [advancedMode, tradeType, currentPrice]);

  // Enhanced calculation functions
  const calculateTotal = useCallback(() => {
    if (!amount) return { total: 0, fee: 0, net: 0 };
    const tradeAmount = parseFloat(amount);
    if (isNaN(tradeAmount) || tradeAmount <= 0) return { total: 0, fee: 0, net: 0 };
    
    const price = orderType === 'limit' ? parseFloat(limitPrice) || currentPrice : currentPrice;
    const total = tradeAmount * price;
    const fee = total * 0.001; // 0.1% fee
    const net = tradeType === 'buy' ? total + fee : total - fee;
    
    return { total, fee, net };
  }, [amount, orderType, limitPrice, currentPrice, tradeType]);
  
  const calculateEstimatedSlippage = useCallback(() => {
    if (orderType !== 'market' || !amount) return 0;
    const tradeAmount = parseFloat(amount);
    if (isNaN(tradeAmount) || tradeAmount <= 0) return 0;
    
    // Estimate slippage based on trade size (simplified model)
    const baseSlippage = 0.001; // 0.1% base slippage
    const sizeMultiplier = Math.min(tradeAmount / 1000, 2); // Larger trades have more slippage
    return baseSlippage * sizeMultiplier * 100; // Return as percentage
  }, [amount, orderType]);
  
  const calculateRiskReward = useCallback(() => {
    if (!advancedMode || !amount || !stopLoss || !takeProfit) return null;
    
    const entryPrice = orderType === 'limit' ? parseFloat(limitPrice) || currentPrice : currentPrice;
    const stopLossPrice = parseFloat(stopLoss);
    const takeProfitPrice = parseFloat(takeProfit);
    
    if (tradeType === 'buy') {
      const risk = entryPrice - stopLossPrice;
      const reward = takeProfitPrice - entryPrice;
      return { risk, reward, ratio: reward / risk };
    } else {
      const risk = stopLossPrice - entryPrice;
      const reward = entryPrice - takeProfitPrice;
      return { risk, reward, ratio: reward / risk };
    }
  }, [advancedMode, amount, stopLoss, takeProfit, orderType, limitPrice, currentPrice, tradeType]);

  // Real-time validation effect
  useEffect(() => {
    const newErrors = {};
    
    const amountError = validateAmount(amount);
    if (amountError) newErrors.amount = amountError;
    
    const limitPriceError = validateLimitPrice(limitPrice);
    if (limitPriceError) newErrors.limitPrice = limitPriceError;
    
    const stopLossError = validateStopLoss(stopLoss);
    if (stopLossError) newErrors.stopLoss = stopLossError;
    
    const takeProfitError = validateTakeProfit(takeProfit);
    if (takeProfitError) newErrors.takeProfit = takeProfitError;
    
    setErrors(newErrors);
  }, [amount, limitPrice, stopLoss, takeProfit, validateAmount, validateLimitPrice, validateStopLoss, validateTakeProfit]);

  const calculateEstimatedFee = () => {
    const tradeAmount = parseFloat(amount) || 0;
    const price = orderType === 'limit' ? parseFloat(limitPrice) : currentPrice;
    const total = tradeAmount * price;
    
    // Real trading fees (vary by exchange and volume)
    let feeRate = 0.001; // 0.1% base rate
    if (total > 10000) feeRate = 0.0005; // Lower fee for large trades
    if (total > 100000) feeRate = 0.0002; // Even lower for very large trades
    
    return total * feeRate;
  };

  const calculateRealizedPnL = () => {
    // This would connect to real portfolio data
    // For now, return estimated based on stop loss/take profit
    if (!stopLoss && !takeProfit) return 0;
    
    const entryPrice = currentPrice;
    const stopLossPrice = parseFloat(stopLoss);
    const takeProfitPrice = parseFloat(takeProfit);
    
    if (tradeType === 'buy') {
      if (takeProfitPrice > entryPrice) {
        return takeProfitPrice - entryPrice;
      } else if (stopLossPrice > 0 && stopLossPrice < entryPrice) {
        return stopLossPrice - entryPrice;
      }
    } else { // sell
      if (takeProfitPrice > 0 && takeProfitPrice < entryPrice) {
        return entryPrice - takeProfitPrice;
      } else if (stopLossPrice < entryPrice) {
        return entryPrice - stopLossPrice;
      }
    }
    
    return 0;
  };

  const getEstimatedSlippage = () => {
    // Real slippage estimation based on market conditions
    const baseSlippage = 0.001; // 0.1% base
    if (orderType === 'market') {
      // Higher slippage for market orders in volatile conditions
      return baseSlippage * 1.5;
    }
    return baseSlippage;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous messages
    setSuccessMessage('');
    
    // Validate all fields
    const amountError = validateAmount(amount);
    const limitPriceError = validateLimitPrice(limitPrice);
    const stopLossError = validateStopLoss(stopLoss);
    const takeProfitError = validateTakeProfit(takeProfit);
    
    const newErrors = {};
    if (amountError) newErrors.amount = amountError;
    if (limitPriceError) newErrors.limitPrice = limitPriceError;
    if (stopLossError) newErrors.stopLoss = stopLossError;
    if (takeProfitError) newErrors.takeProfit = takeProfitError;
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setIsLoading(true);
    
    try {
      const tradeData = {
        symbol,
        type: tradeType,
        amount: parseFloat(amount),
        price: orderType === 'limit' ? parseFloat(limitPrice) : currentPrice,
        orderType,
        stopLoss: advancedMode ? parseFloat(stopLoss) || null : null,
        takeProfit: advancedMode ? parseFloat(takeProfit) || null : null,
        timeInForce,
        timestamp: Date.now(),
        estimatedSlippage: calculateEstimatedSlippage(),
        riskReward: calculateRiskReward()
      };
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add to trade history
      const newTrade = {
        ...tradeData,
        id: Date.now(),
        status: 'filled',
        filledPrice: tradeData.price,
        filledAmount: tradeData.amount,
        fee: calculateTotal().fee
      };
      
      setTradeHistory(prev => [newTrade, ...prev.slice(0, 9)]); // Keep last 10 trades
      
      // Call parent handler
      if (onTrade) {
        onTrade(tradeData);
      }
      
      // Show success message
      setSuccessMessage(`${tradeType === 'buy' ? 'Buy' : 'Sell'} order placed successfully!`);
      
      // Reset form
      setAmount('');
      setLimitPrice('');
      setStopLoss('');
      setTakeProfit('');
      setErrors({});
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Real trade failed:', error);
      alert(`❌ Trade failed: ${error.message}`);
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
