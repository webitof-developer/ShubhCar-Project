"use client";
import { useState, useEffect } from 'react';
import { getProductAlternatives } from '@/services/productService';
import { ProductCard } from '@/components/product/ProductCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

const AlternativesSection = ({ productId }) => {
    const [data, setData] = useState({ oem: [], aftermarket: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const res = await getProductAlternatives(productId);
            setData(res);
            setLoading(false);
        };
        if (productId) load();
    }, [productId]);

    if (loading) return <div className="py-8 text-center"><Loader2 className="animate-spin inline" /> Loading alternatives...</div>;

    const hasOEM = data.oem?.length > 0;
    const hasAftermarket = data.aftermarket?.length > 0;

    if (!hasOEM && !hasAftermarket) return null;

    return (
        <div className="my-16 bg-slate-50 border border-slate-100 rounded-2xl p-8">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900">Alternative Options</h2>
                    <p className="text-slate-500 text-sm mt-1">Compare with similar products in our catalog.</p>
                </div>

                <Tabs defaultValue={hasAftermarket ? 'aftermarket' : 'oem'} className="w-auto">
                    <TabsList className="bg-white border border-slate-200 rounded-full p-1 h-auto shadow-sm">
                        {hasAftermarket && (
                            <TabsTrigger
                                value="aftermarket"
                                className="rounded-full px-6 py-2 data-[state=active]:bg-slate-900 data-[state=active]:text-white transition-all text-sm font-medium"
                            >
                                Aftermarket <span className="ml-2 text-xs opacity-70 bg-current/20 px-1.5 py-0.5 rounded-full">{data.aftermarket.length}</span>
                            </TabsTrigger>
                        )}
                        {hasOEM && (
                            <TabsTrigger
                                value="oem"
                                className="rounded-full px-6 py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all text-sm font-medium"
                            >
                                OEM Alternatives <span className="ml-2 text-xs opacity-70 bg-current/20 px-1.5 py-0.5 rounded-full">{data.oem.length}</span>
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <div className="hidden">
                        {/* Hidden content to keep Tabs state management but render content outside */}
                        {hasAftermarket && <TabsContent value="aftermarket" />}
                        {hasOEM && <TabsContent value="oem" />}
                    </div>
                </Tabs>
            </div>

            {/* Content Rendered based on active tab state would be ideal, but standard Radix Tabs keep content inside. 
                We will use the standard structure for simplicity but style the content area. 
            */}

            <Tabs defaultValue={hasAftermarket ? 'aftermarket' : 'oem'} className="w-full">
                {/* Re-declaring tabs solely for logic connection if I wanted separate controls, 
                    but actually the previous Tabs styling above doesn't control this one. 
                    Let's merge them properly.
                */}
                <TabsList className="bg-white border border-slate-200 rounded-full p-1 h-auto shadow-sm mx-auto w-fit mb-8 flex md:hidden">
                    {hasAftermarket && <TabsTrigger value="aftermarket" className="rounded-full px-4 py-2 text-xs">Aftermarket</TabsTrigger>}
                    {hasOEM && <TabsTrigger value="oem" className="rounded-full px-4 py-2 text-xs">OEM</TabsTrigger>}
                </TabsList>

                {hasAftermarket && (
                    <TabsContent value="aftermarket" className="mt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {data.aftermarket.map(p => (
                                <ProductCard key={p._id || p.id} product={p} className="bg-white border-slate-200 hover:border-slate-300 hover:shadow-xl hover:shadow-slate-200/50" />
                            ))}
                        </div>
                    </TabsContent>
                )}

                {hasOEM && (
                    <TabsContent value="oem" className="mt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {data.oem.map(p => (
                                <ProductCard key={p._id || p.id} product={p} className="bg-white border-blue-100 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-100/50 ring-1 ring-blue-50" />
                            ))}
                        </div>
                    </TabsContent>
                )}
            </Tabs>
        </div>
    );
};

export default AlternativesSection;
