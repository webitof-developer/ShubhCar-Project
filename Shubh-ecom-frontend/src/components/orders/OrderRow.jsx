import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Calendar, Truck, MapPin, CreditCard, ChevronDown, ChevronUp, FileText, Package } from 'lucide-react';
import { getOrder } from '@/services/orderService';
import { getAddressById } from '@/services/userAddressService';
import { resolveProductImages } from '@/utils/media';
import { formatPrice } from '@/services/pricingService';
import APP_CONFIG from '@/config/app.config';
import { OrderTimeline } from './OrderTimeline';
import {
  getOrderStatusBadgeClass,
  getOrderStatusIcon,
  getOrderStatusLabel,
  getPaymentStatusBadgeClass,
  getPaymentStatusLabel,
} from '@/constants/orderStatus';

export function OrderRow({ order, accessToken }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [address, setAddress] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('ordered_by_mistake');
  const [cancelDetails, setCancelDetails] = useState('');
  const [confirmRequest, setConfirmRequest] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const displayItems = (order.items || []).slice(0, 3);
  const remainingCount = (order.items || []).length - 3;
  const displayOrder = detail || order;
  const supportEmail = APP_CONFIG?.site?.contact?.email || 'support@autospares.com';
  const requestKey = `cancel_request_${order?._id}`;
  const cancellableStatuses = new Set(['created', 'pending_payment', 'confirmed', 'on_hold']);
  const isCancellationEligible = cancellableStatuses.has(displayOrder?.orderStatus);

  useEffect(() => {
    if (!order?._id || typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(requestKey);
    setRequestSubmitted(Boolean(stored));
  }, [order?._id, requestKey]);

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

  const submitCancellationRequest = () => {
    if (typeof window === 'undefined') return;

    const reasonMap = {
      ordered_by_mistake: 'Ordered by mistake',
      address_issue: 'Address issue',
      delayed_delivery: 'Delayed delivery',
      duplicate_order: 'Duplicate order',
      other: 'Other',
    };

    const subject = `Cancellation Request: Order #${displayOrder?.orderNumber || displayOrder?._id}`;
    const body = [
      'Hello Team,',
      '',
      'I want to request cancellation for this order:',
      `Order Number: ${displayOrder?.orderNumber || 'N/A'}`,
      `Order ID: ${displayOrder?._id || 'N/A'}`,
      `Order Status: ${displayOrder?.orderStatus || 'N/A'}`,
      `Reason: ${reasonMap[cancelReason] || cancelReason}`,
      `Details: ${cancelDetails?.trim() || 'N/A'}`,
      '',
      'I understand this is a cancellation request and will be reviewed by admin.',
    ].join('\n');

    const mailtoUrl = `mailto:${supportEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    window.localStorage.setItem(
      requestKey,
      JSON.stringify({
        requestedAt: new Date().toISOString(),
        reason: cancelReason,
      }),
    );
    setRequestSubmitted(true);
    setRequestOpen(false);
    setConfirmRequest(false);
    setCancelDetails('');
  };

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
                className="relative w-14 h-14 rounded-lg bg-muted/50 overflow-hidden border-2 border-card flex-shrink-0"
                style={{ zIndex: displayItems.length - i }}
              >
                <Image
                  src={resolveProductImages(item.product?.images || [])[0] || '/placeholder.jpg'}
                  alt={item.product?.name || 'Product'}
                  fill
                  sizes="56px"
                  className="object-cover"
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
                    <div className="relative w-12 h-12 rounded-md bg-muted/50 overflow-hidden flex-shrink-0">
                      <Image
                        src={resolveProductImages(item.product?.images || [])[0] || '/placeholder.jpg'}
                        alt={item.product?.name || 'Product'}
                        fill
                        sizes="48px"
                        className="object-cover"
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

                {/* Cancellation request */}
                <div className="p-3 rounded-lg bg-background border border-border/40">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                    Cancellation
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Cancellation is available before shipment and requires admin approval.
                  </p>
                  {requestSubmitted ? (
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 border-blue-500/30">
                      Cancellation Requested
                    </Badge>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs px-3"
                      disabled={!isCancellationEligible}
                      onClick={() => setRequestOpen(true)}
                    >
                      Request Cancellation
                    </Button>
                  )}
                  {!isCancellationEligible && !requestSubmitted && (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Request is disabled once order is shipped.
                    </p>
                  )}
                </div>

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

      <AlertDialog open={requestOpen} onOpenChange={setRequestOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request Order Cancellation</AlertDialogTitle>
            <AlertDialogDescription>
              This sends a cancellation request to support. Admin will review and cancel from dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground" htmlFor={`cancel-reason-${order?._id}`}>
                Reason
              </label>
              <select
                id={`cancel-reason-${order?._id}`}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="ordered_by_mistake">Ordered by mistake</option>
                <option value="address_issue">Address issue</option>
                <option value="delayed_delivery">Delayed delivery</option>
                <option value="duplicate_order">Duplicate order</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground" htmlFor={`cancel-details-${order?._id}`}>
                Additional Details (Optional)
              </label>
              <textarea
                id={`cancel-details-${order?._id}`}
                rows={3}
                maxLength={500}
                value={cancelDetails}
                onChange={(e) => setCancelDetails(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                placeholder="Add any extra details for admin review"
              />
            </div>

            <label className="flex items-start gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={confirmRequest}
                onChange={(e) => setConfirmRequest(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-input"
              />
              <span>I understand this is a request, not an instant cancellation.</span>
            </label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              disabled={!confirmRequest}
              onClick={(e) => {
                if (!confirmRequest) {
                  e.preventDefault();
                  return;
                }
                submitCancellationRequest();
              }}
              className={!confirmRequest ? 'opacity-60' : ''}
            >
              Submit Request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
