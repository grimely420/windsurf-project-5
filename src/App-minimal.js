import React, { useState, useEffect } from 'react';

function App() {
  const [cryptoData, setCryptoData] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    // Simple API call without any complex state management
    const fetchData = async () => {
      try {
        const response = await fetch('https://data-api.coindesk.com/spot/v1/latest/tick?market=coinbase&instruments=BTC-USD,ETH-USD,BNB-USD&apply_mapping=true&api_key=b25261954a90a07e2ba14216f21bb9d9cc354182be6298904478f0d283095551');
        const data = await response.json();
        
        if (data.Data) {
          const cryptoArray = Object.values(data.Data);
          setCryptoData(cryptoArray);
          setStatus('connected');
          console.log('✅ Minimal app loaded:', cryptoArray.length, 'cryptocurrencies');
        }
      } catch (error) {
        console.error('❌ Minimal app error:', error);
        setStatus('error');
      }
    };

    fetchData();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <header>
        <h1>Crypto Price Tracker</h1>
        <p>Status: {status}</p>
      </header>
      
      <main>
        {cryptoData.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
            {cryptoData.map((crypto, index) => (
              <div key={index} style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '8px' }}>
                <h3>{crypto.BASE}</h3>
                <p>${parseFloat(crypto.PRICE || 0).toFixed(2)}</p>
                <p>24h: {crypto.MOVING_24_HOUR_CHANGE_PERCENTAGE || 0}%</p>
              </div>
            ))}
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </main>
    </div>
  );
}

export default App;
