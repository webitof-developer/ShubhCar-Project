'use client';

import { useEffect } from 'react';
import { Button, Card, Container } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import logger from '@/lib/logger';

export default function SalesmanAnalyticsError({ error, reset }) {
  useEffect(() => {
    logger.error('Salesman analytics route error boundary:', error);
  }, [error]);

  return (
    <Container className="d-flex flex-column justify-content-center align-items-center min-vh-100 py-5">
      <Card className="text-center shadow-sm border-0" style={{ maxWidth: '560px', width: '100%' }}>
        <Card.Body className="p-5">
          <IconifyIcon icon="tabler:user-off" className="text-danger mb-4" style={{ fontSize: '64px' }} />
          <h3 className="mb-3 fw-bold">Salesman analytics failed to load</h3>
          <p className="text-muted mb-4">An error occurred while rendering salesman analytics.</p>
          <div className="d-flex justify-content-center gap-3">
            <Button variant="primary" onClick={() => reset()}>
              Retry
            </Button>
            <Button variant="outline-secondary" onClick={() => (window.location.href = '/')}>
              Dashboard Home
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}

