import { useEffect } from "react";
import AppShell from "./components/layout/app-shell";
import api from "./lib/axios";

export default function App() {
  useEffect(() => {


    // Send email when app is closed
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable delivery during page unload
      if (navigator.sendBeacon) {
        const data = new Blob([JSON.stringify({})], { type: 'application/json' });
        navigator.sendBeacon('/api/app-closed', data);
      } else {
        // Fallback for browsers that don't support sendBeacon
        api.post("/app-closed").catch(() => {});
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {

      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return <AppShell />;
}