import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';
import './OfflineFallback.css';

const OfflineFallback = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="offline-overlay">
      <div className="offline-content">
        <div className="offline-icon-wrapper">
          <WifiOff size={56} className="offline-icon" />
          <div className="offline-pulse"></div>
        </div>
        <h1 className="offline-title">No Internet Connection</h1>
        <p className="offline-message">
          Please check your network settings and try again. 
          We'll automatically reconnect you when the internet is back.
        </p>
        <button 
          className="offline-retry-btn" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

export default OfflineFallback;
