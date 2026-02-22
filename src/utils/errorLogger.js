// Centralized error logging system for production monitoring
export const logError = (error, context = {}) => {
  const errorData = {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack
    },
    context,
    userAgent: navigator.userAgent,
    url: window.location.href,
    sessionId: sessionStorage.getItem('sessionId') || 'unknown',
    buildVersion: process.env.REACT_APP_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  };
  
  console.error('App Error:', errorData);
  
  // Send to monitoring service in production
  if (process.env.NODE_ENV === 'production') {
    // Send to your error tracking service (replace with your actual service)
    fetch('/api/errors', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Error-Source': 'crypto-tracker'
      },
      body: JSON.stringify(errorData)
    }).catch(err => {
      console.error('Failed to send error to monitoring service:', err);
    });
  }
  
  // Store in localStorage for debugging (keep last 100 errors)
  try {
    const errors = JSON.parse(localStorage.getItem('appErrors') || '[]');
    errors.push(errorData);
    localStorage.setItem('appErrors', JSON.stringify(errors.slice(-100)));
  } catch (err) {
    console.error('Failed to store error in localStorage:', err);
  }
};

// Performance monitoring
export const logPerformance = (metric, value, context = {}) => {
  const performanceData = {
    timestamp: new Date().toISOString(),
    metric,
    value,
    context,
    sessionId: sessionStorage.getItem('sessionId') || 'unknown'
  };
  
  console.log('Performance Metric:', performanceData);
  
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(performanceData)
    }).catch(console.error);
  }
};

// User behavior tracking
export const logUserAction = (action, data = {}) => {
  const actionData = {
    timestamp: new Date().toISOString(),
    action,
    data,
    sessionId: sessionStorage.getItem('sessionId') || 'unknown',
    userAgent: navigator.userAgent
  };
  
  console.log('User Action:', actionData);
  
  if (process.env.NODE_ENV === 'production') {
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(actionData)
    }).catch(console.error);
  }
};

// Initialize session ID
if (!sessionStorage.getItem('sessionId')) {
  sessionStorage.setItem('sessionId', `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
}

// Global error handler
window.addEventListener('error', (event) => {
  logError(event.error || new Error('Unknown error'), {
    source: 'global',
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logError(event.reason || new Error('Unhandled promise rejection'), {
    source: 'promise',
    promise: event.promise
  });
});
