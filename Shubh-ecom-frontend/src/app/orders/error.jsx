'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { logger } from '@/utils/logger';

export default function OrdersError({ error, reset }) {
  useEffect(() => {
    logger.error('Orders route error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-4 mb-4">
        <AlertCircle className="w-12 h-12 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold mb-2">Orders Error</h2>
      <p className="text-muted-foreground mb-6 max-w-[560px]">
        We could not load your order data. Please try again.
      </p>
      <div className="flex gap-4">
        <Button onClick={() => reset()}>Try again</Button>
        <Button variant="outline" onClick={() => (window.location.href = '/')}>
          Go Home
        </Button>
      </div>
    </div>
  );
}

