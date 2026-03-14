import { useEffect, useState } from 'react';
import Link from 'next/link';
import { SafeImage } from '@/components/common/SafeImage';
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
import {
  Calendar,
  Truck,
  MapPin,
  CreditCard,
  ChevronDown,
  ChevronUp,
  FileText,
  Package,
} from 'lucide-react';
import { getOrder, cancelOrder } from '@/services/orderService';
import { toast } from 'sonner';
import { getAddressById } from '@/services/userAddressService';
import { resolveProductImages } from '@/utils/media';
import { formatPrice } from '@/services/pricingService';
import APP_CONFIG from '@/config/app.config';
import { OrderTimeline } from './OrderTimeline';
import { logger } from '@/utils/logger';
import {
  getOrderStatusBadgeClass,
  getOrderStatusIcon,
  getOrderStatusLabel,
  getPaymentStatusBadgeClass,
  getPaymentStatusLabel,
} from '@/constants/orderStatus';

const getItemName = (item = {}) =>
  item?.product?.name ||
  item?.productName ||
  item?.name ||
  item?.title ||
  item?.snapshot?.name ||
  item?.productSnapshot?.name ||
  'Product';

const getItemImages = (item = {}) =>
  item?.product?.images ||
  item?.productImage ||
  item?.snapshot?.images ||
  item?.productSnapshot?.images ||
  [];

