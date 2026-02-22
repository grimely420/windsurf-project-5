import React from 'react';
import '../ErrorBoundary.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Generate unique error ID for tracking
    const errorId = `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    return { 
      hasError: true,
      errorId 
    };
  }

  componentDidCatch(error, errorInfo) {
    // Enhanced error logging
    const errorData = {
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack
      },
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    };

    // Log to console with structured data
    console.error('ErrorBoundary caught an error:', errorData);
    
    // Store error details for potential reporting
    this.setState({
      error: error,
      errorInfo: errorInfo
    });

    // Optional: Send to error reporting service
    if (process.env.NODE_ENV === 'production') {
      // this.reportError(errorData);
    }
  }

  handleRetry = () => {
    const { retryCount } = this.state;
    
    if (retryCount < 3) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }));
    } else {
      // Max retries reached, suggest page reload
      window.location.reload();
    }
  }

  getErrorType = (error) => {
    if (!error) return 'unknown';
    
    const message = error.message.toLowerCase();
    
    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return 'permission';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('memory') || message.includes('heap')) {
      return 'memory';
    }
    
    return 'general';
  }

  getErrorMessage = (errorType) => {
    const messages = {
      network: 'Network connection issue. Please check your internet connection and try again.',
      permission: 'Permission denied. Please check your browser settings and try again.',
      timeout: 'Request timed out. The server may be busy. Please try again.',
      memory: 'Memory issue detected. Please refresh the page to continue.',
      general: 'Something unexpected happened. Please try again or refresh the page.',
      unknown: 'An unknown error occurred. Please refresh the page.'
    };
    
    return messages[errorType] || messages.unknown;
  }

  render() {
    if (this.state.hasError) {
      const errorType = this.getErrorType(this.state.error);
      const errorMessage = this.getErrorMessage(errorType);
      const { retryCount } = this.state;
      const canRetry = retryCount < 3;
      
      return (
        <div className="error-boundary">
          <div className="error-content">
            <div className="error-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            
            <h2>Oops! Something went wrong</h2>
            <p className="error-message">{errorMessage}</p>
            
            <div className="error-actions">
              {canRetry && (
                <button 
                  onClick={this.handleRetry} 
                  className="retry-button"
                >
                  Try Again {retryCount > 0 && `(${retryCount}/3)`}
                </button>
              )}
              
              <button 
                onClick={() => window.location.reload()} 
                className="reload-button"
              >
                Refresh Page
              </button>
            </div>
            
            <div className="error-info">
              <small>Error ID: {this.state.errorId}</small>
              {retryCount > 0 && (
                <small>Retry attempts: {retryCount}/3</small>
              )}
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Developer Details</summary>
                <div className="error-debug">
                  <div>
                    <strong>Error Type:</strong> {errorType}
                  </div>
                  <div>
                    <strong>Error Message:</strong> 
                    <pre>{this.state.error && this.state.error.toString()}</pre>
                  </div>
                  <div>
                    <strong>Component Stack:</strong>
                    <pre>{this.state.errorInfo && this.state.errorInfo.componentStack}</pre>
                  </div>
                </div>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
