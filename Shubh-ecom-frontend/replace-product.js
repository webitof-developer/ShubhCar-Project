const fs = require('fs');

// ==== 1. Replace in V1 ====
let v1Path = 'src/app/product/[slug]/page.jsx';
let contentV1 = fs.readFileSync(v1Path, 'utf8');

contentV1 = contentV1.replace(
  "import { getProductTypeBadge, isOemProduct } from '@/utils/productType';",
  "import { getProductTypeBadge, isOemProduct } from '@/utils/productType';\nimport { ProductSkeleton } from '@/components/product/ProductSkeleton';\nimport { ProductReviewsSection } from '@/components/product/ProductReviewsSection';"
);

const skelStartV1 = contentV1.indexOf('  const ProductSkeleton = () => (');
const skelEndV1 = contentV1.indexOf('  if (loading || !product) {');
if (skelStartV1 !== -1 && skelEndV1 !== -1) {
  contentV1 = contentV1.substring(0, skelStartV1) + contentV1.substring(skelEndV1);
} else {
  console.log('V1 Skeleton bounds not found');
}

const revStartV1 = contentV1.indexOf('<TabsContent value="reviews" className="mt-0 animate-in fade-in-50 duration-300">');
const revEndV1 = contentV1.indexOf('</Tabs>\n        </div>\n        {/* Vehicle Compatibility */}');
if (revStartV1 !== -1 && revEndV1 !== -1) {
  contentV1 = contentV1.substring(0, revStartV1) +
    `<TabsContent value="reviews" className="mt-0 animate-in fade-in-50 duration-300">\n              <ProductReviewsSection reviews={reviews} ratingAvg={ratingAvg} ratingCount={ratingCount} product={product} refreshReviews={refreshReviews} />\n            </TabsContent>\n          ` +
    contentV1.substring(revEndV1);
} else {
  console.log('V1 Reviews bounds not found');
}

fs.writeFileSync(v1Path, contentV1);
console.log('V1 replaced.');

// ==== 2. Replace in V2 ====
let v2Path = 'src/app/product/[slug]/v2/page.jsx';
let contentV2 = fs.readFileSync(v2Path, 'utf8');

contentV2 = contentV2.replace(
  "import { isOemProduct, getProductTypeBadge } from '@/utils/productType';",
  "import { isOemProduct, getProductTypeBadge } from '@/utils/productType';\nimport { ProductSkeleton } from '@/components/product/ProductSkeleton';\nimport { ProductReviewsSectionV2 } from '@/components/product/ProductReviewsSectionV2';"
);

const skelStartV2 = contentV2.indexOf('/* ── Rating Bar ─────────────────────────────────────────────────────────── */');
const skelEndV2 = contentV2.indexOf('const ProductDetailV2 = () => {');
if (skelStartV2 !== -1 && skelEndV2 !== -1) {
  contentV2 = contentV2.substring(0, skelStartV2) + contentV2.substring(skelEndV2);
} else {
  console.log('V2 Skeleton / RatingBar bounds not found');
}

contentV2 = contentV2.replace('<PageSkeleton />', '<ProductSkeleton />');

const revStartV2 = contentV2.indexOf('<TabsContent value="reviews" className="mt-0 animate-in fade-in-50 duration-300">');
const revEndV2 = contentV2.indexOf('</Tabs>\n          </div>\n\n          {/* ── Vehicle Compatibility ── */}');
if (revStartV2 !== -1 && revEndV2 !== -1) {
  contentV2 = contentV2.substring(0, revStartV2) +
    `<TabsContent value="reviews" className="mt-0 animate-in fade-in-50 duration-300">\n                <ProductReviewsSectionV2 reviews={reviews} ratingAvg={ratingAvg} ratingCount={ratingCount} reviewStats={reviewStats} product={product} refreshReviews={refreshReviews} />\n              </TabsContent>\n            ` +
    contentV2.substring(revEndV2);
} else {
  console.log('V2 Reviews bounds not found', revStartV2, revEndV2);
}

// Remove showAllReviews state hook from V2 as it's extracted
const hookV2Start = contentV2.indexOf('  const [showAllReviews, setShowAllReviews] = useState(false);');
if (hookV2Start !== -1) {
  contentV2 = contentV2.replace('  const [showAllReviews, setShowAllReviews] = useState(false);\n', '');
}

fs.writeFileSync(v2Path, contentV2);
console.log('V2 replaced.');
