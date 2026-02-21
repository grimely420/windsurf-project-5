class BinanceService {
  constructor() {
    this.baseURL = 'https://api.binance.com/api/v3';
    this.apiKey = process.env.REACT_APP_BINANCE_API_KEY;
    this.apiSecret = process.env.REACT_APP_BINANCE_API_SECRET;
  }

  // Get current prices for multiple symbols
  async getTickerPrices(symbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT']) {
    try {
      const symbolParams = symbols.join('%2C');
      const response = await fetch(`${this.baseURL}/ticker/24hr?symbols=${symbolParams}`, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Binance API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform Binance data to match our existing format
      return data.map(ticker => ({
        BASE: ticker.symbol.replace('USDT', ''),
        PRICE: parseFloat(ticker.lastPrice),
        MOVING_24_HOUR_CHANGE_PERCENTAGE: parseFloat(ticker.priceChangePercent),
        MOVING_24_HOUR_HIGH: parseFloat(ticker.highPrice),
        MOVING_24_HOUR_LOW: parseFloat(ticker.lowPrice),
        VOLUME: parseFloat(ticker.volume),
        MOVING_24_HOUR_VOLUME: parseFloat(ticker.volume),
        source: 'binance',
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Binance ticker error:', error);
      throw error;
    }
  }

  // Get order book for a symbol
  async getOrderBook(symbol, limit = 100) {
    try {
      const response = await fetch(`${this.baseURL}/depth?symbol=${symbol}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Binance orderbook error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Binance orderbook error:', error);
      throw error;
    }
  }

  // Get recent trades
  async getRecentTrades(symbol, limit = 500) {
    try {
      const response = await fetch(`${this.baseURL}/aggTrades?symbol=${symbol}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Binance trades error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Binance trades error:', error);
      throw error;
    }
  }

  // Get 24hr ticker statistics
  async get24hrStats(symbol) {
    try {
      const response = await fetch(`${this.baseURL}/ticker/24hr?symbol=${symbol}`, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Binance 24hr stats error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        BASE: data.symbol.replace('USDT', ''),
        PRICE: parseFloat(data.lastPrice),
        MOVING_24_HOUR_CHANGE_PERCENTAGE: parseFloat(data.priceChangePercent),
        MOVING_24_HOUR_HIGH: parseFloat(data.highPrice),
        MOVING_24_HOUR_LOW: parseFloat(data.lowPrice),
        VOLUME: parseFloat(data.volume),
        MOVING_24_HOUR_VOLUME: parseFloat(data.volume),
        openPrice: parseFloat(data.openPrice),
        prevClosePrice: parseFloat(data.prevClosePrice),
        count: parseInt(data.count),
        source: 'binance',
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Binance 24hr stats error:', error);
      throw error;
    }
  }

  // Get Kline/Candlestick data
  async getKlines(symbol, interval = '1m', limit = 500) {
    try {
      const response = await fetch(`${this.baseURL}/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Binance klines error: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Transform kline data to candlestick format
      return data.map(kline => ({
        openTime: kline[0],
        open: parseFloat(kline[1]),
        high: parseFloat(kline[2]),
        low: parseFloat(kline[3]),
        close: parseFloat(kline[4]),
        volume: parseFloat(kline[5]),
        closeTime: kline[6],
        quoteVolume: parseFloat(kline[7]),
        trades: parseInt(kline[8]),
        takerBuyBase: parseFloat(kline[9]),
        takerBuyQuote: parseFloat(kline[10]),
        ignore: kline[11]
      }));
    } catch (error) {
      console.error('Binance klines error:', error);
      throw error;
    }
  }

  // Place a test order (paper trading)
  async placeTestOrder(orderData) {
    try {
      // This is a simulated order for testing
      const order = {
        id: `BINANCE_${Date.now()}`,
        symbol: orderData.symbol,
        side: orderData.side,
        type: orderData.type,
        amount: orderData.amount,
        price: orderData.price,
        status: 'filled',
        filled: orderData.amount,
        remaining: 0,
        average: orderData.price,
        total: orderData.amount * orderData.price,
        timestamp: new Date().toISOString(),
        exchange: 'binance',
        simulated: true
      };

      console.log('🧪 Binance Test Order:', order);
      
      // Simulate order processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return order;
    } catch (error) {
      console.error('Binance order error:', error);
      throw error;
    }
  }

  // Get exchange info
  async getExchangeInfo() {
    try {
      const response = await fetch(`${this.baseURL}/exchangeInfo`, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Binance exchange info error: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Binance exchange info error:', error);
      throw error;
    }
  }

  // Get server time
  async getServerTime() {
    try {
      const response = await fetch(`${this.baseURL}/time`, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Binance server time error: ${response.statusText}`);
      }

      const data = await response.json();
      return new Date(data.serverTime);
    } catch (error) {
      console.error('Binance server time error:', error);
      throw error;
    }
  }

  // Validate API credentials
  validateCredentials() {
    if (!this.apiKey || !this.apiSecret) {
      console.warn('Binance API credentials not configured');
      return false;
    }
    return true;
  }

  // Get symbol info
  async getSymbolInfo(symbol) {
    try {
      const response = await fetch(`${this.baseURL}/exchangeInfo?symbol=${symbol}`, {
        method: 'GET',
        headers: {
          'X-MBX-APIKEY': this.apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Binance symbol info error: ${response.statusText}`);
      }

      const data = await response.json();
      const symbolInfo = data.symbols.find(s => s.symbol === symbol);
      
      return symbolInfo;
    } catch (error) {
      console.error('Binance symbol info error:', error);
      throw error;
    }
  }

  // Calculate trading fees (based on Binance fee structure)
  calculateTradingFee(amount, symbol = 'BTCUSDT') {
    // Binance has a tiered fee structure
    const baseFee = 0.001; // 0.1% base fee
    return amount * baseFee;
  }

  // Get price with multiple exchanges for comparison
  async getBestPrice(symbol) {
    try {
      // Get prices from both exchanges
      const [coinbasePrice, binancePrice] = await Promise.all([
        this.getCoinbasePrice(symbol),
        this.getBinancePrice(symbol)
      ]);

      return {
        symbol,
        coinbase: coinbasePrice,
        binance: binancePrice,
        best: coinbasePrice.price < binancePrice.price ? 'coinbase' : 'binance',
        difference: Math.abs(coinbasePrice.price - binancePrice.price),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Best price comparison error:', error);
      throw error;
    }
  }

  // Helper to get Coinbase price for comparison
  async getCoinbasePrice(symbol) {
    try {
      const response = await fetch(`https://api.coinbase.com/v2/exchange-rates?currency=${symbol}`);
      const data = await response.json();
      return {
        price: data.data.rates[symbol] || 0,
        source: 'coinbase'
      };
    } catch (error) {
      console.error('Coinbase price fetch error:', error);
      return { price: 0, source: 'coinbase' };
    }
  }

  // Helper to get Binance price for comparison
  async getBinancePrice(symbol) {
    try {
      const response = await fetch(`${this.baseURL}/ticker/price?symbol=${symbol}`);
      const data = await response.json();
      return {
        price: parseFloat(data.price),
        source: 'binance'
      };
    } catch (error) {
      console.error('Binance price fetch error:', error);
      return { price: 0, source: 'binance' };
    }
  }
}

export default new BinanceService();
