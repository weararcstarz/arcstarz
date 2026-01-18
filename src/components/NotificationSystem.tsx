'use client';

import { useState, useEffect } from 'react';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: number;
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    const handleShowNotification = (event: CustomEvent) => {
      const { message, type } = event.detail;
      
      const notification: Notification = {
        id: Date.now().toString(),
        message,
        type: type || 'info',
        timestamp: Date.now()
      };
      
      setNotifications(prev => [...prev, notification]);
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== notification.id));
      }, 3000);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('showNotification', handleShowNotification as EventListener);
      
      return () => {
        window.removeEventListener('showNotification', handleShowNotification as EventListener);
      };
    }
    
    return undefined;
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 pointer-events-none">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`pointer-events-auto transform transition-all duration-300 ease-out ${
            notification.type === 'success' 
              ? 'bg-black text-white border-2 border-black' 
              : notification.type === 'error' 
              ? 'bg-black text-white border-2 border-red-500' 
              : 'bg-black text-white border-2 border-black'
          } px-6 py-4 shadow-lg flex items-center justify-between min-w-[300px] max-w-[400px]`}
        >
          <div className="flex items-center space-x-3">
            {notification.type === 'success' && (
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              </div>
            )}
            {notification.type === 'error' && (
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              </div>
            )}
            {notification.type === 'info' && (
              <div className="w-6 h-6 flex items-center justify-center">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              </div>
            )}
            <div className="flex-1">
              <span className="font-body text-sm tracking-wide block">{notification.message}</span>
            </div>
          </div>
          <button
            onClick={() => removeNotification(notification.id)}
            className="ml-4 text-white/60 hover:text-white transition-colors font-body text-xs"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
