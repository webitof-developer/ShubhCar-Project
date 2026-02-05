//src/app/orders/page.jsx

"use client";

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Package,
  ChevronLeft,
  Calendar,
  Truck,
  MapPin,
  CreditCard,
  Search,
  Filter,
  ArrowUpDown,
  FileText,
  Eye,
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
} from '@/constants/orderStatus';

const Orders = () => {
  const { user, isAuthenticated, accessToken, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [loadingOrderDetail, setLoadingOrderDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');

  useEffect(() => {
    const loadOrders = async () => {
      if (!isAuthenticated || !accessToken) {
        setOrders([]);
        setLoadingOrders(false);
        return;
      }
      setLoadingOrders(true);
      try {
        const data = await getMyOrders(accessToken, { includeItems: true });
        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error('[ORDERS] Failed to load orders:', error);
        setOrders([]);
      } finally {
        setLoadingOrders(false);
      }
    };
    loadOrders();
  }, [isAuthenticated, accessToken]);

  useEffect(() => {
    const loadAddress = async () => {
      if (!selectedOrder?.shippingAddressId || !accessToken) {
        setSelectedAddress(null);
        return;
      }
      const address = await getAddressById(selectedOrder.shippingAddressId, accessToken);
      setSelectedAddress(address || null);
    };
    loadAddress();
  }, [selectedOrder?.shippingAddressId, accessToken]);

  useEffect(() => {
    const loadOrderDetail = async () => {
      if (!selectedOrder?._id || !accessToken) return;
      setLoadingOrderDetail(true);
      try {
        const detail = await getOrder(accessToken, selectedOrder._id);
        if (detail?.order) {
          setSelectedOrder((prev) => ({
            ...prev,
            ...detail.order,
            items: detail.items || prev?.items || [],
            shipment: detail.shipments?.[0] || prev?.shipment,
            notes: detail.notes || [],
          }));
        }
      } catch (error) {
        console.error('[ORDERS] Failed to load order detail:', error);
      } finally {
        setLoadingOrderDetail(false);
      }
    };
    loadOrderDetail();
  }, [selectedOrder?._id, accessToken]);

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.orderNumber?.toLowerCase().includes(query) ||
        (order.items || []).some(item => item.product?.name?.toLowerCase().includes(query))
      );
    }

    if (statusFilter !== 'all') {
      result = result.filter(order => order.orderStatus === statusFilter);
    }

    switch (sortBy) {
      case 'date-asc':
        result.sort((a, b) => new Date(a.placedAt || a.createdAt).getTime() - new Date(b.placedAt || b.createdAt).getTime());
        break;
      case 'date-desc':
        result.sort((a, b) => new Date(b.placedAt || b.createdAt).getTime() - new Date(a.placedAt || a.createdAt).getTime());
        break;
      case 'amount-asc':
        result.sort((a, b) => (a.grandTotal || 0) - (b.grandTotal || 0));
        break;
      case 'amount-desc':
        result.sort((a, b) => (b.grandTotal || 0) - (a.grandTotal || 0));
        break;
    }

    return result;
  }, [orders, searchQuery, statusFilter, sortBy]);

  if (authLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
          <h1 className="text-2xl font-bold mb-2">Please Login</h1>
          <p className="text-muted-foreground mb-6">You need to login to view your orders.</p>
          <Button asChild>
            <Link href="/login">Login</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  const OrderCard = ({ order }) => {
    const displayItems = (order.items || []).slice(0, 2);
    const remainingCount = (order.items || []).length - 2;

    return (
      <div 
        className="p-4 md:p-5 rounded-xl border border-border/50 bg-card hover:border-primary/30 hover:shadow-md transition-all"
      >
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="font-semibold text-foreground">#{order.orderNumber}</span>
              <Badge variant="outline" className={`${getOrderStatusBadgeClass(order.orderStatus)} flex items-center gap-1`}>
                {getOrderStatusIcon(order.orderStatus)}
                {getOrderStatusLabel(order.orderStatus)}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(order.placedAt || order.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className="flex items-center gap-1">
                <Package className="w-3.5 h-3.5" />
                {(order.items || []).length} {(order.items || []).length === 1 ? 'item' : 'items'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="font-bold text-lg text-foreground">
              {formatPrice(order.grandTotal || 0)}
            </p>
            <p className="text-xs text-muted-foreground">{order.paymentMethod}</p>
            <Badge variant="outline" className={`mt-2 ${getPaymentStatusBadgeClass(order.paymentStatus)}`}>
              {getPaymentStatusLabel(order.paymentStatus)}
            </Badge>
            {order.paymentSummary && (
              <p className="text-[11px] text-muted-foreground mt-2">
                Paid {formatPrice(order.paymentSummary.paidAmount || 0)} / Remaining {formatPrice(order.paymentSummary.remainingAmount || 0)}
              </p>
            )}
          </div>
        </div>

        <div className="border-t border-border/50 pt-4">
          <div className="flex items-center gap-3">
            <div className="flex -space-x-3">
              {displayItems.map((item, index) => (
                <div 
                  key={item._id || item.id || index} 
                  className="w-14 h-14 rounded-lg bg-secondary overflow-hidden border-2 border-card flex-shrink-0"
                  style={{ zIndex: displayItems.length - index }}
                >
                  <img
                    src={resolveProductImages(item.product?.images || [])[0]}
                    alt={item.product?.name || 'Product'}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
              {remainingCount > 0 && (
                <div 
                  className="w-14 h-14 rounded-lg bg-secondary border-2 border-card flex items-center justify-center flex-shrink-0"
                  style={{ zIndex: 0 }}
                >
                  <span className="text-sm font-medium text-muted-foreground">+{remainingCount}</span>
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{displayItems[0]?.product?.name}</p>
              {displayItems.length > 1 && (
                <p className="text-xs text-muted-foreground truncate">
                  {displayItems[1]?.product?.name}
                  {remainingCount > 0 && ` & ${remainingCount} more`}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => setSelectedOrder(order)}
          >
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </Button>
          <Link href={`/invoice/${order._id}`} target="_blank">
            <Button 
              variant="ghost" 
              size="sm"
            >
              <FileText className="w-4 h-4 mr-2" />
              Invoice
            </Button>
          </Link>
        </div>

        {order.shipment?.trackingNumber && order.orderStatus === 'shipped' && (
          <div className="mt-3 pt-3 border-t border-border/50">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Truck className="w-3.5 h-3.5" />
              Tracking: {order.shipment.trackingNumber}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6 md:py-8 max-w-4xl">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Orders</h1>
            <p className="text-sm text-muted-foreground">{orders.length} orders placed</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border/50 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by order number or product..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {ORDER_STATUS_FILTERS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {getOrderStatusLabel(status)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-44">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Newest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="amount-desc">Highest Amount</SelectItem>
                <SelectItem value="amount-asc">Lowest Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loadingOrders ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border/50">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Loading orders...</h2>
            <p className="text-muted-foreground mb-6">Please wait while we fetch your orders.</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-16 bg-card rounded-xl border border-border/50">
            <Package className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-semibold mb-2">
              {searchQuery || statusFilter !== 'all' ? 'No orders found' : 'No orders yet'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'Start shopping to see your orders here'}
            </p>
            {searchQuery || statusFilter !== 'all' ? (
              <Button variant="outline" onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}>
                Clear Filters
              </Button>
            ) : (
              <Link href="/categories">
                <Button>Browse Products</Button>
              </Link>
            )}
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-320px)] pr-4">
            <div className="space-y-4">
              {filteredOrders.map((order, index) => (
                <OrderCard key={order._id || order.id || index} order={order} />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      <Dialog
        open={!!selectedOrder}
        onOpenChange={(open) => {
          if (!open) {
            setSelectedOrder(null);
            setSelectedAddress(null);
          }
        }}
      >
        <DialogContent className="w-[95vw] sm:w-[90vw] md:max-w-[720px] max-h-[90vh] p-0 border-zinc-200">
          <DialogHeader className="px-6 py-4">
            <DialogTitle className="flex items-center gap-3">
              <span>Order #{selectedOrder?.orderNumber}</span>
              {selectedOrder && (
                <Badge variant="outline" className={`${getOrderStatusBadgeClass(selectedOrder.orderStatus)} flex items-center gap-1`}>
                  {getOrderStatusIcon(selectedOrder.orderStatus)}
                  {getOrderStatusLabel(selectedOrder.orderStatus)}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <ScrollArea className="max-h-[calc(90vh-100px)]">
              <div className="px-6 py-4 space-y-6">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  Ordered on {new Date(selectedOrder.placedAt || selectedOrder.createdAt).toLocaleDateString('en-IN', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Items ({(selectedOrder.items || []).length})
                  </h3>
                  <ScrollArea className={(selectedOrder.items || []).length > 3 ? 'h-60' : ''}>
                    <div className="space-y-3 pr-2">
                      {(selectedOrder.items || []).map((item, index) => (
                        <div key={item._id || item.id || index} className="flex items-center gap-4 p-3 rounded-lg bg-secondary/30">
                          <div className="w-16 h-16 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                            <img
                              src={resolveProductImages(item.product?.images || [])[0]}
                              alt={item.product?.name || 'Product'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{item.product?.name || 'Product'}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty: {item.quantity} · {formatPrice(item.price || 0)}
                            </p>
                          </div>
                          <p className="font-semibold">
                            {formatPrice(item.total || (item.price || 0) * item.quantity)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Price Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatPrice(selectedOrder.subtotal || 0)}</span>
                    </div>
                    {selectedOrder.discountAmount > 0 && (
                      <div className="flex justify-between text-success">
                        <span>Discount</span>
                        <span>-{formatPrice(selectedOrder.discountAmount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Shipping</span>
                      <span>{(selectedOrder.shippingFee || 0) === 0 ? 'Free' : formatPrice(selectedOrder.shippingFee)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-semibold text-base">
                      <span>Total</span>
                      <span>{formatPrice(selectedOrder.grandTotal || 0)}</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="w-4 h-4" />
                    Payment Details
                  </h3>
                  <div className="p-4 rounded-lg bg-secondary/30 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Method</span>
                      <span className="font-medium">{selectedOrder.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Payment Status</span>
                      <span className={`font-medium ${getPaymentStatusBadgeClass(selectedOrder.paymentStatus)}`}>
                        {getPaymentStatusLabel(selectedOrder.paymentStatus)}
                      </span>
                    </div>
                    {selectedOrder.paymentSummary && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total</span>
                          <span className="font-medium">{formatPrice(selectedOrder.paymentSummary.totalAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Paid</span>
                          <span className="font-medium">{formatPrice(selectedOrder.paymentSummary.paidAmount || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Remaining</span>
                          <span className="font-medium">{formatPrice(selectedOrder.paymentSummary.remainingAmount || 0)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    Shipping Address
                  </h3>
                  <div className="p-4 rounded-lg bg-secondary/30">
                    {selectedAddress ? (
                      <>
                        <p className="font-medium">{selectedAddress.fullName}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {selectedAddress.line1}
                          {selectedAddress.line2 && <>, {selectedAddress.line2}</>}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedAddress.city}, {selectedAddress.state} - {selectedAddress.postalCode}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Phone: {selectedAddress.phone}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">Address not available.</p>
                    )}
                  </div>
                </div>

                {(selectedOrder.notes || []).filter((note) => note.noteType === 'customer').length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Order Notes
                      </h3>
                      <div className="space-y-3">
                        {(selectedOrder.notes || [])
                          .filter((note) => note.noteType === 'customer')
                          .map((note) => (
                            <div key={note._id || note.createdAt} className="p-3 rounded-lg bg-secondary/30">
                              <p className="text-sm text-foreground">{note.noteContent || '-'}</p>
                              <p className="text-xs text-muted-foreground mt-2">
                                {note.createdAt
                                  ? new Date(note.createdAt).toLocaleString('en-IN', {
                                      day: '2-digit',
                                      month: 'short',
                                      year: 'numeric',
                                      hour: 'numeric',
                                      minute: 'numeric',
                                    })
                                  : ''}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </>
                )}

                {selectedOrder.shipment?.trackingNumber && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-3 flex items-center gap-2">
                        <Truck className="w-4 h-4" />
                        Tracking Information
                      </h3>
                      <div className="p-4 rounded-lg bg-secondary/30">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Tracking Number</span>
                          <span className="font-medium font-mono">{selectedOrder.shipment.trackingNumber}</span>
                        </div>
                        {selectedOrder.shipment.estimatedDeliveryDate && (
                          <div className="flex justify-between text-sm mt-2">
                            <span className="text-muted-foreground">
                              {selectedOrder.orderStatus === 'delivered' ? 'Delivered On' : 'Expected Delivery'}
                            </span>
                            <span className="font-medium">
                              {new Date(selectedOrder.shipment.estimatedDeliveryDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                <div className="pt-4">
                    <Link href={`/invoice/${selectedOrder._id}`} target="_blank">
                      <Button variant="outline" className="w-full">
                        <FileText className="w-4 h-4 mr-2" />
                        View Invoice
                      </Button>
                    </Link>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Orders;
