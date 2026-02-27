const fs = require('fs');
const content = fs.readFileSync('src/app/cart/page.jsx', 'utf8');

let newContent = content.replace(
  "import { getTaxSuffix, formatTaxBreakdown } from '@/services/taxDisplayService';",
  `import { getTaxSuffix, formatTaxBreakdown } from '@/services/taxDisplayService';\nimport { CartSkeleton } from '@/components/cart/CartSkeleton';\nimport { CartItem } from '@/components/cart/CartItem';\nimport { CartSummary } from '@/components/cart/CartSummary';`
);

const skelStart = newContent.indexOf('  const CartSkeleton = () => (');
const skelEnd = newContent.indexOf('  if (loading || initializationLoading) {');
if (skelStart !== -1 && skelEnd !== -1) {
  newContent = newContent.substring(0, skelStart) + newContent.substring(skelEnd);
} else {
  console.log("CartSkeleton bounds not found!");
}

const itemStart = newContent.indexOf('{items.map((item, index) => {');
const itemEnd = newContent.indexOf('<div className="pt-2">');
if (itemStart !== -1 && itemEnd !== -1) {
  newContent = newContent.substring(0, itemStart) +
    `{items.map((item, index) => (\n              <CartItem key={item.id || item._id || index} item={item} index={index} user={user} removeFromCart={removeFromCart} updateQuantity={updateQuantity} summary={summary} cartTaxLabel={cartTaxLabel} />\n            ))}\n            ` +
    newContent.substring(itemEnd);
} else {
  console.log("CartItem bounds not found!");
}

const sumStart = newContent.indexOf('<div className="lg:col-span-1">');
const sumEnd = newContent.indexOf('<div className="mt-10 md:mt-14">');
if (sumStart !== -1 && sumEnd !== -1) {
  newContent = newContent.substring(0, sumStart) +
    `<div className="lg:col-span-1">\n            <CartSummary items={items} summary={summary} user={user} cartTaxLabel={cartTaxLabel} showIncludingTax={showIncludingTax} summarySubtotal={summarySubtotal} summaryDiscount={summaryDiscount} summaryTax={summaryTax} summaryTotal={summaryTotal} couponCode={couponCode} setCouponCode={setCouponCode} handleApplyCoupon={handleApplyCoupon} handleRemoveCoupon={handleRemoveCoupon} couponDialogOpen={couponDialogOpen} setCouponDialogOpen={setCouponDialogOpen} availableCoupons={availableCoupons} handleApplyCouponFromDialog={handleApplyCouponFromDialog} handleCopyCouponCode={handleCopyCouponCode} copiedCoupon={copiedCoupon} formatCouponValue={formatCouponValue} />\n          </div>\n        </div>\n\n        ` +
    newContent.substring(sumEnd);
} else {
  console.log("CartSummary bounds not found!");
}

fs.writeFileSync('src/app/cart/page.jsx', newContent);
console.log('Replaced components in cart/page.jsx with imports.');
