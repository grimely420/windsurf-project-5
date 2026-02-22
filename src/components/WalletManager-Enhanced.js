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

  // Enhanced wallet connection function
  const connectWallet = useCallback(async (walletProvider) => {
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
            
            // Add to connected wallets
            const newWallet = {
              ...walletProvider,
              address: accounts[0],
              connectedAt: Date.now()
            };
            setWallets(prev => [...prev.filter(w => w.address !== accounts[0]), newWallet]);
            localStorage.setItem('connectedWallets', JSON.stringify([...wallets, newWallet]));
          }
        } else {
          throw new Error('MetaMask not installed');
        }
      }
      
      // Trust Wallet connection
      if (walletProvider.id === 'trust') {
        if (window.trustwallet) {
          const accounts = await window.trustwallet.request({ method: 'eth_requestAccounts' });
          if (accounts.length > 0) {
            const walletInfo = {
              address: accounts[0],
              provider: walletProvider.name,
              connected: true,
              balance: 0
            };
            setWalletInfo(walletInfo);
            onWalletConnect(walletInfo);
            
            const newWallet = {
              ...walletProvider,
              address: accounts[0],
              connectedAt: Date.now()
            };
            setWallets(prev => [...prev.filter(w => w.address !== accounts[0]), newWallet]);
            localStorage.setItem('connectedWallets', JSON.stringify([...wallets, newWallet]));
          }
        } else {
          throw new Error('Trust Wallet not available');
        }
      }
      
      // Coinbase Wallet connection
      if (walletProvider.id === 'coinbase') {
        if (window.coinbaseWalletExtension) {
          const accounts = await window.coinbaseWalletExtension.requestAccounts();
          if (accounts.length > 0) {
            const walletInfo = {
              address: accounts[0],
              provider: walletProvider.name,
              connected: true,
              balance: 0
            };
            setWalletInfo(walletInfo);
            onWalletConnect(walletInfo);
            
            const newWallet = {
              ...walletProvider,
              address: accounts[0],
              connectedAt: Date.now()
            };
            setWallets(prev => [...prev.filter(w => w.address !== accounts[0]), newWallet]);
            localStorage.setItem('connectedWallets', JSON.stringify([...wallets, newWallet]));
          }
        } else {
          throw new Error('Coinbase Wallet not installed');
        }
      }
      
      // Phantom Wallet connection
      if (walletProvider.id === 'phantom') {
        if (window.solana && window.solana.isPhantom) {
          const response = await window.solana.connect();
          if (response.publicKey) {
            const walletInfo = {
              address: response.publicKey.toString(),
              provider: walletProvider.name,
              connected: true,
              balance: 0
            };
            setWalletInfo(walletInfo);
            onWalletConnect(walletInfo);
            
            const newWallet = {
              ...walletProvider,
              address: response.publicKey.toString(),
              connectedAt: Date.now()
            };
            setWallets(prev => [...prev.filter(w => w.address !== response.publicKey.toString()), newWallet]);
            localStorage.setItem('connectedWallets', JSON.stringify([...wallets, newWallet]));
          }
        } else {
          throw new Error('Phantom wallet not available');
        }
      }
      
      // Ledger connection (hardware wallet)
      if (walletProvider.id === 'ledger') {
        throw new Error('Ledger requires Ledger Live app. Please connect via Ledger device.');
      }
      
    } catch (error) {
      setConnectionError(error.message);
      setConnectionStep('Connection failed');
    } finally {
      setIsConnecting(false);
      setConnectionStep('');
    }
  }, [onWalletConnect]);

  // Disconnect wallet function
  const disconnectWallet = useCallback((walletAddress) => {
    const updatedWallets = wallets.filter(w => w.address !== walletAddress);
    setWallets(updatedWallets);
    localStorage.setItem('connectedWallets', JSON.stringify(updatedWallets));
    
    if (walletInfo?.address === walletAddress) {
      setWalletInfo(null);
    }
  }, [wallets, walletInfo]);

  useEffect(() => {
    // Load saved wallets from localStorage
    const savedWallets = localStorage.getItem('connectedWallets');
    if (savedWallets) {
      setWallets(JSON.parse(savedWallets));
    }
  }, []);

  if (!isOpen) return null;

  return (
    <div className="wallet-manager-overlay">
      <div className="wallet-manager">
        <div className="wallet-manager-header">
          <h3>Connect Wallet</h3>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>

        {connectionStep && (
          <div className="connection-status">
            <div className="status-indicator">
              <div className="spinner"></div>
              <span>{connectionStep}</span>
            </div>
          </div>
        )}

        {connectionError && (
          <div className="error-message">
            {connectionError}
          </div>
        )}

        <div className="wallet-providers">
          {walletProviders.map(provider => (
            <div key={provider.id} className="wallet-provider">
              <div className="provider-header">
                <span className="provider-icon">{provider.icon}</span>
                <div className="provider-info">
                  <h4>{provider.name}</h4>
                  <p>{provider.description}</p>
                  <div className="provider-meta">
                    <span className="rating">{'★'.repeat(Math.floor(provider.rating))}</span>
                    <span className="type">{provider.type}</span>
                  </div>
                </div>
              </div>
              
              <div className="provider-features">
                {provider.features.map(feature => (
                  <span key={feature} className="feature-tag">{feature}</span>
                ))}
              </div>
              
              <div className="provider-actions">
                {provider.downloadUrl && (
                  <a 
                    href={provider.downloadUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="download-btn"
                  >
                    Download
                  </a>
                )}
                
                <button
                  className={`connect-btn ${isConnecting ? 'connecting' : ''}`}
                  onClick={() => connectWallet(provider)}
                  disabled={isConnecting}
                >
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </button>
                
                {provider.docsUrl && (
                  <a 
                    href={provider.docsUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="docs-btn"
                  >
                    Docs
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {wallets.length > 0 && (
          <div className="connected-wallets">
            <h4>Recently Connected</h4>
            {wallets.map(wallet => (
              <div key={wallet.address} className="connected-wallet">
                <span className="wallet-icon">{wallet.icon}</span>
                <span className="wallet-address">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </span>
                <button 
                  onClick={() => disconnectWallet(wallet.address)}
                  className="disconnect-btn"
                >
                  Disconnect
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

WalletManager.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onWalletConnect: PropTypes.func.isRequired
};

export default WalletManager;
