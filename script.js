class CryptoTracker {
    constructor() {
        this.apiUrl = 'https://data-api.coindesk.com/spot/v1/latest/tick?market=coinbase&instruments=BTC-USD,ETH-USD,BNB-USD&apply_mapping=true&api_key=b25261954a90a07e2ba14216f21bb9d9cc354182be6298904478f0d283095551';
        this.previousPrices = {};
        this.refreshInterval = 5000; // 5 seconds
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.fetchCryptoData();
        this.startAutoRefresh();
    }

    setupEventListeners() {
        // Add any event listeners here
    }

    async fetchCryptoData() {
        try {
            this.updateStatus('loading', 'Fetching data...');
            
            const response = await fetch(this.apiUrl);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            this.displayCryptoData(data);
            this.updateStatus('connected', 'Connected');
            this.updateLastUpdated();
            
        } catch (error) {
            console.error('Error fetching crypto data:', error);
            this.updateStatus('error', 'Connection failed');
            this.showErrorMessage('Failed to fetch cryptocurrency data. Please check your connection and try again.');
        }
    }

    displayCryptoData(data) {
        const cryptoGrid = document.getElementById('cryptoGrid');
        cryptoGrid.innerHTML = '';

        if (!data.data || !Array.isArray(data.data)) {
            this.showErrorMessage('Invalid data format received from API');
            return;
        }

        data.data.forEach(crypto => {
            const card = this.createCryptoCard(crypto);
            cryptoGrid.appendChild(card);
        });
    }

    createCryptoCard(crypto) {
        const card = document.createElement('div');
        card.className = 'crypto-card';
        
        const symbol = crypto.instrument?.base || 'UNKNOWN';
        const fullName = this.getCryptoFullName(symbol);
        const price = parseFloat(crypto.prices?.last || 0);
        const priceChange = this.calculatePriceChange(symbol, price);
        
        card.innerHTML = `
            <div class="crypto-header">
                <div class="crypto-name">
                    <div class="crypto-icon">${symbol.substring(0, 2)}</div>
                    <div>
                        <div class="crypto-symbol">${symbol}</div>
                        <div class="crypto-fullname">${fullName}</div>
                    </div>
                </div>
            </div>
            
            <div class="crypto-price">
                ${this.formatPrice(price)}
            </div>
            
            <div class="price-change ${priceChange.class}">
                ${priceChange.icon} ${priceChange.text}
            </div>
            
            <div class="crypto-details">
                <div class="detail-item">
                    <span class="detail-label">24h Volume</span>
                    <span class="detail-value">${this.formatVolume(crypto.prices?.volume_24h || 0)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">Market Cap</span>
                    <span class="detail-value">${this.formatMarketCap(crypto.prices?.market_cap || 0)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">24h High</span>
                    <span class="detail-value">${this.formatPrice(crypto.prices?.high_24h || 0)}</span>
                </div>
                <div class="detail-item">
                    <span class="detail-label">24h Low</span>
                    <span class="detail-value">${this.formatPrice(crypto.prices?.low_24h || 0)}</span>
                </div>
            </div>
        `;
        
        // Store current price for next comparison
        this.previousPrices[symbol] = price;
        
        return card;
    }

    calculatePriceChange(symbol, currentPrice) {
        const previousPrice = this.previousPrices[symbol];
        
        if (!previousPrice || previousPrice === currentPrice) {
            return {
                class: 'neutral',
                icon: '→',
                text: '0.00%',
                value: 0
            };
        }
        
        const change = ((currentPrice - previousPrice) / previousPrice) * 100;
        const isPositive = change >= 0;
        
        return {
            class: isPositive ? 'positive' : 'negative',
            icon: isPositive ? '↑' : '↓',
            text: `${isPositive ? '+' : ''}${change.toFixed(2)}%`,
            value: change
        };
    }

    formatPrice(price) {
        if (price >= 1000) {
            return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        } else if (price >= 1) {
            return `$${price.toFixed(2)}`;
        } else {
            return `$${price.toFixed(4)}`;
        }
    }

    formatVolume(volume) {
        if (volume >= 1000000000) {
            return `$${(volume / 1000000000).toFixed(2)}B`;
        } else if (volume >= 1000000) {
            return `$${(volume / 1000000).toFixed(2)}M`;
        } else if (volume >= 1000) {
            return `$${(volume / 1000).toFixed(2)}K`;
        } else {
            return `$${volume.toFixed(2)}`;
        }
    }

    formatMarketCap(marketCap) {
        return this.formatVolume(marketCap);
    }

    getCryptoFullName(symbol) {
        const names = {
            'BTC': 'Bitcoin',
            'ETH': 'Ethereum',
            'BNB': 'Binance Coin'
        };
        return names[symbol] || symbol;
    }

    updateStatus(status, text) {
        const statusDot = document.querySelector('.status-dot');
        const statusText = document.querySelector('.status-text');
        
        statusDot.className = `status-dot ${status}`;
        statusText.textContent = text;
    }

    updateLastUpdated() {
        const lastUpdatedElement = document.getElementById('lastUpdated');
        const now = new Date();
        lastUpdatedElement.textContent = now.toLocaleTimeString();
    }

    showErrorMessage(message) {
        const cryptoGrid = document.getElementById('cryptoGrid');
        cryptoGrid.innerHTML = `
            <div class="error-message">
                <p>${message}</p>
            </div>
        `;
    }

    startAutoRefresh() {
        setInterval(() => {
            this.fetchCryptoData();
        }, this.refreshInterval);
    }
}

// Initialize the crypto tracker when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CryptoTracker();
});

// Add some visual feedback for price changes
document.addEventListener('DOMContentLoaded', () => {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1 && node.classList.contains('price-change')) {
                        // Add a brief animation when price changes
                        node.style.animation = 'pulse 0.5s ease';
                        setTimeout(() => {
                            node.style.animation = '';
                        }, 500);
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
});
