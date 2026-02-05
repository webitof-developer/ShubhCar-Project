//src/components/checkout/CheckoutStepper.jsx

"use client";

import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Purely Presentational Stepper Component
 * No logic, no callbacks, no state management
 * Only displays current progress based on props
 */
export function CheckoutStepper({ currentStep, steps }) {
  return (
    <div className="w-full py-4 md:py-6">
      {/* Mobile: Current Step Display */}
      <div className="md:hidden text-center mb-4">
        <p className="text-sm font-medium text-foreground">
          Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.label}
        </p>
      </div>

      {/* Stepper Visual */}
      <div className="flex items-center justify-between max-w-2xl mx-auto px-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center relative w-full">
              <div
                className={cn(
                  "w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-semibold transition-all z-10",
                  currentStep > step.id && "bg-primary text-primary-foreground",
                  currentStep === step.id && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                  currentStep < step.id && "bg-secondary text-muted-foreground"
                )}
              >
                {currentStep > step.id ? (
                  <Check className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <span className="text-xs md:text-sm">{step.id}</span>
                )}
              </div>
              
              {/* Desktop Label */}
              <div className="hidden md:block absolute top-12 text-center w-24">
                <p className={cn(
                  "text-xs font-medium",
                  currentStep >= step.id ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.label}
                </p>
              </div>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-1 md:mx-2 transition-all",
                currentStep > step.id ? "bg-primary" : "bg-secondary"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
