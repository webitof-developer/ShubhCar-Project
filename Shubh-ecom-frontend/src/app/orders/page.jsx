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
import { OrderTimeline } from '@/components/orders/OrderTimeline';
import { OrderRow } from '@/components/orders/OrderRow';
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
