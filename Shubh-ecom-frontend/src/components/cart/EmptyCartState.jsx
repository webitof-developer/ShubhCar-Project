"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ChevronRight, ShoppingCart } from 'lucide-react';

export const EmptyCartState = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 mx-auto mb-6 bg-secondary rounded-2xl flex items-center justify-center">
          <ShoppingCart className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-3">Your cart is empty</h2>
        <p className="text-muted-foreground mb-8">
          Looks like you haven&apos;t added any parts yet. Start browsing our catalog to find the perfect parts for your vehicle.
        </p>
        <Link href="/">
          <Button size="lg" className="rounded-lg">
            Start Shopping
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
};
