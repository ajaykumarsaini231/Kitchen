'use client';

import { useEffect } from 'react';
import { API_URL } from '../lib/config';

/**
 * Pings the API's /api/health every 5 minutes while a tab is open, so the
 * Render free-tier server doesn't go to sleep (avoids ~30-50s cold starts).
 * Renders nothing.
 */
export default function KeepAlive() {
  useEffect(() => {
    const ping = () =>
      fetch(`${API_URL}/api/health`, { cache: 'no-store' }).catch(() => {
        /* ignore — best-effort keep-alive */
      });

    ping(); // initial ping on load
    const id = setInterval(ping, 5 * 60 * 1000); // every 5 minutes
    return () => clearInterval(id);
  }, []);

  return null;
}
