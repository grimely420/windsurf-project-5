import React, { useState, useEffect, useCallback } from 'react';
import CryptoCard from './components/CryptoCard';
import StatusIndicator from './components/StatusIndicator';
import './App.css';

function App() {
  const [cryptoData, setCryptoData] = useState([]);
  const [previousPrices, setPreviousPrices] = useState({});
  const [fiveMinutePrices, setFiveMinutePrices] = useState({});
  const [status, setStatus] = useState('loading');
  const [statusText, setStatusText] = useState('Loading...');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  const apiUrl = 'https://data-api.coindesk.com/spot/v1/latest/tick?market=coinbase&instruments=BTC-USD,ETH-USD,BNB-USD&apply_mapping=true&api_key=b25261954a90a07e2ba14216f21bb9d9cc354182be6298904478f0d283095551';

  const handlePriceUpdate = useCallback((symbol, price) => {
    setPreviousPrices(prev => ({
      ...prev,
      [symbol]: price
    }));
  }, []);

  const fetchCryptoData = async () => {
    try {
      setStatus('loading');
      setStatusText('Fetching data...');
      setError(null);

      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (!data.Data || typeof data.Data !== 'object') {
        throw new Error('Invalid data format received from API');
      }

      // Convert the Data object to an array for mapping
      const cryptoArray = Object.values(data.Data);
      setCryptoData(cryptoArray);
      
      // Update 5-minute price history
      const currentTime = Date.now();
      cryptoArray.forEach(crypto => {
        const symbol = crypto.BASE;
        const currentPrice = parseFloat(crypto.PRICE);
        
        // Store current price with timestamp
        setFiveMinutePrices(prev => {
          const history = prev[symbol] || [];
          const newHistory = [...history, { price: currentPrice, timestamp: currentTime }];
          
          // Keep only last 5 minutes of data (300,000 ms)
          const fiveMinutesAgo = currentTime - 300000;
          const filteredHistory = newHistory.filter(entry => entry.timestamp > fiveMinutesAgo);
          
          return {
            ...prev,
            [symbol]: filteredHistory
          };
        });
        
        // Update previous price for instant change detection
        setPreviousPrices(prev => ({
          ...prev,
          [symbol]: currentPrice
        }));
      });
      
      setStatus('connected');
      setStatusText('Connected');
      setLastUpdated(new Date());
      
    } catch (error) {
      console.error('Error fetching crypto data:', error);
      setStatus('error');
      setStatusText('Connection failed');
      setError('Failed to fetch cryptocurrency data. Please check your connection and try again.');
    }
  };

  useEffect(() => {
    fetchCryptoData();
    
    const interval = setInterval(() => {
      fetchCryptoData();
    }, 5000); // 5 seconds

    return () => clearInterval(interval);
  }, []);

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
          <StatusIndicator 
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
                <CryptoCard
                  key={crypto.BASE || index}
                  crypto={crypto}
                  previousPrice={previousPrices[crypto.BASE]}
                  fiveMinuteHistory={fiveMinutePrices[crypto.BASE]}
                  onPriceUpdate={handlePriceUpdate}
                  getCryptoFullName={getCryptoFullName}
                />
              ))}
            </div>
          )}
          
          <div className="last-updated">
            Last updated: {lastUpdated ? lastUpdated.toLocaleTimeString() : 'Never'}
          </div>
        </main>
      </div>
    </div>
  );
}

export default App;
