'use client';

import { useEffect, useState } from 'react';

interface DevModeInfo {
  environment: string;
  authMode: string;
  debugMode: boolean;
  hasDatabase: boolean;
  hasAuthSecret: boolean;
}

export function DevModeIndicator() {
  const [devInfo, setDevInfo] = useState<DevModeInfo | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Only show in development environments
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      return;
    }

    // Fetch debug info if available
    fetch('/api/debug/config')
      .then(res => {
        if (res.ok) {
          return res.json();
        }
        return null;
      })
      .then(data => {
        if (data) {
          setDevInfo({
            environment: data.environment,
            authMode: data.auth?.mode || 'UNKNOWN',
            debugMode: data.auth?.mode === 'DEBUG',
            hasDatabase: data.checks?.hasDatabase || false,
            hasAuthSecret: data.checks?.hasAuthSecret || false,
          });
        }
      })
      .catch(() => {
        // Fallback for when debug endpoint isn't available
        setDevInfo({
          environment: process.env.NODE_ENV === 'development' ? 'local' : 'unknown',
          authMode: 'UNKNOWN',
          debugMode: false,
          hasDatabase: false,
          hasAuthSecret: false,
        });
      });
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV === 'production' && !process.env.VERCEL_ENV) {
    return null;
  }

  // Don't render if not visible or no info
  if (!isVisible || !devInfo) {
    return null;
  }

  const getStatusColor = () => {
    if (devInfo.environment === 'local') {
      return 'bg-green-500 text-white';
    }if (devInfo.environment === 'vercel-dev') {
      return 'bg-yellow-500 text-black';
    }
      return 'bg-red-500 text-white';
  };

  const getStatusIcon = () => {
    switch (devInfo.environment) {
      case 'local':
        return '🔧';
      case 'vercel-dev':
        return '⚡';
      default:
        return '❓';
    }
  };

  const getDisplayText = () => {
    switch (devInfo.environment) {
      case 'local':
        return 'LOCAL DEV';
      case 'vercel-dev':
        return 'VERCEL DEV';
      default:
        return 'UNKNOWN ENV';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {/* Main environment indicator */}
      <button 
        type="button"
        className={`px-3 py-1 rounded-full text-sm font-bold shadow-lg cursor-pointer ${getStatusColor()}`}
        onClick={() => setIsVisible(!isVisible)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsVisible(!isVisible);
          }
        }}
        title="Click to toggle details"
      >
        {getStatusIcon()} {getDisplayText()}
      </button>
      
      {/* Detailed info panel */}
      {devInfo && (
        <div className="bg-gray-900 text-white p-3 rounded-lg shadow-lg text-xs max-w-xs">
          <div className="font-semibold mb-2">🔐 Auth Status</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Mode:</span>
              <span className={devInfo.authMode === 'DEBUG' ? 'text-yellow-300' : 'text-green-300'}>
                {devInfo.authMode}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Database:</span>
              <span className={devInfo.hasDatabase ? 'text-green-300' : 'text-red-300'}>
                {devInfo.hasDatabase ? '✅' : '❌'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Auth Secret:</span>
              <span className={devInfo.hasAuthSecret ? 'text-green-300' : 'text-red-300'}>
                {devInfo.hasAuthSecret ? '✅' : '❌'}
              </span>
            </div>
          </div>
          
          {/* Warnings */}
          {!devInfo.hasDatabase && (
            <div className="mt-2 text-red-300 text-xs">
              ⚠️ No database connection
            </div>
          )}
          {!devInfo.hasAuthSecret && (
            <div className="mt-1 text-red-300 text-xs">
              ⚠️ Using fallback auth secret
            </div>
          )}
          
          {/* Development tips */}
          {devInfo.environment === 'local' && (
            <div className="mt-2 text-blue-300 text-xs">
              💡 Auth is relaxed for development
            </div>
          )}
        </div>
      )}
    </div>
  );
}