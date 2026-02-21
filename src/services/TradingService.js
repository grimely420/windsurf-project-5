class TradingService {
  constructor() {
    this.exchanges = {
      coinbase: {
        apiKey: process.env.REACT_APP_COINBASE_API_KEY,
        apiSecret: process.env.REACT_APP_COINBASE_API_SECRET,
        baseUrl: 'https://api.coinbase.com/v2'
      },
      binance: {
        apiKey: process.env.REACT_APP_BINANCE_API_KEY,
        apiSecret: process.env.REACT_APP_BINANCE_API_SECRET,
        baseUrl: 'https://api.binance.com/v3'
      }
    };
  }

  // Validate API credentials
  validateCredentials(exchange) {
    const config = this.exchanges[exchange];
    if (!config || !config.apiKey || !config.apiSecret) {
      throw new Error(`Missing API credentials for ${exchange}`);
    }
    return config;
  }

  // Place a market order
  async placeMarketOrder(exchange, symbol, side, amount) {
    const config = this.validateCredentials(exchange);
    
    try {
      const response = await fetch(`${config.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          symbol: `${symbol}-USD`,
          side,
          type: 'market',
          amount,
          product_id: `${symbol}-USD`
        })
      });

      if (!response.ok) {
        throw new Error(`Order failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Market order error:', error);
      throw error;
    }
  }

  // Place a limit order
  async placeLimitOrder(exchange, symbol, side, amount, price) {
    const config = this.validateCredentials(exchange);
    
    try {
      const response = await fetch(`${config.baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          symbol: `${symbol}-USD`,
          side,
          type: 'limit',
          amount,
          price,
          product_id: `${symbol}-USD`
        })
      });

      if (!response.ok) {
        throw new Error(`Order failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Limit order error:', error);
      throw error;
    }
  }

  // Get account balance
  async getBalance(exchange) {
    const config = this.validateCredentials(exchange);
    
    try {
      const response = await fetch(`${config.baseUrl}/accounts`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get balance: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Calculate total USD balance
      let totalBalance = 0;
      data.data?.forEach(account => {
        if (account.currency === 'USD') {
          totalBalance += parseFloat(account.balance);
        }
      });

      return totalBalance;
    } catch (error) {
      console.error('Balance error:', error);
      throw error;
    }
  }

  // Get order status
  async getOrderStatus(exchange, orderId) {
    const config = this.validateCredentials(exchange);
    
    try {
      const response = await fetch(`${config.baseUrl}/orders/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to get order status: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Order status error:', error);
      throw error;
    }
  }

  // Cancel order
  async cancelOrder(exchange, orderId) {
    const config = this.validateCredentials(exchange);
    
    try {
      const response = await fetch(`${config.baseUrl}/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel order: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Cancel order error:', error);
      throw error;
    }
  }

  // Simulate trade for testing (when no API keys are provided)
  simulateTrade(tradeData) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `SIM_${Date.now()}`,
          status: 'filled',
          symbol: tradeData.symbol,
          type: tradeData.type,
          amount: tradeData.amount,
          price: tradeData.price,
          total: tradeData.total,
          timestamp: new Date().toISOString(),
          simulated: true
        });
      }, 1000); // Simulate 1 second delay
    });
  }
}

export default new TradingService();
