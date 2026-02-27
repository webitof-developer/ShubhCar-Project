import { Clock, CheckCircle2, Truck, PackageCheck, XCircle } from 'lucide-react';
import { ORDER_STATUS, getOrderStatusLabel } from '@/constants/orderStatus';

export const TIMELINE_STEPS = [
  { key: ORDER_STATUS.CREATED,        label: 'Order Placed',    Icon: Clock },
  { key: ORDER_STATUS.CONFIRMED,      label: 'Confirmed',       Icon: CheckCircle2 },
  { key: ORDER_STATUS.SHIPPED,        label: 'Shipped',         Icon: Truck },
  { key: ORDER_STATUS.OUT_FOR_DELIVERY, label: 'Out for Delivery', Icon: Truck },
  { key: ORDER_STATUS.DELIVERED,      label: 'Delivered',       Icon: PackageCheck },
];

export const TERMINAL_STATUSES = [
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.RETURNED,
  ORDER_STATUS.REFUNDED,
  ORDER_STATUS.FAILED,
  ORDER_STATUS.ON_HOLD,
];

export function getTimelineStep(status) {
  return TIMELINE_STEPS.findIndex((s) => s.key === status);
}

export function OrderTimeline({ status }) {
  if (TERMINAL_STATUSES.includes(status)) {
    return (
      <div className="flex items-center gap-2 text-sm text-destructive">
        <XCircle className="w-4 h-4" />
        <span className="font-medium">{getOrderStatusLabel(status)}</span>
      </div>
    );
  }

  const activeIdx = getTimelineStep(status);

  return (
    <div className="flex items-center gap-0 overflow-x-auto hide-scrollbar mt-1">
      {TIMELINE_STEPS.map((step, idx) => {
        const done      = idx < activeIdx;
        const active    = idx === activeIdx;
        const pending   = idx > activeIdx;
        const isLast    = idx === TIMELINE_STEPS.length - 1;

        return (
          <div key={step.key} className="flex items-center">
            <div className="flex flex-col items-center gap-0.5 min-w-[60px]">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center border-2 transition-all
                  ${done   ? 'bg-primary border-primary text-primary-foreground' : ''}
                  ${active ? 'bg-primary border-primary text-primary-foreground shadow-md scale-110' : ''}
                  ${pending ? 'bg-background border-border text-muted-foreground' : ''}
                `}
              >
                <step.Icon className="w-3.5 h-3.5" />
              </div>
              <span
                className={`text-[9px] text-center leading-tight
                  ${done || active ? 'text-primary font-semibold' : 'text-muted-foreground'}
                `}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`h-0.5 w-6 mx-0.5 flex-shrink-0 rounded transition-all
                  ${done ? 'bg-primary' : 'bg-border'}
                `}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
