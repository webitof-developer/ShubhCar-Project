// src/app/orders/page.jsx
"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Package,
  Calendar,
  Truck,
  MapPin,
  CreditCard,
  Search,
  FileText,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Clock,
  CheckCircle2,
  PackageCheck,
  XCircle,
  ShoppingBag,
  SlidersHorizontal,
  X,
  ArrowLeft,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { getMyOrders, getOrder } from '@/services/orderService';
import { getAddressById } from '@/services/userAddressService';
import { resolveProductImages } from '@/utils/media';
import { formatPrice } from '@/services/pricingService';
import {
  ORDER_STATUS_FILTERS,
  getOrderStatusBadgeClass,
  getOrderStatusIcon,
  getOrderStatusLabel,
  getPaymentStatusBadgeClass,
  getPaymentStatusLabel,
  ORDER_STATUS,
} from '@/constants/orderStatus';

// ── Status timeline steps (ordered progression) ──────────────────────────────
const TIMELINE_STEPS = [
  { key: ORDER_STATUS.CREATED,        label: 'Order Placed',    Icon: Clock },
  { key: ORDER_STATUS.CONFIRMED,      label: 'Confirmed',       Icon: CheckCircle2 },
  { key: ORDER_STATUS.SHIPPED,        label: 'Shipped',         Icon: Truck },
  { key: ORDER_STATUS.OUT_FOR_DELIVERY, label: 'Out for Delivery', Icon: Truck },
  { key: ORDER_STATUS.DELIVERED,      label: 'Delivered',       Icon: PackageCheck },
];

const TERMINAL_STATUSES = [
  ORDER_STATUS.CANCELLED,
  ORDER_STATUS.RETURNED,
  ORDER_STATUS.REFUNDED,
  ORDER_STATUS.FAILED,
  ORDER_STATUS.ON_HOLD,
];

const SORT_OPTIONS = [
  { value: 'date-desc', label: 'Newest First' },
  { value: 'date-asc',  label: 'Oldest First' },
  { value: 'amount-desc', label: 'Highest Amount' },
  { value: 'amount-asc',  label: 'Lowest Amount' },
];

// ── Helper: active step index in timeline ────────────────────────────────────
function getTimelineStep(status) {
  const idx = TIMELINE_STEPS.findIndex((s) => s.key === status);
  return idx; // -1 means terminal/unknown
}

