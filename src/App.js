import React, { useState, useEffect, useCallback } from 'react';
import CryptoCard from './components/CryptoCard';
import StatusIndicator from './components/StatusIndicator';
import MarketTrendSummary from './components/MarketTrendSummary';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  const [cryptoData, setCryptoData] = useState([]);
  const [previousPrices, setPreviousPrices] = useState({});
  const [fiveMinutePrices, setFiveMinutePrices] = useState({});
  const [status, setStatus] = useState('loading');
  const [statusText, setStatusText] = useState('Loading...');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [abortController, setAbortController] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Constants for magic numbers
  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://data-api.coindesk.com/spot/v1/latest/tick';
  const API_KEY = process.env.REACT_APP_COINDESK_API_KEY;
  const POLLING_INTERVAL = 10000; // 10 seconds
  const FIVE_MINUTES_MS = 300000; // 5 minutes in milliseconds
  const INSTRUMENTS = 'BTC-USD,ETH-USD,BNB-USD';

  const apiUrl = `${API_BASE_URL}?market=coinbase&instruments=${INSTRUMENTS}&apply_mapping=true&api_key=${API_KEY}`;

  // Network status detection
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setStatusText('Connection restored');
      fetchCryptoData();
    };

    const handleOffline = () => {
      setIsOnline(false);
      setStatus('error');
      setStatusText('Offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handlePriceUpdate = useCallback((symbol, price) => {
    setPreviousPrices(prev => ({
      ...prev,
      [symbol]: price
    }));
  }, []);

  const fetchCryptoData = useCallback(async () => {
    // Check if offline
    if (!isOnline) {
      setStatus('error');
      setStatusText('Offline');
      return;
    }

    // Cancel previous request if still pending
    if (abortController) {
      abortController.abort();
    }

    const controller = new AbortController();
    setAbortController(controller);

    try {
      setStatus('loading');
      setStatusText('Fetching data...');
      setError(null);

      const response = await fetch(apiUrl, { signal: controller.signal });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate data structure
      if (!data.Data || typeof data.Data !== 'object') {
        throw new Error('Invalid data format received from API');
      }

      // Convert the Data object to an array for mapping
      const cryptoArray = Object.values(data.Data);
      
      // Validate each crypto object
      const validatedCryptoArray = cryptoArray.filter(crypto => 
        crypto && 
        typeof crypto === 'object' && 
        crypto.BASE && 
        crypto.PRICE && 
        !isNaN(parseFloat(crypto.PRICE))
      );

      if (validatedCryptoArray.length === 0) {
        throw new Error('No valid cryptocurrency data received');
      }

      const currentTime = Date.now();
      
      // Single state update to prevent race conditions
      setCryptoData(validatedCryptoArray);
      
      // Update price history and previous prices in a single batch
      const newHistory = { ...fiveMinutePrices };
      const newPreviousPrices = {};
      
      validatedCryptoArray.forEach(crypto => {
        const symbol = crypto.BASE;
        const currentPrice = parseFloat(crypto.PRICE);
        
        // Update 5-minute price history
        const history = fiveMinutePrices[symbol] || [];
        const newHistoryForSymbol = [...history, { price: currentPrice, timestamp: currentTime }];
        
        // Keep only last 5 minutes of data
        const fiveMinutesAgo = currentTime - FIVE_MINUTES_MS;
        const filteredHistory = newHistoryForSymbol.filter(entry => entry.timestamp > fiveMinutesAgo);
        
        newHistory[symbol] = filteredHistory;
        newPreviousPrices[symbol] = currentPrice;
      });
      
      // Update both states separately to prevent infinite loop
      setFiveMinutePrices(newHistory);
      setPreviousPrices(newPreviousPrices);
      
      setStatus('connected');
      setStatusText('Connected');
      setLastUpdated(new Date());
      
    } catch (error) {
      // Don't show error for aborted requests
      if (error.name !== 'AbortError') {
        console.error('Error fetching crypto data:', error);
        setStatus('error');
        setStatusText(isOnline ? 'Connection failed' : 'Offline');
        setError('Failed to fetch cryptocurrency data. Please check your connection and try again.');
      }
    } finally {
      setAbortController(null);
    }
  }, [isOnline, abortController, apiUrl, FIVE_MINUTES_MS]);

  useEffect(() => {
    fetchCryptoData();
    
    const interval = setInterval(() => {
      fetchCryptoData();
    }, POLLING_INTERVAL);

    return () => {
      clearInterval(interval);
      // Cancel any pending request on cleanup
      if (abortController) {
        abortController.abort();
      }
    };
  }, [fetchCryptoData, POLLING_INTERVAL]);

  const getCryptoFullName = (symbol) => {
    const names = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'BNB': 'Binance Coin'
    };
    return names[symbol] || symbol;
  };

  return (
    <div className="App">
      <div className="container">
        <header>
          <h1>🚀 Crypto Price Tracker</h1>
          <p>Real-time cryptocurrency prices from Coinbase</p>
        </header>
        
        <main>
          <ErrorBoundary>
            <StatusIndicator 
              status={status} 
              statusText={statusText} 
            />
            
            <MarketTrendSummary 
  cryptoData={cryptoData} 
  status={status}
  statusText={statusText}
/>
            
            {error ? (
              <div className="error-message">
                <p>{error}</p>
              </div>
            ) : (
              <div className="crypto-grid">
                {cryptoData.map((crypto, index) => (
                  <ErrorBoundary key={crypto.BASE || index}>
                    <CryptoCard
                      crypto={crypto}
                      previousPrice={previousPrices[crypto.BASE]}
                      fiveMinuteHistory={fiveMinutePrices[crypto.BASE]}
                      onPriceUpdate={handlePriceUpdate}
                      getCryptoFullName={getCryptoFullName}
                    />
                  </ErrorBoundary>
                ))}
              </div>
            )}
            
            <div className="last-updated">
              Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
            </div>
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

export default App;
