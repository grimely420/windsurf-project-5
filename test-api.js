// Simple API test
const API_KEY = 'b25261954a90a07e2ba14216f21bb9d9cc354182be6298904478f0d283095551';
const API_URL = 'https://data-api.coindesk.com/spot/v1/latest/tick';
const INSTRUMENTS = 'BTC-USD,ETH-USD,BNB-USD';

const testUrl = `${API_URL}?market=coinbase&instruments=${INSTRUMENTS}&apply_mapping=true&api_key=${API_KEY}`;

console.log('Testing API with URL:', testUrl.replace(API_KEY, '***'));

fetch(testUrl)
  .then(response => {
    console.log('Response status:', response.status);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('API Response:', data);
    if (data.Data) {
      console.log('✅ API working - Data received:', Object.keys(data.Data));
    } else {
      console.log('❌ API failed - No data received');
    }
  })
  .catch(error => {
    console.error('❌ API Error:', error.message);
  });
