import React, { useState, useEffect } from 'react';
import CryptoCard from './components/CryptoCard';
import MarketTrendSummary from './components/MarketTrendSummary';
import TradeManager from './components/TradeManager';
import WalletManager from './components/WalletManager';
import TechnicalIndicators from './components/TechnicalIndicators';
import ExchangeManager from './components/ExchangeManager';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';
import './Trading.css';

function App() {
  const [cryptoData, setCryptoData] = useState([]);
  const [fiveMinutePrices, setFiveMinutePrices] = useState({});
  const [status, setStatus] = useState('loading');
  const [statusText, setStatusText] = useState('Loading...');
  const [error, setError] = useState(null);
  const [lastApiCall, setLastApiCall] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [tradeManager, setTradeManager] = useState({ isOpen: false, crypto: null, initialType: 'buy' });
  const [walletManager, setWalletManager] = useState({ isOpen: false });
  const [connectedWallet, setConnectedWallet] = useState(null);
  const [exchangeManager, setExchangeManager] = useState({ isOpen: false });
  const [selectedExchange, setSelectedExchange] = useState('coinbase');
  const [fiveMinuteHistory, setFiveMinuteHistory] = useState({});

  // Enhanced API configuration
  const API_CONFIG = {
    BASE_URL: process.env.REACT_APP_API_BASE_URL || 'https://data-api.coindesk.com/spot/v1/latest/tick?market=coinbase&instruments=BTC-USD,ETH-USD,BNB-USD&apply_mapping=true&groups=ID,VALUE,LAST_UPDATE,MOVING_7_DAY,MOVING_24_HOUR&api_key=b25261954a90a07e2ba14216f21bb9d9cc354182be6298904478f0d283095551',
    API_KEY: process.env.REACT_APP_COINDESK_API_KEY,
    MIN_INTERVAL: 1000,
    MAX_RETRIES: 3,
    RETRY_DELAY: 2000,
    CACHE_DURATION: 30000, // 30 seconds
    TIMEOUT: 10000 // 10 seconds
  };

  // Cache for API responses
  const [apiCache, setApiCache] = useState(new Map());
  const [lastSuccessfulFetch, setLastSuccessfulFetch] = useState(null);

  // Enhanced data fetching with caching and better error handling
  useEffect(() => {
    const fetchData = async () => {
      try {
        const now = Date.now();
        
        // Rate limiting check
        if (now - lastApiCall < API_CONFIG.MIN_INTERVAL) {
          setStatusText('Rate limiting...');
          return;
        }

        // Check cache first
        const cacheKey = 'crypto_data';
        const cachedData = apiCache.get(cacheKey);
        if (cachedData && (now - cachedData.timestamp) < API_CONFIG.CACHE_DURATION) {
          console.log('Using cached data');
          setCryptoData(cachedData.data);
          setStatus('success');
          setStatusText('Live (cached)');
          setLastUpdateTime(new Date(cachedData.timestamp));
          return;
        }

        setStatus('loading');
        setStatusText('Fetching fresh data...');
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT);
        
        if (!API_CONFIG.API_KEY) {
          throw new Error('API key not configured');
        }
        
        // Enhanced API request with better headers and error handling
        const response = await fetch(API_CONFIG.BASE_URL, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'CryptoTracker/1.0',
            ...(API_CONFIG.API_KEY && { 'Authorization': `Bearer ${API_CONFIG.API_KEY}` })
          },
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (!data || !data.data) {
          throw new Error('Invalid API response format');
        }

        // Validate and filter crypto data for new API format
        const validCryptoData = data.data.filter(crypto => {
          return crypto && 
                 typeof crypto.ID === 'string' && 
                 typeof crypto.VALUE === 'string' && 
                 !isNaN(parseFloat(crypto.VALUE));
        });

        if (validCryptoData.length === 0) {
          throw new Error('No valid crypto data received');
        }

        // Transform data to expected format
        const transformedData = validCryptoData.map(crypto => ({
          BASE: crypto.ID.replace('-USD', ''),
          PRICE: crypto.VALUE,
          LAST_UPDATE: crypto.LAST_UPDATE,
          MOVING_7_DAY: crypto.MOVING_7_DAY,
          MOVING_24_HOUR: crypto.MOVING_24_HOUR
        }));

        // Update cache with fresh data
        const newCache = new Map(apiCache);
        newCache.set(cacheKey, {
          data: transformedData,
          timestamp: now
        });
        setApiCache(newCache);
        setLastSuccessfulFetch(now);

        // Update state with validated data
        setCryptoData(transformedData);
        setLastApiCall(now);
        setLastUpdateTime(new Date(now));
        setStatus('success');
        setStatusText('Live');
        setRetryCount(0);
        setError(null);
        
        console.log('Successfully fetched and cached crypto data:', {
          count: transformedData.length,
          timestamp: new Date(now).toISOString()
        });

        // Update 5-minute price history
        setFiveMinuteHistory(prev => {
          const newHistory = { ...prev };
          
          transformedData.forEach(crypto => {
            const symbol = crypto.BASE;
            const currentPrice = parseFloat(crypto.PRICE);
            
            // Update 5-minute price history
            const history = prev[symbol] || [];
            const newHistoryForSymbol = [...history, { price: currentPrice, timestamp: now }];
            
            // Keep only last 5 minutes of data (fix: use >= instead of >)
            const fiveMinutesAgo = now - 300000; // 5 minutes
            const filteredHistory = newHistoryForSymbol.filter(entry => entry.timestamp >= fiveMinutesAgo);
            
            console.log(`5-minute history for ${symbol}:`, {
              currentPrice,
              historyLength: filteredHistory.length,
              oldestPrice: filteredHistory.length > 0 ? filteredHistory[0].price : 'none',
              newestPrice: filteredHistory.length > 0 ? filteredHistory[filteredHistory.length - 1].price : 'none'
            });
            
            newHistory[symbol] = filteredHistory;
          });
          
          return newHistory;
        });
      } catch (error) {
        console.error('API fetch error:', error);
        
        // Handle different error types
        let errorMessage = 'Failed to fetch crypto data';
        
        if (error.name === 'AbortError') {
          errorMessage = 'Request timeout. Please check your connection.';
        } else if (error.message.includes('Failed to fetch')) {
          errorMessage = 'Network error. Please check your internet connection.';
        } else if (error.message.includes('401')) {
          errorMessage = 'Authentication failed. Please check API credentials.';
        } else if (error.message.includes('429')) {
          errorMessage = 'Too many requests. Please wait before trying again.';
        } else if (error.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        }
        
        setError(errorMessage);
        setStatus('error');
        setStatusText('Error');
        
        // Retry logic with exponential backoff
        if (retryCount < API_CONFIG.MAX_RETRIES) {
          setRetryCount(prev => prev + 1);
          const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
          setStatusText(`Retrying in ${backoffDelay/1000}s...`);
          setTimeout(() => fetchData(), backoffDelay);
        } else {
          setStatusText('Max retries reached. Please refresh.');
        }
      }
    };

    // Initial fetch
    fetchData();
    
    // Set up polling with rate limiting
    const interval = setInterval(() => {
      fetchData();
    }, 1000); // Poll every 1 second
    
    return () => clearInterval(interval);
  }, [lastApiCall, retryCount]);

  const getCryptoFullName = (symbol) => {
    const names = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'Binance Coin'
    };
    return names[symbol] || symbol;
  };

  const openTradeManager = (crypto, initialType) => {
    setTradeManager({
      isOpen: true,
      crypto,
      initialType
    });
  };

  const closeTradeManager = () => {
    setTradeManager({
      isOpen: false,
      crypto: null,
      initialType: 'buy'
    });
  };

  const openWalletManager = () => {
    setWalletManager({ isOpen: true });
  };

  const closeWalletManager = () => {
    setWalletManager({ isOpen: false });
  };

  const handleWalletConnect = (wallet) => {
    setConnectedWallet(wallet);
    closeWalletManager();
  };

  const openExchangeManager = () => {
    setExchangeManager({ isOpen: true });
  };

  const closeExchangeManager = () => {
    setExchangeManager({ isOpen: false });
  };

  const handleExchangeSelect = (exchange) => {
    setSelectedExchange(exchange);
    closeExchangeManager();
  };

  return (
    <div className="App">
      <header>
        <div className="header-content">
          <div className="header-text">
            <h1>Crypto Price Tracker</h1>
            <p>Real-time crypto from Coinbase</p>
            {lastUpdateTime && (
              <p className="last-update-time">
                Last update: {lastUpdateTime.toLocaleTimeString()}
              </p>
            )}
          </div>
          <div className="header-actions">
            {connectedWallet ? (
              <div className="wallet-status">
                <span className="wallet-indicator">🔗</span>
                <span className="wallet-address">
                  {connectedWallet.address.slice(0, 6)}...{connectedWallet.address.slice(-4)}
                </span>
                <span className="wallet-balance">
                  {connectedWallet.balance.toFixed(4)} ETH
                </span>
                <button
                  className="wallet-disconnect-btn"
                  onClick={openWalletManager}
                >
                  Manage
                </button>
              </div>
            ) : (
              <div>
                <button
                  className="connect-wallet-btn"
                  onClick={openWalletManager}
                >
                  🔗 Connect Wallet
                </button>
                <button
                  className="exchange-select-btn"
                  onClick={openExchangeManager}
                >
                  🏢 {selectedExchange === 'binance' ? 'Binance' : 'Coinbase'}
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      
      <TradeManager
        crypto={tradeManager.crypto}
        isOpen={tradeManager.isOpen}
        onClose={closeTradeManager}
        initialTradeType={tradeManager.initialType} />
      <WalletManager
        isOpen={walletManager.isOpen}
        onClose={closeWalletManager}
        onWalletConnect={handleWalletConnect} />
      <ExchangeManager
        isOpen={exchangeManager.isOpen}
        onClose={closeExchangeManager}
        onExchangeSelect={handleExchangeSelect} />
      
      <ErrorBoundary>
        <MarketTrendSummary cryptoData={cryptoData} status={status} statusText={statusText} />
      </ErrorBoundary>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="crypto-grid">
        {cryptoData.map((crypto) => (
          <div key={crypto.BASE} className="crypto-card-with-indicators">
            <CryptoCard 
              crypto={crypto} 
              fiveMinuteHistory={fiveMinuteHistory[crypto.BASE] || []}
              getCryptoFullName={getCryptoFullName}
              onOpenTradeManager={openTradeManager}
            />
            <TechnicalIndicators 
              priceHistory={fiveMinuteHistory[crypto.BASE] || []}
              currentPrice={parseFloat(crypto.PRICE)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
