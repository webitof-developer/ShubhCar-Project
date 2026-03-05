'use client';

import { useEffect } from 'react';
import logger from '@/lib/logger';

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    logger.error('Dashboard Global Error caught:', error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{ display: 'flex', minHeight: '100vh', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: '2rem', textAlign: 'center', backgroundColor: '#f8f9fa' }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem', color: '#dc3545' }}>Critical Dashboard Error</h2>
          <p style={{ color: '#6c757d', marginBottom: '2rem', maxWidth: '500px' }}>
            A critical system error prevented the dashboard from loading.
          </p>
          <button 
            onClick={() => reset()} 
            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#0d6efd', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Attempt Recovery
          </button>
        </div>
      </body>
    </html>
  );
}
