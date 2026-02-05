//src/components/checkout/PaymentStep.jsx

"use client";

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Wallet, AlertCircle, Smartphone } from 'lucide-react';
import { getPaymentMethods } from '@/services/paymentService';

export function PaymentStep({ onBack, onConfirm }) {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleConfirm = () => {
    if (paymentMethod) {
      onConfirm(paymentMethod);
    }
  };

  useEffect(() => {
    const loadMethods = async () => {
      setLoading(true);
      try {
        const data = await getPaymentMethods();
        const enabled = (data?.methods || []).filter((m) => m.enabled);
        setMethods(enabled);
        setPaymentMethod(enabled[0]?.code || null);
      } catch (error) {
        console.error('[PAYMENT_STEP] Failed to load payment methods:', error);
        setMethods([]);
        setPaymentMethod(null);
      } finally {
        setLoading(false);
      }
    };

    loadMethods();
  }, []);

  // Get icon component by name
  const getIcon = (iconName) => {
    const icons = {
      Wallet,
      Smartphone,
      CreditCard,
    };
    return icons[iconName] || CreditCard;
  };

  const methodMeta = useMemo(
    () => ({
      cod: {
        id: 'cod',
        displayName: 'Cash on Delivery',
        description: 'Pay in cash when your order arrives.',
        icon: 'Wallet',
      },
      razorpay: {
        id: 'razorpay',
        displayName: 'Razorpay',
        description: 'Pay securely using cards, UPI, or net banking.',
        icon: 'CreditCard',
      },
    }),
    [],
  );

  // Render a single payment method
  const renderPaymentMethod = (method) => {
    const meta = methodMeta[method.code];
    if (!meta) return null;
    
    const IconComponent = getIcon(meta.icon);
    
    return (
      <div
        key={method.code}
        className="flex items-start space-x-3 p-4 rounded-lg transition-colors bg-zinc-100 hover:bg-zinc-200 cursor-pointer hover:border hover:border-primary/50 hover:border-dashed"
      >
        <RadioGroupItem 
          value={meta.id} 
          id={meta.id} 
          className="mt-1" 
        />
        <Label htmlFor={meta.id} className="flex-1 cursor-pointer">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <IconComponent className="w-5 h-5 text-primary" />
            <span className="font-medium">{meta.displayName}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {meta.description}
          </p>
        </Label>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4">
        <Card className="p-4 md:p-6 border-zinc-200">
          <h2 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Method
          </h2>
          <div className="text-sm text-muted-foreground">Loading payment options...</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4">
      <Card className="p-4 md:p-6 border-zinc-200">
        <h2 className="text-lg md:text-xl font-semibold mb-6 flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Payment Method
        </h2>

        {methods.length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-300 p-4 text-sm text-muted-foreground">
            No payment methods are available right now. Please try again later.
          </div>
        ) : (
          <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
            <div className="space-y-3">
              {methods.map((method) => renderPaymentMethod(method))}
            </div>
          </RadioGroup>
        )}

        {/* Info Box */}
        <div className="mt-6 p-3 bg-primary/10 border-primary/50 rounded-lg flex gap-2">
          <AlertCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-xs text-primary">
            {paymentMethod === 'cod' 
              ? 'Your order will be confirmed once you place it. No payment is required at this time for COD orders.'
              : 'You will be redirected to the payment gateway to complete your transaction securely.'
            }
          </p>
        </div>

        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onBack} className="flex-1">
            Back to Review
          </Button>
          <Button onClick={handleConfirm} className="flex-1" size="lg" disabled={!paymentMethod}>
            Place Order
          </Button>
        </div>
      </Card>
    </div>
  );
}