// ── Status Timeline Component ─────────────────────────────────────────────────
function OrderTimeline({ status }) {
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

// ── Single Order Row ──────────────────────────────────────────────────────────
function OrderRow({ order, accessToken }) {
  const [expanded, setExpanded]         = useState(false);
  const [detail, setDetail]             = useState(null);
  const [address, setAddress]           = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const displayItems = (order.items || []).slice(0, 3);
  const remainingCount = (order.items || []).length - 3;

  const handleExpand = async () => {
    if (!expanded) {
      if (!detail) {
        setLoadingDetail(true);
        try {
          const res = await getOrder(accessToken, order._id);
          const merged = res?.order ? { ...order, ...res.order, items: res.items || order.items || [], shipment: res.shipments?.[0] || order.shipment, notes: res.notes || [] } : order;
          setDetail(merged);
          if (merged.shippingAddressId) {
            const addr = await getAddressById(merged.shippingAddressId, accessToken);
            setAddress(addr || null);
          }
        } catch (e) {
          console.error('[OrderRow] load detail error', e);
          setDetail(order);
        } finally {
          setLoadingDetail(false);
        }
      }
    }
    setExpanded((p) => !p);
  };

  const displayOrder = detail || order;

  return (
    <div className="border border-border/60 rounded-xl overflow-hidden bg-card hover:border-primary/30 transition-colors">
      {/* ── Summary Row ── */}
      <div className="p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">

          {/* Product thumbnails */}
          <div className="flex -space-x-2 flex-shrink-0">
            {displayItems.map((item, i) => (
              <div
                key={item._id || i}
                className="w-14 h-14 rounded-lg bg-muted/50 overflow-hidden border-2 border-card flex-shrink-0"
                style={{ zIndex: displayItems.length - i }}
              >
                <img
                  src={resolveProductImages(item.product?.images || [])[0]}
                  alt={item.product?.name || 'Product'}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
            {remainingCount > 0 && (
              <div className="w-14 h-14 rounded-lg bg-muted/50 border-2 border-card flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-semibold text-muted-foreground">+{remainingCount}</span>
              </div>
            )}
          </div>

          {/* Order meta */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-bold text-foreground text-sm">#{order.orderNumber}</span>
              <Badge
                variant="outline"
                className={`${getOrderStatusBadgeClass(order.orderStatus)} flex items-center gap-1 text-xs`}
              >
                {getOrderStatusIcon(order.orderStatus, 'w-3 h-3')}
                {getOrderStatusLabel(order.orderStatus)}
              </Badge>
              <Badge
                variant="outline"
                className={`${getPaymentStatusBadgeClass(order.paymentStatus)} text-xs`}
              >
                {getPaymentStatusLabel(order.paymentStatus)}
              </Badge>
            </div>

            {/* Product names */}
            <p className="text-sm text-foreground font-medium truncate">
              {(order.items || []).map((i) => i.product?.name).filter(Boolean).slice(0, 2).join(', ')}
              {(order.items || []).length > 2 && ` +${(order.items || []).length - 2} more`}
            </p>

            <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(order.placedAt || order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                {(order.items || []).length} {(order.items || []).length === 1 ? 'item' : 'items'}
              </span>
              {order.shipment?.trackingNumber && (
                <span className="flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  {order.shipment.trackingNumber}
                </span>
              )}
            </div>

            {/* Compact timeline */}
            <div className="mt-3">
              <OrderTimeline status={order.orderStatus} />
            </div>
          </div>

          {/* Price + actions */}
          <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0">
            <div className="text-right">
              <p className="font-bold text-lg text-foreground leading-tight">{formatPrice(order.grandTotal || 0)}</p>
              <p className="text-xs text-muted-foreground">{order.paymentMethod}</p>
            </div>
            <div className="flex items-center gap-2">
              <Link href={`/invoice/${order._id}`} target="_blank">
                <Button variant="ghost" size="sm" className="h-8 text-xs px-2">
                  <FileText className="w-3.5 h-3.5 mr-1" />
                  Invoice
                </Button>
              </Link>
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs px-3"
                onClick={handleExpand}
              >
                {expanded ? (
                  <><ChevronUp className="w-3.5 h-3.5 mr-1" />Hide</>
                ) : (
                  <><ChevronDown className="w-3.5 h-3.5 mr-1" />Details</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Expanded Detail Panel ── */}
      {expanded && (
        <div className="border-t border-border/50 bg-muted/20">
          {loadingDetail ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading details...</div>
          ) : (
            <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-3 gap-5">

              {/* Items list */}
              <div className="md:col-span-2 space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Items Ordered</p>
                {(displayOrder.items || []).map((item, i) => (
                  <div key={item._id || i} className="flex items-center gap-3 p-2 rounded-lg bg-background border border-border/40">
                    <div className="w-12 h-12 rounded-md bg-muted/50 overflow-hidden flex-shrink-0">
                      <img
                        src={resolveProductImages(item.product?.images || [])[0]}
                        alt={item.product?.name || 'Product'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.product?.name || 'Product'}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity} × {formatPrice(item.price || 0)}</p>
                    </div>
                    <p className="font-semibold text-sm flex-shrink-0">
                      {formatPrice(item.total || (item.price || 0) * item.quantity)}
                    </p>
                  </div>
                ))}

                {/* Price breakdown */}
                <div className="p-3 rounded-lg bg-background border border-border/40 mt-4 space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span><span>{formatPrice(displayOrder.subtotal || 0)}</span>
                  </div>
                  {displayOrder.discountAmount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Discount</span><span>-{formatPrice(displayOrder.discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>{(displayOrder.shippingFee || 0) === 0 ? 'Free' : formatPrice(displayOrder.shippingFee)}</span>
                  </div>
                  <Separator className="my-1" />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span><span>{formatPrice(displayOrder.grandTotal || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Right sidebar: address + payment + tracking */}
              <div className="space-y-4">
                {/* Shipping address */}
                <div className="p-3 rounded-lg bg-background border border-border/40">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> Delivery Address
                  </p>
                  {address ? (
                    <div className="text-sm space-y-0.5">
                      <p className="font-medium">{address.fullName}</p>
                      <p className="text-muted-foreground text-xs">{address.line1}{address.line2 ? ', ' + address.line2 : ''}</p>
                      <p className="text-muted-foreground text-xs">{address.city}, {address.state} – {address.postalCode}</p>
                      <p className="text-muted-foreground text-xs mt-1">📞 {address.phone}</p>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Address unavailable</p>
                  )}
                </div>

                {/* Payment details */}
                <div className="p-3 rounded-lg bg-background border border-border/40">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                    <CreditCard className="w-3.5 h-3.5" /> Payment
                  </p>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">Method</span>
                      <span className="font-medium text-xs">{displayOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground text-xs">Status</span>
                      <span className={`text-xs font-medium ${getPaymentStatusBadgeClass(displayOrder.paymentStatus)}`}>
                        {getPaymentStatusLabel(displayOrder.paymentStatus)}
                      </span>
                    </div>
                    {displayOrder.paymentSummary && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground text-xs">Paid</span>
                          <span className="text-xs font-medium">{formatPrice(displayOrder.paymentSummary.paidAmount || 0)}</span>
                        </div>
                        {displayOrder.paymentSummary.remainingAmount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground text-xs">Remaining</span>
                            <span className="text-xs font-medium text-destructive">{formatPrice(displayOrder.paymentSummary.remainingAmount)}</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Tracking */}
                {displayOrder.shipment?.trackingNumber && (
                  <div className="p-3 rounded-lg bg-background border border-border/40">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> Tracking
                    </p>
                    <p className="font-mono text-xs font-medium">{displayOrder.shipment.trackingNumber}</p>
                    {displayOrder.shipment.estimatedDeliveryDate && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {displayOrder.orderStatus === 'delivered' ? 'Delivered' : 'Expected'}:{' '}
                        {new Date(displayOrder.shipment.estimatedDeliveryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                )}

                {/* Customer notes */}
                {(displayOrder.notes || []).filter((n) => n.noteType === 'customer').length > 0 && (
                  <div className="p-3 rounded-lg bg-background border border-border/40">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5" /> Notes
                    </p>
                    {(displayOrder.notes || []).filter((n) => n.noteType === 'customer').map((note) => (
                      <p key={note._id || note.createdAt} className="text-xs text-foreground">{note.noteContent}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
const OrdersV2 = () => {
  const { user, isAuthenticated, accessToken, loading: authLoading } = useAuth();
  const [orders, setOrders]           = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy]           = useState('date-desc');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!isAuthenticated || !accessToken) { setOrders([]); setLoadingOrders(false); return; }
      setLoadingOrders(true);
      try {
        const data = await getMyOrders(accessToken, { includeItems: true });
        setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error('[ORDERS V2] failed', e);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };
    load();
  }, [isAuthenticated, accessToken]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((o) =>
        o.orderNumber?.toLowerCase().includes(q) ||
        (o.items || []).some((i) => i.product?.name?.toLowerCase().includes(q))
      );
    }
    if (statusFilter !== 'all') result = result.filter((o) => o.orderStatus === statusFilter);
    switch (sortBy) {
      case 'date-asc':    result.sort((a, b) => new Date(a.placedAt || a.createdAt) - new Date(b.placedAt || b.createdAt)); break;
      case 'date-desc':   result.sort((a, b) => new Date(b.placedAt || b.createdAt) - new Date(a.placedAt || a.createdAt)); break;
      case 'amount-asc':  result.sort((a, b) => (a.grandTotal || 0) - (b.grandTotal || 0)); break;
      case 'amount-desc': result.sort((a, b) => (b.grandTotal || 0) - (a.grandTotal || 0)); break;
    }
    return result;
  }, [orders, searchQuery, statusFilter, sortBy]);

  // ── Guards ────────────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center text-muted-foreground">Loading...</div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/40 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Please Login</h1>
          <p className="text-muted-foreground mb-6">You need to login to view your orders.</p>
          <Button asChild><Link href="/login">Login</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-6xl">

        {/* ── Page Header ── */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
            <p className="text-sm text-muted-foreground">
              {loadingOrders ? 'Loading…' : `${orders.length} order${orders.length !== 1 ? 's' : ''} placed`}
            </p>
          </div>

        </div>

        <div className="flex gap-6">

          {/* ── Sidebar filters (desktop) ── */}
          <aside className="hidden lg:block w-56 flex-shrink-0 space-y-4">
            <div className="bg-card rounded-xl border border-border/50 p-4 sticky top-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Filter by Status</p>
              <ul className="space-y-1">
                <li>
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between
                      ${statusFilter === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
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
                        onClick={() => setStatusFilter(status)}
                        className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between
                          ${statusFilter === status ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
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
                {SORT_OPTIONS.map((opt) => (
                  <li key={opt.value}>
                    <button
                      onClick={() => setSortBy(opt.value)}
                      className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors
                        ${sortBy === opt.value ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                    >
                      {opt.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* ── Main content ── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Search bar + mobile filter toggle */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search order number or product…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button
                variant="outline"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
            </div>

            {/* Active filter chips */}
            {(statusFilter !== 'all' || sortBy !== 'date-desc') && (
              <div className="flex flex-wrap gap-2">
                {statusFilter !== 'all' && (
                  <span className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1">
                    {getOrderStatusLabel(statusFilter)}
                    <button onClick={() => setStatusFilter('all')}><X className="w-3 h-3 ml-0.5" /></button>
                  </span>
                )}
                {sortBy !== 'date-desc' && (
                  <span className="flex items-center gap-1 text-xs bg-muted text-muted-foreground border border-border rounded-full px-3 py-1">
                    {SORT_OPTIONS.find((s) => s.value === sortBy)?.label}
                    <button onClick={() => setSortBy('date-desc')}><X className="w-3 h-3 ml-0.5" /></button>
                  </span>
                )}
              </div>
            )}

            {/* Results count */}
            {!loadingOrders && (
              <p className="text-xs text-muted-foreground">
                Showing {filteredOrders.length} of {orders.length} orders
              </p>
            )}

            {/* Order list */}
            {loadingOrders ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border border-border/40 rounded-xl p-5 bg-card">
                    <div className="animate-pulse space-y-3">
                      <div className="flex gap-4">
                        <div className="w-14 h-14 rounded-lg bg-muted" />
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-muted rounded w-40" />
                          <div className="h-3 bg-muted rounded w-56" />
                          <div className="h-3 bg-muted rounded w-32" />
                        </div>
                        <div className="w-24 space-y-2">
                          <div className="h-5 bg-muted rounded" />
                          <div className="h-3 bg-muted rounded" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div className="text-center py-20 bg-card rounded-xl border border-border/50">
                <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  {searchQuery || statusFilter !== 'all' ? 'No orders found' : 'No orders yet'}
                </h2>
                <p className="text-muted-foreground mb-6 text-sm">
                  {searchQuery || statusFilter !== 'all' ? 'Try adjusting your search or filters' : 'Start shopping to see your orders here'}
                </p>
                {searchQuery || statusFilter !== 'all' ? (
                  <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
                    Clear Filters
                  </Button>
                ) : (
                  <Link href="/categories"><Button>Browse Products</Button></Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredOrders.map((order, i) => (
                  <OrderRow key={order._id || i} order={order} accessToken={accessToken} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile sidebar drawer ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-72 bg-background shadow-xl p-5 overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <p className="font-semibold">Filters & Sort</p>
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Filter by Status</p>
            <ul className="space-y-1 mb-4">
              <li>
                <button onClick={() => { setStatusFilter('all'); setSidebarOpen(false); }}
                  className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between
                    ${statusFilter === 'all' ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
                >
                  <span>All Orders</span><span className="text-xs">{orders.length}</span>
                </button>
              </li>
              {ORDER_STATUS_FILTERS.map((status) => {
                const count = orders.filter((o) => o.orderStatus === status).length;
                return (
                  <li key={status}>
                    <button onClick={() => { setStatusFilter(status); setSidebarOpen(false); }}
                      className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors flex items-center justify-between
                        ${statusFilter === status ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
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
              {SORT_OPTIONS.map((opt) => (
                <li key={opt.value}>
                  <button
                    onClick={() => { setSortBy(opt.value); setSidebarOpen(false); }}
                    className={`w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors
                      ${sortBy === opt.value ? 'bg-primary/10 text-primary font-semibold' : 'text-muted-foreground hover:bg-muted'}`}
                  >
                    {opt.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default OrdersV2;
