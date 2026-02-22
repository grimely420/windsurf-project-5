import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

const WalletManager = ({ isOpen, onClose, onWalletConnect }) => {
  // Enhanced state management
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [connectionStep, setConnectionStep] = useState('');
  const [walletInfo, setWalletInfo] = useState(null);
  const [supportedNetworks, setSupportedNetworks] = useState([]);
  const [currentNetwork, setCurrentNetwork] = useState(null);

  // Enhanced wallet providers configuration
  const walletProviders = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Most popular browser wallet',
      type: 'browser',
      supportedChains: ['ethereum', 'bsc', 'polygon'],
      downloadUrl: 'https://metamask.io/download/',
      docsUrl: 'https://docs.metamask.io/',
      features: ['swap', 'bridge', 'staking'],
      rating: 4.5
    },
    {
      id: 'trust',
      name: 'Trust Wallet',
      icon: '🛡️',
      description: 'Mobile-first crypto wallet',
      type: 'mobile',
      supportedChains: ['ethereum', 'bsc', 'polygon'],
      downloadUrl: 'https://trustwallet.com/download/',
      docsUrl: 'https://developer.trustwallet.com/',
      features: ['dapp-browser', 'staking', 'nft'],
      rating: 4.3
    },
    {
      id: 'coinbase',
      name: 'Coinbase Wallet',
      icon: '🔵',
      description: 'Simple and secure',
      type: 'hybrid',
      supportedChains: ['ethereum', 'bsc', 'polygon', 'solana'],
      downloadUrl: 'https://www.coinbase.com/wallet',
      docsUrl: 'https://docs.cloud.coinbase.com/',
      features: ['buy-crypto', 'swap', 'staking'],
      rating: 4.4
    },
    {
      id: 'phantom',
      name: 'Phantom',
      icon: '👻',
      description: 'Solana ecosystem wallet',
      type: 'browser',
      supportedChains: ['solana'],
      downloadUrl: 'https://phantom.app/',
      docsUrl: 'https://docs.phantom.app/',
      features: ['solana-dapps', 'nft-gallery', 'staking'],
      rating: 4.2
    },
    {
      id: 'ledger',
      name: 'Ledger',
      icon: '🔐',
      description: 'Hardware wallet - maximum security',
      type: 'hardware',
      supportedChains: ['ethereum', 'bsc', 'polygon', 'solana'],
      downloadUrl: 'https://www.ledger.com/',
      docsUrl: 'https://docs.ledger.com/',
      features: ['hardware-security', 'multi-chain', 'backup'],
      rating: 4.7
    }
  ];

  useEffect(() => {
    // Load saved wallets from localStorage
    const savedWallets = localStorage.getItem('connectedWallets');
    if (savedWallets) {
      setWallets(JSON.parse(savedWallets));
    }
  }, []);

  const connectWallet = async (walletProvider) => {
    setIsConnecting(true);
    setConnectionError('');

    try {
      let walletData;

      switch (walletProvider.id) {
        case 'metamask':
          walletData = await connectMetaMask();
          break;
        case 'trustwallet':
          walletData = await connectTrustWallet();
          break;
        case 'coinbase':
          walletData = await connectCoinbaseWallet();
          break;
        case 'phantom':
          walletData = await connectPhantom();
          break;
        case 'ledger':
          walletData = await connectLedger();
          break;
        default:
          throw new Error('Unsupported wallet provider');
      }
      // Add after line ~100:
      const connectWallet = async (walletProvider) => {
        setIsConnecting(true);
        setConnectionError('');
        setConnectionStep('Connecting...');

        try {
          // MetaMask connection
          if (walletProvider.id === 'metamask') {
            if (typeof window.ethereum !== 'undefined') {
              await window.ethereum.request({ method: 'eth_requestAccounts' });
              const accounts = await window.ethereum.request({ method: 'eth_accounts' });
              if (accounts.length > 0) {
                const walletInfo = {
                  address: accounts[0],
                  provider: walletProvider.name,
                  connected: true,
                  balance: 0 // Will be fetched separately
                };
                setWalletInfo(walletInfo);
                onWalletConnect(walletInfo);
              }
            } else {
              throw new Error('MetaMask not installed');
            }
          }

          // Similar logic for other wallets...

        } catch (error) {
          setConnectionError(error.message);
        } finally {
          setIsConnecting(false);
          setConnectionStep('');
        }
      };
      // Save wallet connection
      const newWallet = {
        ...walletData,
        provider: walletProvider,
        connectedAt: new Date().toISOString()
      };

      const updatedWallets = [...wallets.filter(w => w.address !== walletData.address), newWallet];
      setWallets(updatedWallets);
      localStorage.setItem('connectedWallets', JSON.stringify(updatedWallets));

      setSelectedWallet(newWallet);
      onWalletConnect(newWallet);

    } catch (error) {
      setConnectionError(error.message);
      console.error('Wallet connection error:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  const connectMetaMask = async () => {
    if (typeof window.ethereum === 'undefined') {
      throw new Error('MetaMask is not installed');
    }

    try {
      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      const account = accounts[0];
      const balance = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [account, 'latest']
      });

      return {
        address: account,
        balance: parseInt(balance, 16) / Math.pow(10, 18), // Convert from Wei to ETH
        chainId: await window.ethereum.request({ method: 'eth_chainId' })
      };
    } catch (error) {
      throw new Error(`MetaMask connection failed: ${error.message}`);
    }
  };

  const connectTrustWallet = async () => {
    // Trust Wallet connection logic
    if (typeof window.trustwallet === 'undefined') {
      throw new Error('Trust Wallet is not installed');
    }

    try {
      const accounts = await window.trustwallet.request({
        method: 'eth_requestAccounts'
      });

      return {
        address: accounts[0],
        balance: 0, // Would need to fetch balance
        chainId: await window.trustwallet.request({ method: 'eth_chainId' })
      };
    } catch (error) {
      throw new Error(`Trust Wallet connection failed: ${error.message}`);
    }
  };

  const connectCoinbaseWallet = async () => {
    // Coinbase Wallet connection logic
    if (typeof window.coinbaseWalletExtension === 'undefined') {
      throw new Error('Coinbase Wallet is not installed');
    }

    try {
      const wallet = await window.coinbaseWalletExtension.request({
        method: 'connect',
        params: {}
      });

      return {
        address: wallet[0].address,
        balance: 0, // Would need to fetch balance
        chainId: wallet[0].chainId
      };
    } catch (error) {
      throw new Error(`Coinbase Wallet connection failed: ${error.message}`);
    }
  };

  const connectPhantom = async () => {
    // Phantom wallet connection logic
    if (typeof window.solana === 'undefined' || typeof window.solana.isPhantom === 'undefined') {
      throw new Error('Phantom wallet is not installed');
    }

    try {
      const response = await window.solana.connect();
      return {
        address: response.publicKey.toString(),
        balance: 0, // Would need to fetch SOL balance
        chainId: 'solana-mainnet'
      };
    } catch (error) {
      throw new Error(`Phantom connection failed: ${error.message}`);
    }
  };

  const connectLedger = async () => {
    // Ledger connection logic (simplified)
    throw new Error('Ledger connection requires USB device and Ledger Live');
  };

  const disconnectWallet = (walletAddress) => {
    const updatedWallets = wallets.filter(w => w.address !== walletAddress);
    setWallets(updatedWallets);
    localStorage.setItem('connectedWallets', JSON.stringify(updatedWallets));

    if (selectedWallet?.address === walletAddress) {
      setSelectedWallet(null);
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance, symbol = 'ETH') => {
    return `${balance.toFixed(4)} ${symbol}`;
  };

  if (!isOpen) return null;

  return (
    <div className="wallet-manager-overlay">
      <div className="wallet-manager">
        <div className="wallet-manager-header">
          <h3>Connect Wallet</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {connectionError && (
          <div className="wallet-error">
            {connectionError}
          </div>
        )}

        <div className="wallet-content">
          <div className="wallet-providers">
            <h4>Choose Wallet Provider</h4>
            <div className="wallet-grid">
              {walletProviders.map(provider => (
                <button
                  key={provider.id}
                  className="wallet-option"
                  onClick={() => connectWallet(provider)}
                  disabled={isConnecting}
                >
                  <div className="wallet-icon">{provider.icon}</div>
                  <div className="wallet-info">
                    <div className="wallet-name">{provider.name}</div>
                    <div className="wallet-description">{provider.description}</div>
                  </div>
                  <div className="wallet-type">{provider.type}</div>
                </button>
              ))}
            </div>
          </div>

          {wallets.length > 0 && (
            <div className="connected-wallets">
              <h4>Connected Wallets</h4>
              <div className="wallet-list">
                {wallets.map(wallet => (
                  <div key={wallet.address} className="wallet-item">
                    <div className="wallet-details">
                      <div className="wallet-provider-info">
                        <span className="wallet-icon">{wallet.provider.icon}</span>
                        <span className="wallet-name">{wallet.provider.name}</span>
                      </div>
                      <div className="wallet-address">
                        {formatAddress(wallet.address)}
                      </div>
                      <div className="wallet-balance">
                        {formatBalance(wallet.balance)}
                      </div>
                    </div>
                    <button
                      className="disconnect-btn"
                      onClick={() => disconnectWallet(wallet.address)}
                    >
                      Disconnect
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

WalletManager.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onWalletConnect: PropTypes.func.isRequired,
};

export default WalletManager;
