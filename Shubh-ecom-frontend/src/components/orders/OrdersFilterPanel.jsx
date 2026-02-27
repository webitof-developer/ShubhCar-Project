"use client";

import { Separator } from '@/components/ui/separator';
import {
  ORDER_STATUS_FILTERS,
  getOrderStatusIcon,
  getOrderStatusLabel,
} from '@/constants/orderStatus';

export const OrdersFilterPanel = ({
  orders,
  statusFilter,
  setStatusFilter,
  sortBy,
  setSortBy,
  sortOptions,
  onApplied,
}) => {
  const applyStatus = (value) => {
    setStatusFilter(value);
    onApplied?.();
  };

  const applySort = (value) => {
    setSortBy(value);
    onApplied?.();
  };

  return (
    <>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Filter by Status</p>
      <ul className="space-y-1">
        <li>
          <button
            onClick={() => applyStatus('all')}
            className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
              statusFilter === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            }`}
          >
            <span>All Orders</span>
            <span className="text-xs">{orders.length}</span>
          </button>
        </li>
        {ORDER_STATUS_FILTERS.map((status) => {
          const count = orders.filter((o) => o.orderStatus === status).length;
          return (
            <li key={status}>
              <button
                onClick={() => applyStatus(status)}
                className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between ${
                  statusFilter === status ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {getOrderStatusIcon(status, 'w-3.5 h-3.5')}
                  {getOrderStatusLabel(status)}
                </span>
                <span className="text-xs">{count}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <Separator className="my-4" />

      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Sort By</p>
      <ul className="space-y-1">
        {sortOptions.map((opt) => (
          <li key={opt.value}>
            <button
              onClick={() => applySort(opt.value)}
              className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors ${
                sortBy === opt.value ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {opt.label}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
};
