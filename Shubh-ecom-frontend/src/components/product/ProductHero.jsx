"use client";
import { useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Minus, Plus, ChevronLeft, ChevronRight, Info, CheckCircle2 } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import WishlistButton from '@/components/product/WishlistButton';
import { ImagePreviewModal } from '@/components/product/ImagePreviewModal';
import { getDisplayPrice, formatPrice } from '@/services/pricingService';
import { resolveProductImages, resolveAssetUrl } from '@/utils/media';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getProductTypeBadge, isOemProduct } from '@/utils/productType';

const ProductHero = ({ product }) => {
    const router = useRouter();
    const { addToCart, cart } = useCart();
    const { user } = useAuth();

    const [quantity, setQuantity] = useState(product.minOrderQty || 1);
    const [activeImage, setActiveImage] = useState(0);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const scrollContainerRef = useRef(null);

    const images = resolveProductImages(product.images || []);
    const displayImages = images.length ? images : ['/placeholder.jpg'];
    const stockQty = product.stockQty ?? 0;
    const inStock = stockQty > 0;

    // Pricing & User Role Logic
    const priceData = getDisplayPrice(product, user);
    const unitPrice = priceData.price;
    const isWholesale = user?.customerType === 'wholesale'; // Adjust based on actual auth shape
    const minQty = isWholesale ? (product.minWholesaleQty || product.minOrderQty || 1) : (product.minOrderQty || 1);

    // Cart Logic
    const cartItems = cart?.items || [];
    const isInCart = cartItems.some(item => (item.product?._id === product._id) || (item.productId === product._id));

    const handleAddToCart = () => {
        if (isInCart) {
            router.push('/cart');
            return;
        }

        // Validate stock
        if (quantity > stockQty) {
            toast.error(`Only ${stockQty} units available.`);
            return;
        }

        // Validate MOQ
        if (quantity < minQty) {
            toast.error(`Minimum order quantity is ${minQty}`);
            return;
        }

        addToCart(product, quantity);
        setShowSuccessModal(true);
    };

    const scrollToImage = (index) => {
        if (scrollContainerRef.current && displayImages.length > 0) {
            const container = scrollContainerRef.current;
            const imageWidth = container.scrollWidth / displayImages.length;
            container.scrollTo({
                left: imageWidth * index,
                behavior: 'smooth'
            });
        }
        setActiveImage(index);
    };

    const handleScroll = () => {
        if (scrollContainerRef.current && displayImages.length > 0) {
            const container = scrollContainerRef.current;
            const imageWidth = container.scrollWidth / displayImages.length;
            const newIndex = Math.round(container.scrollLeft / imageWidth);
            if (newIndex !== activeImage) {
                setActiveImage(newIndex);
            }
        }
    };
    console.log(product);
    return (
        <div className="grid lg:grid-cols-12 gap-10 mb-12">
            {/* Image Gallery - Left Side (5 cols) */}
            <div className="lg:col-span-5 flex flex-col-reverse md:flex-row gap-4">
                {displayImages.length > 1 && (
                    <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-y-auto md:max-h-[500px] pb-2 md:pb-0 scrollbar-hide snap-x md:snap-y snap-mandatory">
                        {displayImages.map((img, i) => (
                            <button
                                key={img}
                                onClick={() => scrollToImage(i)}
                                className={`w-16 h-16 md:w-20 md:h-20 flex-shrink-0 rounded-lg overflow-hidden border transition-all snap-center ${i === activeImage ? 'border-blue-600 ring-2 ring-blue-100' : 'border-gray-200 hover:border-gray-300'}`}
                            >
                                <img src={img} alt="" className="w-full h-full object-cover bg-white" />
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 relative group bg-slate-50/50 border border-slate-100 rounded-2xl overflow-hidden">
                    {/* Top Right Badges */}
                    <div className="absolute top-4 right-4 z-10 flex flex-col gap-2 items-end">
                        <Badge className={`${isOemProduct(product.productType) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-slate-700 hover:bg-slate-800'} text-white px-3 py-1 text-xs font-bold uppercase tracking-wider shadow-sm transition-transform hover:scale-105`}>
                            {getProductTypeBadge(product.productType)}
                        </Badge>
                    </div>

                    {/* Bottom Left Notification Block */}
                    <div className="absolute bottom-4 left-4 z-10">
                        <div className="bg-white/90 backdrop-blur-sm border border-slate-100 rounded-lg p-3 shadow-md flex items-start gap-3 max-w-[200px] transition-transform hover:scale-105 cursor-default">
                            <div className="mt-0.5 bg-blue-600 rounded-md p-1 shrink-0">
                                <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-900 leading-tight mb-0.5">100% Genuine Parts</p>
                                {product.tags?.includes('Verified Fit') && (
                                    <p className="text-[10px] font-medium text-slate-500">Verified Fit Guarantee</p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="w-full aspect-square overflow-x-auto overflow-y-hidden snap-x snap-mandatory scrollbar-hide cursor-zoom-in active:cursor-grabbing flex"
                    >
                        {displayImages.map((img, i) => (
                            <div
                                key={img}
                                className="w-full h-full flex-shrink-0 snap-center flex items-center justify-center p-0"
                                onClick={() => setIsPreviewOpen(true)}
                            >
                                <img
                                    src={img}
                                    alt={`${product.name} - View ${i + 1}`}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ease-in-out"
                                    draggable={false}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Product Info - Right Side (7 cols) */}
            <div className="lg:col-span-7 flex flex-col h-full">
                <div className="mb-auto">
                    <div className="flex items-center gap-2 mb-3">
                        {product.manufacturerBrand && !isOemProduct(product.productType) && (
                            <div className="flex items-center gap-2">
                                {product.brandLogo ? (
                                    <img src={resolveAssetUrl(product.brandLogo)} alt={product.manufacturerBrand} className="h-8 w-auto object-contain" />
                                ) : (
                                    <span className="font-bold text-slate-800 uppercase tracking-wide text-xs bg-slate-100 px-2 py-1 rounded">
                                        {product.manufacturerBrand}
                                    </span>
                                )}
                            </div>
                        )}
                        {isOemProduct(product.productType) && product.vehicleBrand && (
                            <span className="font-bold text-slate-800 uppercase tracking-wide text-xs bg-slate-100 px-2 py-1 rounded">
                                {product.vehicleBrand}
                            </span>
                        )}
                    </div>

                    <h1 className="text-2xl md:text-4xl font-bold text-slate-900 leading-tight mb-3">{product.name}</h1>

                    <div className="flex flex-wrap items-center gap-4 mb-6">
                        <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                            <div className="flex text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(product.ratingAvg || 0) ? 'fill-current' : 'text-amber-200'}`} />
                                ))}
                            </div>
                            <span className="text-xs font-medium text-amber-800 ml-1">({product.ratingCount || 0} reviews)</span>
                        </div>

                        <Badge variant="secondary" className="bg-orange-100 text-orange-900 hover:bg-orange-200 border border-orange-200 rounded-md px-4 py-1 gap-1.5 h-full font-bold">
                            Shubh Choice <CheckCircle2 className="w-4 h-4 fill-orange-600 text-white ml-0.5" />
                        </Badge>

                        <div className="h-4 w-px bg-slate-200" />
                        <span className="text-sm text-slate-500">SKU: {product.sku || 'N/A'}</span>
                    </div>

                    {/* Price Block */}
                    <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-6 mb-8">
                        <div className="flex items-end gap-3 mb-2">
                            <span className="text-3xl font-bold text-slate-900 tracking-tight">{formatPrice(unitPrice)}</span>
                            {product.mrp && product.mrp > unitPrice && (
                                <div className="flex flex-col items-start gap-1 pb-1.5">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg text-slate-500 font-medium whitespace-nowrap">
                                            MRP: <span className="line-through">{formatPrice(product.mrp)}</span>
                                        </span>
                                        <span className="bg-cyan-500 text-white text-xs font-bold px-1.5 py-0.5 rounded">
                                            -{Math.round(((product.mrp - unitPrice) / product.mrp) * 100)}%
                                        </span>
                                    </div>
                                    <span className="text-[10px] font-semibold text-white bg-slate-500 px-2 py-0.5 rounded">
                                        Incl. of all taxes
                                    </span>
                                </div>
                            )}
                        </div>
                        {!product.mrp && <p className="text-xs text-slate-500 mb-4">*Price includes all taxes</p>}

                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className={`border-none px-3 py-1.5 gap-1.5 ${inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${inStock ? 'bg-green-500' : 'bg-red-500'}`} />
                                {inStock ? `In Stock (${stockQty})` : 'Out of Stock'}
                            </Badge>
                        </div>
                    </div>

                    {/* Description Snippet */}
                    <div className="mb-8">
                        <h3 className="text-sm font-semibold text-slate-900 mb-1">Short Description</h3>
                        <p className="text-slate-600 text-sm leading-relaxed max-w-2xl">
                            {product.shortDescription || 'High-quality automotive part designed for performance and durability. Tested for compatibility and reliability.'}
                        </p>
                    </div>

                    {isWholesale && (
                        <div className="mb-6 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
                            <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-sm font-semibold text-blue-800">Wholesale Account Active</p>
                                <p className="text-xs text-blue-600">MOQ: {minQty} units apply. Bulk pricing is enabled.</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-4 mt-auto border-t border-slate-100 pt-6">
                    <div className="flex items-center border border-slate-200 rounded-lg bg-white shadow-sm">
                        <button
                            onClick={() => setQuantity(q => Math.max(minQty, q - 1))}
                            className="p-3 hover:bg-slate-50 text-slate-600 transition-colors rounded-l-lg disabled:opacity-50"
                            disabled={quantity <= minQty}
                        >
                            <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-14 text-center font-semibold text-slate-900">{quantity}</span>
                        <button
                            onClick={() => setQuantity(q => Math.min(stockQty, q + 1))}
                            className="p-3 hover:bg-slate-50 text-slate-600 transition-colors rounded-r-lg disabled:opacity-50"
                            disabled={quantity >= stockQty}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <Button
                        size="lg"
                        className="flex-1 h-12 text-base font-semibold bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-200"
                        onClick={handleAddToCart}
                        disabled={!inStock}
                    >
                        {isInCart ? 'GO TO CART' : `ADD TO CART • ${formatPrice(unitPrice * quantity)}`}
                    </Button>

                    <div className="h-12 w-12 shrink-0">
                        <WishlistButton product={product} size="lg" variant="outline" className="h-full w-full border-slate-200 hover:border-red-200 hover:text-red-500 rounded-lg" />
                    </div>
                </div>
            </div>

            <ImagePreviewModal
                images={displayImages}
                initialIndex={activeImage}
                isOpen={isPreviewOpen}
                onClose={() => setIsPreviewOpen(false)}
            />

            <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
                <DialogContent className="sm:max-w-md p-8 gap-6 shadow-xl border-slate-100 rounded-xl">
                    <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="rounded-full bg-transparent border-2 border-green-500 p-0.5">
                                <CheckCircle2 className="w-5 h-5 text-green-500 fill-white" />
                            </div>
                            <h2 className="text-xl font-bold text-green-700">Added to Cart</h2>
                        </div>
                        <p className="text-slate-500 font-medium">
                            <span className="font-bold text-slate-900">{product.name}</span> has been successfully added to your cart.
                        </p>
                    </div>

                    <div className="flex justify-between items-center text-base font-medium text-slate-600">
                        <span>Subtotal ({quantity} items):</span>
                        <span className="font-bold text-slate-900 text-lg">{formatPrice(unitPrice * quantity)}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-2">
                        <Button
                            variant="outline"
                            className="h-11 border-slate-300 text-slate-700 font-semibold hover:bg-slate-50 hover:text-slate-900"
                            onClick={() => setShowSuccessModal(false)}
                        >
                            Continue Shopping
                        </Button>
                        <Button
                            className="h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-200"
                            onClick={() => router.push('/cart')}
                        >
                            Go to Cart
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ProductHero;
