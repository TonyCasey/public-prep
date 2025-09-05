import { useEffect, useState } from 'react';

interface SessionDebugInfo {
  cookies: string;
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  userAgent: string;
  currentUrl: string;
}

export function SessionDebugPanel() {
  const [debugInfo, setDebugInfo] = useState<SessionDebugInfo | null>(null);

  useEffect(() => {
    const gatherDebugInfo = () => {
      // Get all cookies
      const cookies = document.cookie;
      
      // Get localStorage data
      const localStorage: Record<string, string> = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key) {
          localStorage[key] = window.localStorage.getItem(key) || '';
        }
      }
      
      // Get sessionStorage data
      const sessionStorage: Record<string, string> = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        if (key) {
          sessionStorage[key] = window.sessionStorage.getItem(key) || '';
        }
      }
      
      setDebugInfo({
        cookies,
        localStorage,
        sessionStorage,
        userAgent: navigator.userAgent,
        currentUrl: window.location.href
      });
    };

    gatherDebugInfo();
    
    // Refresh debug info every 5 seconds
    const interval = setInterval(gatherDebugInfo, 5000);
    
    return () => clearInterval(interval);
  }, []);

  if (!debugInfo) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-auto z-50">
      <h3 className="font-bold text-sm mb-2">Session Debug Info</h3>
      
      <div className="space-y-2 text-xs">
        <div>
          <strong>Cookies:</strong>
          <div className="bg-gray-100 p-2 rounded mt-1 break-all">
            {debugInfo.cookies || 'No cookies found'}
          </div>
          <div className="mt-1 text-xs text-blue-600">
            Session cookie present: {debugInfo.cookies.includes('connect.sid') ? '✅ YES' : '❌ NO'}
          </div>
        </div>
        
        <div>
          <strong>LocalStorage:</strong>
          <div className="bg-gray-100 p-2 rounded mt-1">
            {Object.keys(debugInfo.localStorage).length === 0 
              ? 'Empty' 
              : Object.entries(debugInfo.localStorage).map(([key, value]) => (
                  <div key={key}><strong>{key}:</strong> {value}</div>
                ))
            }
          </div>
        </div>
        
        <div>
          <strong>SessionStorage:</strong>
          <div className="bg-gray-100 p-2 rounded mt-1">
            {Object.keys(debugInfo.sessionStorage).length === 0 
              ? 'Empty' 
              : Object.entries(debugInfo.sessionStorage).map(([key, value]) => (
                  <div key={key}><strong>{key}:</strong> {value}</div>
                ))
            }
          </div>
        </div>
        
        <div>
          <strong>URL:</strong>
          <div className="bg-gray-100 p-2 rounded mt-1 break-all">
            {debugInfo.currentUrl}
          </div>
        </div>
      </div>
    </div>
  );
}