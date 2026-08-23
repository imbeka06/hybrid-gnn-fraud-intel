import { createContext, useContext, useState, useEffect } from 'react';
import API_BASE from '../lib/api';

const AlertsContext = createContext();

export function AlertsProvider({ children }) {
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    console.log("🔌 SSE hook mounting...");
    const source = new EventSource(`${API_BASE}/alerts/stream/analyst_01`);

    source.addEventListener('open', () => console.log("✅ SSE connected"));

    source.onmessage = (event) => {
      console.log("🔔 Alert received:", event.data);
      const newAlert = JSON.parse(event.data);

      setLiveAlerts((prev) => [newAlert, ...prev]);
      setUnreadCount((prev) => prev + 1);

      setToasts((prev) => [...prev, newAlert]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== newAlert.id));
      }, 5000);
    };

    source.onerror = () => console.warn('SSE connection lost. Retrying...');
    return () => source.close();
  }, []);

  return (
    <AlertsContext.Provider value={{ liveAlerts, unreadCount, setUnreadCount, toasts }}>
      {children}
    </AlertsContext.Provider>
  );
}

export function useAlerts() {
  return useContext(AlertsContext);
}