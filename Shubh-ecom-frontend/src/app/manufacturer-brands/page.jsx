import { Suspense } from 'react';
import Link from 'next/link';
import { Layout } from '@/components/layout/Layout';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import { getManufacturerBrands } from '@/services/brandService';
import { resolveAssetUrl } from '@/utils/media';

export const revalidate = 60;

const BrandsList = async ({ searchParams }) => {
    const page = Number(searchParams?.page) || 1;
    const limit = 45; // Show 45 brands per page (9 cols * 5 rows)

    const { brands, total } = await getManufacturerBrands({ page, limit });

    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;

    return (
        <>
            <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-9 gap-6">
                {brands.map((brand, index) => {
                    const imageUrl = brand.logo || brand.image;
                    const finalImage = imageUrl ? resolveAssetUrl(imageUrl) : null;

                    return (
                        <Link
                            href={`/products?manufacturerBrand=${encodeURIComponent(brand.name)}`}
                            key={`${brand._id || brand.name}-${index}`}
                            className="flex flex-col items-center gap-4 p-4 border rounded-xl hover:shadow-md transition-all bg-card group"
                        >
                            <div className="w-24 h-24 flex items-center justify-center overflow-hidden">
                                {finalImage ? (
                                    <div className="relative w-full h-full">
                                        <Image
                                            src={finalImage}
                                            alt={brand.name}
                                            fill
                                            sizes="96px"
                                            className="object-contain grayscale group-hover:grayscale-0 transition-all duration-300 opacity-80 group-hover:opacity-100"
                                        />
                                    </div>
                                ) : (
                                    <span className="text-2xl font-bold text-muted-foreground group-hover:text-primary transition-colors uppercase">
                                        {(brand.name || 'BR').substring(0, 2)}
                                    </span>
                                )}
                            </div>
                            <span className="text-base font-medium text-center text-foreground group-hover:text-primary transition-colors">
                                {brand.name}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {brands.length === 0 && (
                <div className="text-center py-20">
                    <p className="text-muted-foreground">No manufacturer brands found.</p>
                </div>
            )}

            <div className="flex justify-center gap-2 mt-12 mb-8">
                {page > 1 && (
                    <Link href={`/manufacturer-brands?page=${page - 1}`}>
                        <Button variant="outline">Previous</Button>
                    </Link>
                )}
                {hasNextPage && (
                    <Link href={`/manufacturer-brands?page=${page + 1}`}>
                        <Button variant="outline">Next</Button>
                    </Link>
                )}
            </div>
        </>
    );
};

export default async function ManufacturerBrandsPage({ searchParams }) {
    return (
        <Layout>
            <div className="bg-secondary/30 border-b border-border/50">
                <div className="container mx-auto px-4 py-4">
                    <nav className="flex items-center gap-1.5 text-sm flex-wrap">
                        <Link href="/" className="text-muted-foreground hover:text-primary transition-colors">Home</Link>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50" />
                        <span className="text-foreground font-medium">Manufacturer Brands</span>
                    </nav>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 md:py-12">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-bold">All Manufacturer Brands</h1>
                </div>

                <Suspense fallback={<div>Loading brands...</div>}>
                    <BrandsList searchParams={await searchParams} />
                </Suspense>
            </div>
        </Layout>
    );
}
