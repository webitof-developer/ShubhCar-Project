import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Check, X, Tag, Ticket, Copy, Info, Truck, Shield, Package, Loader2 } from 'lucide-react';
import QuotationButton from '@/components/cart/QuotationButton';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { formatPrice } from '@/services/pricingService';
import { formatTaxBreakdown, getTaxSuffix } from '@/services/taxDisplayService';

export const CartSummary = ({
  items,
  summary,
  user,
  cartTaxLabel,
  showIncludingTax,
  summarySubtotal,
  summaryDiscount,
  summaryTax,
  summaryTotal,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  handleRemoveCoupon,
  couponDialogOpen,
  setCouponDialogOpen,
  availableCoupons,
  handleApplyCouponFromDialog,
  handleCopyCouponCode,
  copiedCoupon,
  formatCouponValue,
  onProceedToCheckout,
  proceedLoading = false,
  couponLoading = false,
  summaryLoading = false,
}) => {
  return (
    <div className="bg-card rounded-xl border border-border/50 overflow-hidden sticky top-20">
      <div className="bg-secondary/30 px-5 py-4 border-b border-border/50">
        <h3 className="font-semibold text-foreground">Order Summary</h3>
      </div>
      <div className="p-5 space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">
            {summary?.couponCode ? 'Coupon Applied' : 'Have a Coupon?'}
          </label>

          {summary?.couponCode ? (
            // Applied coupon state
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-green-50  border border-green-400 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <div>
                    <p className="font-semibold text-sm text-green-400 ">{summary.couponCode}</p>
                    <p className="text-xs text-green-400">
                      You save {formatPrice(summaryDiscount)}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-red-100 dark:hover:bg-red-900/20"
                  onClick={handleRemoveCoupon}
                  disabled={couponLoading}
                >
                  {couponLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                  ) : (
                    <X className="w-4 h-4 text-red-600 dark:text-red-400" />
                  )}
                </Button>
              </div>

              {/* View Available link even when applied */}
              <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" className="h-auto p-0 text-xs text-primary hover:underline">
                    View other available coupons
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] border-border">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-primary" />
                      Available Coupons
                    </DialogTitle>
                    <DialogDescription>
                      Choose a coupon to apply to your order
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {availableCoupons.map((coupon) => (
                      <div
                        key={coupon.code}
                        className={`p-4 rounded-lg border-2 transition-all ${summary?.couponCode === coupon.code
                          ? 'border-dashed border-green-400 bg-green-50'
                          : 'border-border hover:border-primary/50'
                          }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Tag className="w-4 h-4 text-primary" />
                              <h4 className="font-bold text-foreground">{coupon.code}</h4>
                              {summary?.couponCode === coupon.code && (
                                <Check className="w-4 h-4 text-green-600" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {coupon.minOrderAmount
                                ? `Min order ${formatPrice(coupon.minOrderAmount)}`
                                : 'No minimum order'}
                            </p>
                            <p className="text-xs text-primary font-semibold">
                              {formatCouponValue(coupon)}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            {summary?.couponCode === coupon.code ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs"
                                disabled
                              >
                                Applied
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                className="text-xs"
                                onClick={() => handleApplyCouponFromDialog(coupon)}
                                disabled={couponLoading}
                              >
                                {couponLoading ? (
                                  <span className="inline-flex items-center gap-1">
                                    <Loader2 className="w-3 h-3 animate-spin" /> Applying
                                  </span>
                                ) : (
                                  'Apply'
                                )}
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs"
                              onClick={() => handleCopyCouponCode(coupon.code)}
                            >
                              {copiedCoupon === coupon.code ? (
                                <>
                                  <Check className="w-3 h-3 mr-1 text-green-600" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            // Input state
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  className="flex-1 h-8 bg-secondary/50 border-0 rounded-lg focus-visible:ring-2 focus-visible:ring-primary/20"
                />
                <Button
                  onClick={handleApplyCoupon}
                  className="h-8 px-6"
                  disabled={!couponCode.trim() || couponLoading}
                >
                  {couponLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Applying...
                    </>
                  ) : (
                    <>
                      <Tag className="w-4 h-4 mr-2" />
                      Apply
                    </>
                  )}
                </Button>
              </div>

              {/* View Available link */}
              <Dialog open={couponDialogOpen} onOpenChange={setCouponDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" className="h-auto p-0 text-xs text-primary hover:underline">
                    View available coupons
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px] border-border">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Ticket className="w-5 h-5 text-primary" />
                      Available Coupons
                    </DialogTitle>
                    <DialogDescription>
                      Choose a coupon to apply to your order
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {availableCoupons.map((coupon) => (
                      <div
                        key={coupon.code}
                        className="p-4 rounded-lg border-2 border-border hover:border-primary/50 transition-all"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Tag className="w-4 h-4 text-primary" />
                              <h4 className="font-bold text-foreground">{coupon.code}</h4>
                            </div>
                            <p className="text-sm text-muted-foreground mb-2">
                              {coupon.minOrderAmount
                                ? `Min order ${formatPrice(coupon.minOrderAmount)}`
                                : 'No minimum order'}
                            </p>
                            <p className="text-xs text-primary font-semibold">
                              {formatCouponValue(coupon)}
                            </p>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Button
                              size="sm"
                              className="text-xs"
                              onClick={() => handleApplyCouponFromDialog(coupon)}
                              disabled={couponLoading}
                            >
                              {couponLoading ? (
                                <span className="inline-flex items-center gap-1">
                                  <Loader2 className="w-3 h-3 animate-spin" /> Applying
                                </span>
                              ) : (
                                'Apply'
                              )}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-xs"
                              onClick={() => handleCopyCouponCode(coupon.code)}
                            >
                              {copiedCoupon === coupon.code ? (
                                <>
                                  <Check className="w-3 h-3 mr-1 text-green-600" />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3 h-3 mr-1" />
                                  Copy
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
        
        <div className="space-y-3 pt-2">
          {summaryLoading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-5/6" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-10 bg-muted rounded mt-1" />
            </div>
          ) : (
            <>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {showIncludingTax ? 'Subtotal (incl. tax)' : 'Subtotal (excl. tax)'}
            </span>
            <span className="font-medium text-foreground">
              {formatPrice(summarySubtotal)}
            </span>
          </div>
          {summaryDiscount > 0 && (
            <div className="flex justify-between text-sm animate-fade-in">
              <span className="text-success flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" />Coupon Discount</span>
              <span className="font-medium text-success">-{formatPrice(summaryDiscount)}</span>
            </div>
          )}
          {showIncludingTax ? (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                Tax
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      {formatTaxBreakdown(summary?.taxBreakdown).map((component) => (
                        <p key={component.key} className="uppercase">{component.label}: {component.formatted}</p>
                      ))}
                      {formatTaxBreakdown(summary?.taxBreakdown).length === 0 && <p>Calculated per tax settings</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="font-medium text-muted-foreground text-xs">{formatPrice(summaryTax)} (incl. in price)</span>
            </div>
          ) : (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                Tax
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="w-3.5 h-3.5 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      {formatTaxBreakdown(summary?.taxBreakdown).map((component) => (
                        <p key={component.key} className="uppercase">{component.label}: {component.formatted}</p>
                      ))}
                      {formatTaxBreakdown(summary?.taxBreakdown).length === 0 && <p>Calculated per tax settings</p>}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </span>
              <span className="font-medium text-foreground">
                {formatPrice(summaryTax)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="font-medium text-foreground">
              {summary?.shippingFee === 0 ? 'Free' : formatPrice(summary?.shippingFee || 0)}
            </span>
          </div>
          <div className="border-t border-border/50 pt-3">
            <div className="flex justify-between items-baseline">
              <span className="font-semibold text-foreground">Total</span>
              <div className="text-right">
                <span className="text-2xl font-bold text-foreground">
                  {formatPrice(summaryTotal)}
                </span>
                {summaryDiscount > 0 && (
                  <p className="text-xs text-success">You save {formatPrice(summaryDiscount)}</p>
                )}
              </div>
            </div>
          </div>
            </>
          )}
        </div>
        
        <Button
          className="w-full h-12 rounded-lg text-base font-semibold mb-3"
          size="lg"
          onClick={onProceedToCheckout}
          disabled={proceedLoading}
        >
          {proceedLoading ? 'Preparing checkout...' : 'Proceed to Checkout'}
        </Button>
        <div className="w-full flex justify-center mb-4">
          <QuotationButton cartItems={items} summary={summary} profile={user} />
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Truck className="w-4 h-4 text-primary shrink-0" /><span>Free Delivery</span></div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground"><Shield className="w-4 h-4 text-primary shrink-0" /><span>Secure Payment</span></div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground col-span-2"><Package className="w-4 h-4 text-primary shrink-0" /><span>Delivery in 3-5 business days</span></div>
        </div>
      </div>
    </div>
  );
};
