"use client";

import {
  Package,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
} from 'lucide-react';

export const ORDER_STATUS = {
  CREATED: 'created',
  PENDING_PAYMENT: 'pending_payment',
  CONFIRMED: 'confirmed',
  SHIPPED: 'shipped',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  ON_HOLD: 'on_hold',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
  REFUNDED: 'refunded',
};

export const ORDER_STATUS_LIST = [
  ORDER_STATUS.CREATED,
  ORDER_STATUS.PENDING_PAYMENT,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.ON_HOLD,
  ORDER_STATUS.FAILED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.RETURNED,
  ORDER_STATUS.REFUNDED,
];

export const ORDER_STATUS_FILTERS = [
  ORDER_STATUS.CREATED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.DELIVERED,
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.RETURNED,
  ORDER_STATUS.REFUNDED,
];

export const ORDER_STATUS_LABELS = {
  [ORDER_STATUS.CREATED]: 'Order placed',
  [ORDER_STATUS.PENDING_PAYMENT]: 'Pending payment',
  [ORDER_STATUS.CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.SHIPPED]: 'Shipped',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Out for delivery',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.ON_HOLD]: 'On hold',
  [ORDER_STATUS.FAILED]: 'Failed',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
  [ORDER_STATUS.RETURNED]: 'Returned',
  [ORDER_STATUS.REFUNDED]: 'Refunded',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PARTIALLY_PAID: 'partially_paid',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const PAYMENT_STATUS_BADGE_CLASS = {
  [PAYMENT_STATUS.PENDING]: 'bg-muted text-muted-foreground',
  [PAYMENT_STATUS.PARTIALLY_PAID]: 'bg-warning/10 text-warning border-warning/30',
  [PAYMENT_STATUS.PAID]: 'bg-success/10 text-success border-success/30',
  [PAYMENT_STATUS.FAILED]: 'bg-destructive/10 text-destructive border-destructive/30',
  [PAYMENT_STATUS.REFUNDED]: 'bg-secondary/10 text-secondary-foreground border-secondary/30',
};

export const PAYMENT_STATUS_LABELS = {
  [PAYMENT_STATUS.PENDING]: 'Pending',
  [PAYMENT_STATUS.PARTIALLY_PAID]: 'Partially Paid',
  [PAYMENT_STATUS.PAID]: 'Paid',
  [PAYMENT_STATUS.FAILED]: 'Failed',
  [PAYMENT_STATUS.REFUNDED]: 'Refunded',
};

export const getPaymentStatusLabel = (status) =>
  PAYMENT_STATUS_LABELS[status] || status?.replace(/_/g, ' ') || 'pending';

export const getPaymentStatusBadgeClass = (status) =>
  PAYMENT_STATUS_BADGE_CLASS[status] || 'bg-muted text-muted-foreground';

export const ORDER_STATUS_BADGE_CLASS = {
  [ORDER_STATUS.CREATED]: 'bg-warning/10 text-warning border-warning/30',
  [ORDER_STATUS.PENDING_PAYMENT]: 'bg-warning/10 text-warning border-warning/30',
  [ORDER_STATUS.CONFIRMED]: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
  [ORDER_STATUS.SHIPPED]: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'bg-purple-500/10 text-purple-600 border-purple-500/30',
  [ORDER_STATUS.DELIVERED]: 'bg-success/10 text-success border-success/30',
  [ORDER_STATUS.CANCELLED]: 'bg-destructive/10 text-destructive border-destructive/30',
  [ORDER_STATUS.RETURNED]: 'bg-destructive/10 text-destructive border-destructive/30',
  [ORDER_STATUS.REFUNDED]: 'bg-destructive/10 text-destructive border-destructive/30',
  [ORDER_STATUS.FAILED]: 'bg-destructive/10 text-destructive border-destructive/30',
  [ORDER_STATUS.ON_HOLD]: 'bg-muted text-muted-foreground',
};

const ORDER_STATUS_ICON = {
  [ORDER_STATUS.CREATED]: Clock,
  [ORDER_STATUS.PENDING_PAYMENT]: Clock,
  [ORDER_STATUS.CONFIRMED]: CheckCircle2,
  [ORDER_STATUS.SHIPPED]: Truck,
  [ORDER_STATUS.OUT_FOR_DELIVERY]: Truck,
  [ORDER_STATUS.DELIVERED]: PackageCheck,
  [ORDER_STATUS.CANCELLED]: XCircle,
  [ORDER_STATUS.RETURNED]: XCircle,
  [ORDER_STATUS.REFUNDED]: XCircle,
  [ORDER_STATUS.FAILED]: XCircle,
  [ORDER_STATUS.ON_HOLD]: Package,
};

export const getOrderStatusLabel = (status) =>
  ORDER_STATUS_LABELS[status] || status?.replace(/_/g, ' ') || 'created';

export const getOrderStatusBadgeClass = (status) =>
  ORDER_STATUS_BADGE_CLASS[status] || 'bg-muted text-muted-foreground';

export const getOrderStatusIcon = (status, className = 'w-4 h-4') => {
  const Icon = ORDER_STATUS_ICON[status] || Package;
  return <Icon className={className} />;
};