export function OrderRow({ order, accessToken }) {
  const [expanded, setExpanded] = useState(false);
  const [detail, setDetail] = useState(null);
  const [address, setAddress] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [requestOpen, setRequestOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('ordered_by_mistake');
  const [cancelDetails, setCancelDetails] = useState('');
  const [confirmRequest, setConfirmRequest] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [requestSubmitted, setRequestSubmitted] = useState(false);

  const displayOrder = detail || order;
  const displayItems = (displayOrder.items || []).slice(0, 3);
  const remainingCount = (displayOrder.items || []).length - 3;
  const supportEmail =
    APP_CONFIG?.site?.contact?.email || 'support@autospares.com';
  const requestKey = `cancel_request_${order?._id}`;
  const cancellableStatuses = new Set([
    'created',
    'pending_payment',
    'confirmed',
    'on_hold',
  ]);
  const isCancellationEligible = cancellableStatuses.has(
    displayOrder?.orderStatus,
  );
  const isPostShipment = ['shipped', 'out_for_delivery', 'delivered'].includes(
    displayOrder?.orderStatus,
  );
  const paymentMethodNormalized = String(
    displayOrder?.paymentMethod || '',
  ).toLowerCase();
  const isCodOrder =
    paymentMethodNormalized.includes('cod') ||
    paymentMethodNormalized.includes('cash');
  const isRazorpayOrder = paymentMethodNormalized.includes('razor');
  const hasCapturedPayment = ['paid', 'refunded'].includes(
    String(displayOrder?.paymentStatus || '').toLowerCase(),
  );
  const normalizedPaymentStatus =
    displayOrder?.orderStatus === 'cancelled' &&
    displayOrder?.paymentStatus === 'pending'
      ? 'failed'
      : displayOrder?.paymentStatus;

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
          const merged = res?.order
            ? {
                ...order,
                ...res.order,
                items: res.items || order.items || [],
                shipment: res.shipments?.[0] || order.shipment,
                notes: res.notes || [],
              }
            : order;
          setDetail(merged);
          if (merged.shippingAddressId) {
            const addr = await getAddressById(
              merged.shippingAddressId,
              accessToken,
            );
            setAddress(addr || null);
          }
        } catch (e) {
          logger.error('[OrderRow] load detail error', e);
          setDetail(order);
        } finally {
          setLoadingDetail(false);
        }
      }
    }
    setExpanded((p) => !p);
  };

  const handleCancelOrder = async () => {
    if (typeof window === 'undefined') return;

    try {
      setIsCancelling(true);
      await cancelOrder(accessToken, displayOrder._id, cancelReason, cancelDetails);

      toast.success('Order cancelled successfully.');

      // Instantly update the UI local state
      setDetail((prev) => ({
        ...(prev || displayOrder),
        orderStatus: 'cancelled',
        cancelReason,
        cancelDetails,
        paymentStatus: ['paid', 'refunded'].includes(
          String(displayOrder?.paymentStatus || '').toLowerCase(),
        )
          ? 'refunded'
          : 'failed',
      }));

      setRequestOpen(false);
      setCancelDetails('');
    } catch (err) {
      toast.error(
        err.message || 'Failed to cancel the order. Please try again.',
      );
    } finally {
      setIsCancelling(false);
      setConfirmRequest(false);
    }
  };

  return (
    <div className='group border border-border/60 rounded-xl overflow-hidden bg-card hover:border-primary/30 transition-colors'>
      {/* ── Summary Row ── */}
      <div className='p-4 md:p-5'>
        <div className='flex flex-col sm:flex-row sm:items-start gap-4'>
          {/* Product thumbnails */}
          <div className='flex -space-x-2 flex-shrink-0'>
            {displayItems.map((item, i) => (
              <div
                key={item._id || i}
                className='relative w-14 h-14 rounded-lg bg-muted/50 overflow-hidden border-2 border-card flex-shrink-0'
                style={{ zIndex: displayItems.length - i }}>
                <SafeImage
                  src={
                    resolveProductImages(getItemImages(item))[0] ||
                    '/placeholder.jpg'
                  }
                  alt={getItemName(item)}
                  fill
                  sizes='56px'
                  className='object-cover'
                />
              </div>
            ))}
            {remainingCount > 0 && (
              <div className='w-14 h-14 rounded-lg bg-muted/50 border-2 border-card flex items-center justify-center flex-shrink-0'>
                <span className='text-xs font-semibold text-muted-foreground'>
                  +{remainingCount}
                </span>
              </div>
            )}
          </div>

          {/* Order meta */}
          <div className='flex-1 min-w-0'>
            <div className='flex flex-wrap items-center gap-2 mb-1'>
              <span className='font-bold text-foreground text-sm'>
                #{displayOrder.orderNumber}
              </span>
              <Badge
                variant='outline'
                className={`${getOrderStatusBadgeClass(displayOrder.orderStatus)} flex items-center gap-1 text-xs`}>
                {getOrderStatusIcon(displayOrder.orderStatus, 'w-3 h-3')}
                {getOrderStatusLabel(displayOrder.orderStatus)}
              </Badge>
              {!isCodOrder && (
                <Badge
                  variant='outline'
                  className={`${getPaymentStatusBadgeClass(normalizedPaymentStatus)} text-xs`}>
                  {getPaymentStatusLabel(normalizedPaymentStatus)}
                </Badge>
              )}
            </div>

            {/* Product names */}
            <p className='text-sm text-foreground font-medium truncate'>
              {(displayOrder.items || [])
                .map((i) => getItemName(i))
                .filter(Boolean)
                .slice(0, 2)
                .join(', ')}
              {(displayOrder.items || []).length > 2 &&
                ` +${(displayOrder.items || []).length - 2} more`}
            </p>

            <div className='flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap'>
              <span className='flex items-center gap-1'>
                <Calendar className='w-3.5 h-3.5' />
                {new Date(
                  displayOrder.placedAt || displayOrder.createdAt,
                ).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              <span className='flex items-center gap-1'>
                <Package className='w-3.5 h-3.5' />
                {(displayOrder.items || []).length}{' '}
                {(displayOrder.items || []).length === 1 ? 'item' : 'items'}
              </span>
              {displayOrder.shipment?.trackingNumber && (
                <span className='flex items-center gap-1'>
                  <Truck className='w-3.5 h-3.5' />
                  {displayOrder.shipment.trackingNumber}
                </span>
              )}
            </div>

            {/* Compact timeline: desktop hover only while collapsed */}
            {!expanded ? (
              <div className='mt-3 hidden md:group-hover:block'>
                <OrderTimeline status={displayOrder.orderStatus} />
              </div>
            ) : null}
          </div>

          {/* Price + actions */}
          <div className='flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 flex-shrink-0'>
            <div className='text-right'>
              <p className='font-bold text-lg text-foreground leading-tight'>
                {formatPrice(displayOrder.grandTotal || 0)}
              </p>
              <p className='text-xs text-muted-foreground'>
                {displayOrder.paymentMethod}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <Link
                href={hasCapturedPayment ? `/invoice/${displayOrder._id}` : '#'}
                target={hasCapturedPayment ? '_blank' : undefined}
                onClick={(event) => {
                  if (!hasCapturedPayment) {
                    event.preventDefault();
                    toast.error('Invoice is not available yet. It becomes available after successful payment capture.');
                  }
                }}>
                <Button variant='ghost' size='sm' className='h-8 text-xs px-2' disabled={!hasCapturedPayment}>
                  <FileText className='w-3.5 h-3.5 mr-1' />
                  Invoice
                </Button>
              </Link>
              <Button
                variant='outline'
                size='sm'
                className='h-8 text-xs px-3'
                onClick={handleExpand}>
                {expanded ? (
                  <>
                    <ChevronUp className='w-3.5 h-3.5 mr-1' />
                    Hide
                  </>
                ) : (
                  <>
                    <ChevronDown className='w-3.5 h-3.5 mr-1' />
                    Details
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Expanded Detail Panel ── */}
      {expanded && (
        <div className='border-t border-border/50 bg-muted/20'>
          {loadingDetail ? (
            <div className='p-6 text-center text-sm text-muted-foreground'>
              Loading details...
            </div>
          ) : (
            <div className='p-4 md:p-5 grid grid-cols-1 md:grid-cols-3 gap-5'>
              {/* Items list */}
              <div className='md:col-span-2 space-y-3'>
                <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2'>
                  Items Ordered
                </p>
                {(displayOrder.items || []).map((item, i) => (
                  <div
                    key={item._id || i}
                    className='flex items-center gap-3 p-2 rounded-lg bg-background border border-border/40'>
                    <div className='relative w-12 h-12 rounded-md bg-muted/50 overflow-hidden flex-shrink-0'>
                      <SafeImage
                        src={
                          resolveProductImages(getItemImages(item))[0] ||
                          '/placeholder.jpg'
                        }
                        alt={getItemName(item)}
                        fill
                        sizes='48px'
                        className='object-cover'
                      />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <p className='text-sm font-medium truncate'>
                        {getItemName(item)}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Qty: {item.quantity} × {formatPrice(item.price || 0)}
                      </p>
                    </div>
                    <p className='font-semibold text-sm flex-shrink-0'>
                      {formatPrice(
                        item.total || (item.price || 0) * item.quantity,
                      )}
                    </p>
                  </div>
                ))}

                {/* Price breakdown */}
                <div className='p-3 rounded-lg bg-background border border-border/40 mt-4 space-y-1 text-sm'>
                  <div className='flex justify-between text-muted-foreground'>
                    <span>Subtotal</span>
                    <span>{formatPrice(displayOrder.subtotal || 0)}</span>
                  </div>
                  {displayOrder.discountAmount > 0 && (
                    <div className='flex justify-between text-green-600'>
                      <span>Discount</span>
                      <span>-{formatPrice(displayOrder.discountAmount)}</span>
                    </div>
                  )}
                  <div className='flex justify-between text-muted-foreground'>
                    <span>Shipping</span>
                    <span>
                      {(displayOrder.shippingFee || 0) === 0
                        ? 'Free'
                        : formatPrice(displayOrder.shippingFee)}
                    </span>
                  </div>
                  <Separator className='my-1' />
                  <div className='flex justify-between font-bold text-base'>
                    <span>Total</span>
                    <span>{formatPrice(displayOrder.grandTotal || 0)}</span>
                  </div>
                </div>

                <div className='mt-4 p-3 rounded-lg bg-background border border-border/40'>
                  <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3'>
                    Order Progress
                  </p>
                  <OrderTimeline status={displayOrder.orderStatus} />
                </div>
              </div>

              {/* Right sidebar: address + payment + tracking */}
              <div className='space-y-4'>
                {/* Shipping address */}
                <div className='p-3 rounded-lg bg-background border border-border/40'>
                  <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1'>
                    <MapPin className='w-3.5 h-3.5' /> Delivery Address
                  </p>
                  {address ? (
                    <div className='text-sm space-y-0.5'>
                      <p className='font-medium'>{address.fullName}</p>
                      <p className='text-muted-foreground text-xs'>
                        {address.line1}
                        {address.line2 ? ', ' + address.line2 : ''}
                      </p>
                      <p className='text-muted-foreground text-xs'>
                        {address.city}, {address.state} – {address.postalCode}
                      </p>
                      <p className='text-muted-foreground text-xs mt-1'>
                        📞 {address.phone}
                      </p>
                    </div>
                  ) : (
                    <p className='text-xs text-muted-foreground'>
                      Address unavailable
                    </p>
                  )}
                </div>

                {/* Payment details */}
                <div className='p-3 rounded-lg bg-background border border-border/40'>
                  <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1'>
                    <CreditCard className='w-3.5 h-3.5' /> Payment
                  </p>
                  <div className='text-sm space-y-1'>
                    <div className='flex justify-between'>
                      <span className='text-muted-foreground text-xs'>
                        Method
                      </span>
                      <span className='font-medium text-xs'>
                        {displayOrder.paymentMethod}
                      </span>
                    </div>
                    {!isCodOrder && (
                      <div className='flex justify-between'>
                        <span className='text-muted-foreground text-xs'>
                          Status
                        </span>
                        <span
                          className={`text-xs font-medium ${getPaymentStatusBadgeClass(normalizedPaymentStatus)}`}>
                          {getPaymentStatusLabel(normalizedPaymentStatus)}
                        </span>
                      </div>
                    )}
                    {displayOrder.paymentSummary && (
                      <>
                        <div className='flex justify-between'>
                          <span className='text-muted-foreground text-xs'>
                            Paid
                          </span>
                          <span className='text-xs font-medium'>
                            {formatPrice(
                              displayOrder.paymentSummary.paidAmount || 0,
                            )}
                          </span>
                        </div>
                        {displayOrder.paymentSummary.remainingAmount > 0 && (
                          <div className='flex justify-between'>
                            <span className='text-muted-foreground text-xs'>
                              Remaining
                            </span>
                            <span className='text-xs font-medium text-destructive'>
                              {formatPrice(
                                displayOrder.paymentSummary.remainingAmount,
                              )}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Tracking */}
                {displayOrder.shipment?.trackingNumber && (
                  <div className='p-3 rounded-lg bg-background border border-border/40'>
                    <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1'>
                      <Truck className='w-3.5 h-3.5' /> Tracking
                    </p>
                    <p className='font-mono text-xs font-medium'>
                      {displayOrder.shipment.trackingNumber}
                    </p>
                    {displayOrder.shipment.estimatedDeliveryDate && (
                      <p className='text-xs text-muted-foreground mt-1'>
                        {displayOrder.orderStatus === 'delivered'
                          ? 'Delivered'
                          : 'Expected'}
                        :{' '}
                        {new Date(
                          displayOrder.shipment.estimatedDeliveryDate,
                        ).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                )}

                {/* Cancellation & Support Block */}
                <div className='p-3 rounded-lg bg-background border border-border/40'>
                  {isCancellationEligible ? (
                    <>
                      <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2'>
                        Cancellation
                      </p>
                      <p className='text-[11px] text-muted-foreground mb-3'>
                        You can cancel your order directly before it ships.
                      </p>
                      <Button
                        type='button'
                        size='sm'
                        variant='outline'
                        className='h-8 text-xs px-3 border-destructive/20 text-destructive hover:bg-destructive/10 transition-colors'
                        onClick={() => setRequestOpen(true)}>
                        Cancel Order
                      </Button>
                    </>
                  ) : displayOrder?.orderStatus === 'cancelled' ||
                    displayOrder?.orderStatus === 'returned' ? (
                    <>
                      <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2'>
                        Support
                      </p>
                      <p className='text-[11px] text-muted-foreground'>
                        This order has been {displayOrder?.orderStatus}. Please
                        contact support if you need assistance.
                      </p>
                      <p className='text-[11px] text-muted-foreground mt-2'>
                        {hasCapturedPayment
                          ? 'Any credit note issued for this order is an accounting document. Refund settlement is tracked separately and may take 5-7 business days.'
                          : 'This order was cancelled before payment capture. No refund is pending.'}
                      </p>
                      {displayOrder?.orderStatus === 'cancelled' &&
                        isRazorpayOrder && (
                          <p className='text-[11px] text-muted-foreground mt-2'>
                            Razorpay orders: if payment was debited, refund is
                            processed to the original payment source. Contact
                            support for a status update.
                          </p>
                        )}
                    </>
                  ) : isPostShipment ? (
                    <>
                      <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2'>
                        Contact Support
                      </p>
                      <p className='text-[11px] text-muted-foreground mb-3'>
                        This order has already been shipped or delivered. For
                        any returns or cancellations, please contact our support
                        team.
                      </p>
                      <div className='flex gap-2'>
                        <Link
                          href={`mailto:${supportEmail}?subject=Support for Order #${displayOrder?.orderNumber}`}
                          target='_blank'>
                          <Button
                            size='sm'
                            variant='secondary'
                            className='h-8 text-[11px] px-3'>
                            Email Support
                          </Button>
                        </Link>
                      </div>
                    </>
                  ) : null}
                </div>

                {/* Customer notes */}
                {(displayOrder.notes || []).filter(
                  (n) => n.noteType === 'customer',
                ).length > 0 && (
                  <div className='p-3 rounded-lg bg-background border border-border/40'>
                    <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1'>
                      <FileText className='w-3.5 h-3.5' /> Notes
                    </p>
                    {(displayOrder.notes || [])
                      .filter((n) => n.noteType === 'customer')
                      .map((note) => (
                        <p
                          key={note._id || note.createdAt}
                          className='text-xs text-foreground'>
                          {note.noteContent}
                        </p>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <AlertDialog open={requestOpen} onOpenChange={setRequestOpen}>
        <AlertDialogContent className="border border-zinc-200">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Your Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action is
              immediate and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className='space-y-3'>
            <div className='space-y-1'>
              <label
                className='text-xs font-medium text-foreground'
                htmlFor={`cancel-reason-${order?._id}`}>
                Reason for cancellation
              </label>
              <select
                id={`cancel-reason-${order?._id}`}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'>
                <option value='ordered_by_mistake'>Ordered by mistake</option>
                <option value='found_better_price'>Found a better price</option>
                <option value='delivery_too_long'>
                  Delivery taking too long
                </option>
                <option value='change_of_mind'>Change of mind</option>
                <option value='other'>Other</option>
              </select>
            </div>

            <div className='space-y-1'>
              <label
                className='text-xs font-medium text-foreground'
                htmlFor={`cancel-details-${order?._id}`}>
                Additional Details (Optional)
              </label>
              <textarea
                id={`cancel-details-${order?._id}`}
                rows={3}
                maxLength={500}
                value={cancelDetails}
                onChange={(e) => setCancelDetails(e.target.value)}
                className='w-full rounded-md border border-input bg-background px-3 py-2 text-sm'
                placeholder='Let us know more details...'
              />
            </div>

            <label className='flex items-start gap-2 text-xs text-muted-foreground'>
              <input
                type='checkbox'
                checked={confirmRequest}
                onChange={(e) => setConfirmRequest(e.target.checked)}
                className='mt-0.5 h-4 w-4 rounded border-input'
              />
              <span>
                I understand that checking this box will cancel my order
                immediately.
              </span>
            </label>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Close</AlertDialogCancel>
            <AlertDialogAction
              disabled={!confirmRequest || isCancelling}
              onClick={(e) => {
                if (!confirmRequest) {
                  e.preventDefault();
                  return;
                }
                handleCancelOrder();
              }}
              className={
                !confirmRequest || isCancelling
                  ? 'opacity-60'
                  : 'bg-destructive/90 text-destructive-foreground hover:bg-destructive'
              }>
              {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
