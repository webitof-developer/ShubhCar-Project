'use client';

import { useEffect } from 'react';
import { Button, Container, Card } from 'react-bootstrap';
import IconifyIcon from '@/components/wrappers/IconifyIcon';
import Link from 'next/link';

export default function Error({ error, reset }) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard Error Boundary caught:', error);
  }, [error]);

  return (
    <Container className="d-flex flex-column justify-content-center align-items-center min-vh-100 py-5">
      <Card className="text-center shadow-sm border-0" style={{ maxWidth: '500px', width: '100%' }}>
        <Card.Body className="p-5">
          <IconifyIcon icon="tabler:exclamation-circle" className="text-danger mb-4" style={{ fontSize: '64px' }} />
          <h3 className="mb-3 fw-bold">Something went wrong!</h3>
          <p className="text-muted mb-4">
            An unexpected error occurred while loading this dashboard page. Please try again or return to the home page.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Button variant="primary" onClick={() => reset()} className="px-4">
              Try Again
            </Button>
            <Link href="/" passHref>
              <Button variant="outline-secondary" className="px-4">
                Dashboard Home
              </Button>
            </Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
}
