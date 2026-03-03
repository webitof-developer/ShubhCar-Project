import { Suspense } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { getProducts } from '@/services/productService';
import { ChevronRight } from 'lucide-react';
import { ProductCard } from '@/components/product/ProductCard';
import { FlashDealCountdown } from '@/components/deals/FlashDealCountdown';
import { getFlashDealNowFromSettings, getFlashDealRangeFromSettings, getPublicSettings } from '@/services/settingsService';

export const revalidate = 60;

const ProductsList = async ({ searchParams }) => {
    const page = Number(searchParams?.page) || 1;
    const limit = 20;
    const manufacturerBrand = searchParams?.manufacturerBrand;
    const search = searchParams?.search;
    const sort = searchParams?.sort;
    const productType = searchParams?.productType;
    const isOnSale = searchParams?.isOnSale;
    const isFeatured = searchParams?.isFeatured;
    const isBestSeller = searchParams?.isBestSeller;

    let products = [];
    let settings = null;
    let loadFailed = false;
    try {
        [products, settings] = await Promise.all([
            getProducts({ page, limit, manufacturerBrand, search, sort, productType, isOnSale, isFeatured, isBestSeller }),
            getPublicSettings(),
        ]);
    } catch {
        loadFailed = true;
        products = [];
        settings = null;
    }
    const flashDealNow = getFlashDealNowFromSettings(settings);
    const flashDealRange = getFlashDealRangeFromSettings(settings);
    const productDealEnd = products
        .map((product) => product?.flashDealEndAt)
        .map((value) => new Date(value))
        .filter((date) => !Number.isNaN(date.getTime()))
        .sort((a, b) => a.getTime() - b.getTime())[0]
        ?.toISOString() || null;
    const dealEndsAt = flashDealRange.end || productDealEnd;
    const queryParams = new URLSearchParams();
    if (manufacturerBrand) queryParams.set('manufacturerBrand', manufacturerBrand);
    if (search) queryParams.set('search', search);
    if (sort) queryParams.set('sort', sort);
    if (productType) queryParams.set('productType', productType);
    if (typeof isOnSale !== 'undefined') queryParams.set('isOnSale', String(isOnSale));
    if (typeof isFeatured !== 'undefined') queryParams.set('isFeatured', String(isFeatured));
    if (typeof isBestSeller !== 'undefined') queryParams.set('isBestSeller', String(isBestSeller));
    const withPage = (targetPage) => {
        const next = new URLSearchParams(queryParams);
        next.set('page', String(targetPage));
        return `/products?${next.toString()}`;
    };

    return (
        <>
            {loadFailed && (
                <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Unable to load products right now. Please try again.
                </div>
            )}
            {isOnSale === 'true' && (
                <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm font-medium text-red-700">Flash deals are live now.</p>
                    <FlashDealCountdown
                        dealEndsAt={dealEndsAt}
                        referenceNow={flashDealNow}
                        className="font-mono text-sm font-bold text-red-700"
                    />
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
                {products.map((p, index) => (
                    <ProductCard key={p._id || p.id || index} product={p} />
                ))}
            </div>

            {products.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-muted-foreground">No products found.</p>
                </div>
            )}

            <div className="flex justify-center gap-2 mt-8">
                {page > 1 && (
                    <Link href={withPage(page - 1)}>
                        <Button variant="outline">Previous</Button>
                    </Link>
                )}
                {products.length === limit && (
                    <Link href={withPage(page + 1)}>
                        <Button variant="outline">Next</Button>
                    </Link>
                )}
            </div>
        </>
    );
};


export default async function ProductsPage({ searchParams }) {
    const params = await searchParams;
    let pageTitle = 'All Products';
    if (params?.isOnSale === 'true') pageTitle = 'Flash Deals';
    else if (params?.isFeatured === 'true') pageTitle = 'Featured Products';
    else if (params?.isBestSeller === 'true') pageTitle = 'Best Sellers';
    else if (params?.sort === 'newest') pageTitle = 'New Arrivals';

    return (
        <Layout>
            <div className="bg-secondary/30 border-b border-border/50">
                <div className="container mx-auto px-4 py-4">
                    <nav className="flex items-center gap-1.5 text-sm flex-wrap">
                        <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <span className="text-foreground font-medium">All Products</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">{pageTitle}</h1>
                </div>

                <Suspense fallback={<div>Loading products...</div>}>
                    <ProductsList searchParams={params} />
                </Suspense>
            </div>
        </Layout>
    );
}
