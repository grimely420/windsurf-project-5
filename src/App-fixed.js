import React, { useState, useEffect } from 'react';
import CryptoCard from './components/CryptoCard';
import StatusIndicator from './components/StatusIndicator';
import MarketTrendSummary from './components/MarketTrendSummary';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  const [cryptoData, setCryptoData] = useState([]);
  const [fiveMinutePrices, setFiveMinutePrices] = useState({});
  const [previousPrices, setPreviousPrices] = useState({});
  const [status, setStatus] = useState('loading');
  const [statusText, setStatusText] = useState('Loading...');
  const [error, setError] = useState(null);
  const [lastApiCall, setLastApiCall] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

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
          
          // Update previous prices with current prices before updating
          setPreviousPrices(prev => {
            const newPreviousPrices = { ...prev };
            validatedCryptoArray.forEach(crypto => {
              const symbol = crypto.BASE;
              const currentPrice = parseFloat(crypto.PRICE);
              // Only update if we don't have a previous price yet, or if it's different
              if (!newPreviousPrices[symbol] || newPreviousPrices[symbol] !== currentPrice) {
                newPreviousPrices[symbol] = currentPrice;
              }
            });
            return newPreviousPrices;
          });
          
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
              
              // Keep only last 5 minutes of data
              const fiveMinutesAgo = currentTime - 300000; // 5 minutes
              const filteredHistory = newHistoryForSymbol.filter(entry => entry.timestamp > fiveMinutesAgo);
              
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

  const handlePriceUpdate = (symbol, currentPrice) => {
    // This function will be called by CryptoCard to update previous prices
    // But we're handling this in the main fetch cycle now
  };

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
      <header>
        <h1>Crypto Price Tracker</h1>
        <p>Real-time crypto from Coinbase</p>
        {lastUpdateTime && (
          <p className="last-update-time">
            Last update: {lastUpdateTime.toLocaleTimeString()}
          </p>
        )}
      </header>
      
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
          <ErrorBoundary key={crypto.BASE}>
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
    </div>
  );
}

export default App;
