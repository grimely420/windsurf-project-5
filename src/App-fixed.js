import React, { useState, useEffect } from 'react';
import CryptoCard from './components/CryptoCard';
import StatusIndicator from './components/StatusIndicator';
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

  // Rate limiting: minimum 1 second between API calls
  const MIN_API_INTERVAL = 1000;
  const MAX_RETRIES = 3;

  // Simple API call with rate limiting and retry logic
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Rate limiting check
        const now = Date.now();
        if (now - lastApiCall < MIN_API_INTERVAL) {
          setStatusText('Rate limiting...');
          return;
        }

        setStatus('loading');
        setStatusText('Fetching data...');
        
        const API_KEY = process.env.REACT_APP_COINDESK_API_KEY;
        const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://data-api.coindesk.com/spot/v1/latest/tick';
        
        if (!API_KEY) {
          throw new Error('API key not configured');
        }
        
        const response = await fetch(`${API_BASE_URL}?market=coinbase&instruments=BTC-USD,ETH-USD,BNB-USD&apply_mapping=true&api_key=${API_KEY}`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Validate API response data
        const validateCryptoData = (crypto) => {
          return (
            crypto &&
            typeof crypto === 'object' &&
            typeof crypto.BASE === 'string' &&
            crypto.BASE.trim() !== '' &&
            crypto.PRICE !== undefined &&
            crypto.PRICE !== null &&
            !isNaN(parseFloat(crypto.PRICE)) &&
            parseFloat(crypto.PRICE) > 0
          );
        };

        if (data.Data) {
          const cryptoArray = Object.values(data.Data);
          const validatedCryptoArray = cryptoArray.filter(validateCryptoData);

          const currentTime = Date.now();
          
          // Update crypto data and 5-minute history
          setCryptoData(validatedCryptoArray);
          setLastApiCall(currentTime);
          setLastUpdateTime(new Date(currentTime)); // Set exact update time
          setRetryCount(0); // Reset retry count on success
          
          // Update 5-minute price history
          setFiveMinutePrices(prev => {
            const newHistory = { ...prev };
            
            validatedCryptoArray.forEach(crypto => {
              const symbol = crypto.BASE;
              const currentPrice = parseFloat(crypto.PRICE);
              
              // Update 5-minute price history
              const history = prev[symbol] || [];
              const newHistoryForSymbol = [...history, { price: currentPrice, timestamp: currentTime }];
              
              // Keep only last 5 minutes of data (fix: use >= instead of >)
              const fiveMinutesAgo = currentTime - 300000; // 5 minutes
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
          
          setStatus('connected');
          setStatusText('Connected');
        } else {
          throw new Error('No data received from API');
        }
      } catch (error) {
        console.error('Error fetching crypto data:', error);
        setError(error.message);
        setStatus('error');
        setStatusText(`Error: ${error.message}`);
        
        // Retry logic with exponential backoff
        if (retryCount < MAX_RETRIES) {
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
