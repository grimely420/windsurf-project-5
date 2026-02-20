import React from 'react';

const StatusIndicator = ({ status, statusText }) => {
  return (
    <div className="status-indicator">
      <span className={`status-dot ${status}`}></span>
      <span className="status-text">{statusText}</span>
    </div>
  );
};

export default StatusIndicator;
