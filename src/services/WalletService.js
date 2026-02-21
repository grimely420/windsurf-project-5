class WalletService {
  constructor() {
    this.connectedWallets = [];
    this.currentWallet = null;
    this.listeners = [];
    
    // Load saved wallets on initialization
    this.loadSavedWallets();
  }

  // Load saved wallets from localStorage
  loadSavedWallets() {
    try {
      const saved = localStorage.getItem('connectedWallets');
      if (saved) {
        this.connectedWallets = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load saved wallets:', error);
    }
  }

  // Save wallets to localStorage
  saveWallets() {
    try {
      localStorage.setItem('connectedWallets', JSON.stringify(this.connectedWallets));
    } catch (error) {
      console.error('Failed to save wallets:', error);
    }
  }

  // Add event listener
  addEventListener(callback) {
    this.listeners.push(callback);
  }

  // Remove event listener
  removeEventListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners(event, data) {
    this.listeners.forEach(callback => callback(event, data));
  }

  // Connect to MetaMask
  async connectMetaMask() {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed. Please install MetaMask extension.');
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please create an account in MetaMask.');
      }

      const account = accounts[0];
      
      // Get balance
      const balanceWei = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [account, 'latest']
      });

      // Get chain ID
      const chainId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      // Get network info
      const networkId = await window.ethereum.request({
        method: 'eth_chainId'
      });

      const walletData = {
        address: account,
        balance: parseInt(balanceWei, 16) / Math.pow(10, 18), // Convert Wei to ETH
        chainId,
        networkId,
        provider: 'metamask',
        connectedAt: new Date().toISOString()
      };

      // Add to connected wallets
      this.addWallet(walletData);
      
      // Setup event listeners
      this.setupMetaMaskListeners();

      return walletData;
    } catch (error) {
      throw new Error(`MetaMask connection failed: ${error.message}`);
    }
  }

  // Setup MetaMask event listeners
  setupMetaMaskListeners() {
    if (!window.ethereum) return;

    // Account change
    window.ethereum.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnectWallet('metamask');
        this.notifyListeners('walletDisconnected', { provider: 'metamask' });
      } else {
        // Account changed, update current wallet
        const updatedWallet = {
          ...this.currentWallet,
          address: accounts[0]
        };
        this.updateWallet(updatedWallet);
        this.notifyListeners('accountChanged', updatedWallet);
      }
    });

    // Chain change
    window.ethereum.on('chainChanged', (chainId) => {
      if (this.currentWallet && this.currentWallet.provider === 'metamask') {
        const updatedWallet = {
          ...this.currentWallet,
          chainId
        };
        this.updateWallet(updatedWallet);
        this.notifyListeners('chainChanged', updatedWallet);
      }
    });
  }

  // Connect to Trust Wallet
  async connectTrustWallet() {
    if (!window.trustwallet) {
      throw new Error('Trust Wallet is not installed. Please install Trust Wallet extension.');
    }

    try {
      const accounts = await window.trustwallet.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found in Trust Wallet.');
      }

      const account = accounts[0];
      const balanceWei = await window.trustwallet.request({
        method: 'eth_getBalance',
        params: [account, 'latest']
      });

      const chainId = await window.trustwallet.request({
        method: 'eth_chainId'
      });

      const walletData = {
        address: account,
        balance: parseInt(balanceWei, 16) / Math.pow(10, 18),
        chainId,
        provider: 'trustwallet',
        connectedAt: new Date().toISOString()
      };

      this.addWallet(walletData);
      this.setupTrustWalletListeners();

      return walletData;
    } catch (error) {
      throw new Error(`Trust Wallet connection failed: ${error.message}`);
    }
  }

  // Setup Trust Wallet listeners
  setupTrustWalletListeners() {
    if (!window.trustwallet) return;

    window.trustwallet.on('accountsChanged', (accounts) => {
      if (accounts.length === 0) {
        this.disconnectWallet('trustwallet');
      } else {
        const updatedWallet = {
          ...this.currentWallet,
          address: accounts[0]
        };
        this.updateWallet(updatedWallet);
        this.notifyListeners('accountChanged', updatedWallet);
      }
    });
  }

  // Connect to Coinbase Wallet
  async connectCoinbaseWallet() {
    if (!window.coinbaseWalletExtension) {
      throw new Error('Coinbase Wallet is not installed. Please install Coinbase Wallet extension.');
    }

    try {
      const wallet = await window.coinbaseWalletExtension.request({
        method: 'connect',
        params: {}
      });

      if (!wallet || wallet.length === 0) {
        throw new Error('No accounts found in Coinbase Wallet.');
      }

      const account = wallet[0];
      
      const walletData = {
        address: account.address,
        balance: 0, // Would need to fetch balance via API
        chainId: account.chainId,
        provider: 'coinbase',
        connectedAt: new Date().toISOString()
      };

      this.addWallet(walletData);
      return walletData;
    } catch (error) {
      throw new Error(`Coinbase Wallet connection failed: ${error.message}`);
    }
  }

  // Add wallet to connected wallets
  addWallet(walletData) {
    // Remove existing wallet with same address
    this.connectedWallets = this.connectedWallets.filter(
      w => w.address !== walletData.address
    );
    
    // Add new wallet
    this.connectedWallets.push(walletData);
    this.currentWallet = walletData;
    
    this.saveWallets();
    this.notifyListeners('walletConnected', walletData);
  }

  // Update wallet data
  updateWallet(updatedWallet) {
    const index = this.connectedWallets.findIndex(
      w => w.address === updatedWallet.address
    );
    
    if (index !== -1) {
      this.connectedWallets[index] = updatedWallet;
      this.currentWallet = updatedWallet;
      this.saveWallets();
      this.notifyListeners('walletUpdated', updatedWallet);
    }
  }

  // Disconnect wallet
  disconnectWallet(provider) {
    const walletIndex = this.connectedWallets.findIndex(w => w.provider === provider);
    
    if (walletIndex !== -1) {
      const disconnectedWallet = this.connectedWallets[walletIndex];
      this.connectedWallets.splice(walletIndex, 1);
      
      if (this.currentWallet?.provider === provider) {
        this.currentWallet = null;
      }
      
      this.saveWallets();
      this.notifyListeners('walletDisconnected', disconnectedWallet);
    }
  }

  // Get current wallet
  getCurrentWallet() {
    return this.currentWallet;
  }

  // Get all connected wallets
  getConnectedWallets() {
    return this.connectedWallets;
  }

  // Check if wallet is connected
  isWalletConnected(provider) {
    return this.connectedWallets.some(w => w.provider === provider);
  }

  // Get wallet balance
  async getWalletBalance(address) {
    try {
      if (window.ethereum) {
        const balanceWei = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [address, 'latest']
        });
        return parseInt(balanceWei, 16) / Math.pow(10, 18);
      }
      return 0;
    } catch (error) {
      console.error('Failed to get wallet balance:', error);
      return 0;
    }
  }

  // Send transaction
  async sendTransaction(to, amount, gasLimit = '21000') {
    if (!this.currentWallet) {
      throw new Error('No wallet connected');
    }

    try {
      let provider;
      switch (this.currentWallet.provider) {
        case 'metamask':
          provider = window.ethereum;
          break;
        case 'trustwallet':
          provider = window.trustwallet;
          break;
        default:
          throw new Error('Transaction not supported for this wallet provider');
      }

      const transactionParameters = {
        to: to,
        from: this.currentWallet.address,
        value: (amount * Math.pow(10, 18)).toString(16), // Convert ETH to Wei
        gas: gasLimit
      };

      const txHash = await provider.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters]
      });

      return {
        success: true,
        txHash,
        from: this.currentWallet.address,
        to,
        amount,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Get network name from chain ID
  getNetworkName(chainId) {
    const networks = {
      '0x1': 'Ethereum Mainnet',
      '0x3': 'Ropsten Testnet',
      '0x4': 'Rinkeby Testnet',
      '0x5': 'Goerli Testnet',
      '0x38': 'Binance Smart Chain',
      '0x89': 'Binance Smart Chain Testnet',
      '0x137': 'Polygon Mainnet',
      '0x80001': 'Polygon Mumbai Testnet'
    };
    
    return networks[chainId] || 'Unknown Network';
  }

  // Validate address
  isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  // Format address for display
  formatAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }
}

export default new WalletService();
