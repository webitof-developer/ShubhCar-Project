"use client";
import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { getProductCompatibility } from '@/services/productService';

const VehicleCompatibility = ({ productId }) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeBrand, setActiveBrand] = useState(null);
    const [visibleCount, setVisibleCount] = useState(10);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const res = await getProductCompatibility(productId);
            setData(res);
            const brands = Object.keys(res || {});
            if (brands.length > 0) setActiveBrand(brands[0]);
            setLoading(false);
        };
        if (productId) load();
    }, [productId]);

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
    if (!data || Object.keys(data).length === 0) return <div className="p-4 text-muted-foreground">No specific vehicle compatibility data found.</div>;

    const brands = Object.keys(data);
    const currentList = data[activeBrand] || [];

    // No search filter anymore
    const paginated = currentList.slice(0, visibleCount);
    const total = currentList.length;

    return (
        <div className="w-full bg-white border border-slate-100 rounded-2xl p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h3 className="text-xl font-bold text-slate-900">Vehicle Compatibility</h3>
                    <p className="text-sm text-slate-500 mt-1">Check if this part fits your vehicle variant.</p>
                </div>
            </div>

            <Tabs value={activeBrand} onValueChange={setActiveBrand} className="w-full">
                <TabsList className="h-auto w-auto inline-flex flex-wrap justify-start gap-2 bg-transparent p-0 mb-6">
                    {brands.map(b => (
                        <TabsTrigger
                            key={b}
                            value={b}
                            className="flex-none px-5 py-2.5 rounded-full border border-slate-200 bg-white data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:border-slate-900 hover:bg-slate-50 transition-all font-medium text-sm shadow-none data-[state=active]:shadow-none"
                        >
                            {b} <span className="ml-2 opacity-60 text-xs bg-current/20 px-1.5 py-0.5 rounded-full">{data[b].length}</span>
                        </TabsTrigger>
                    ))}
                </TabsList>

                {brands.map(brand => (
                    <TabsContent key={brand} value={brand} className="mt-0 animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
                        <div className="rounded-xl border border-slate-100 overflow-hidden">
                            <Table>
                                <TableHeader className="bg-slate-50/50">
                                    <TableRow className="hover:bg-transparent border-slate-100">
                                        <TableHead className="py-4 font-semibold text-slate-900 w-[30%]">Model</TableHead>
                                        <TableHead className="py-4 font-semibold text-slate-900">Year</TableHead>
                                        <TableHead className="py-4 font-semibold text-slate-900">Variant</TableHead>
                                        <TableHead className="py-4 font-semibold text-slate-900">Engine</TableHead>
                                        <TableHead className="py-4 font-semibold text-slate-900">Fuel Type</TableHead>
                                        <TableHead className="py-4 font-semibold text-slate-900">Engine Code</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {paginated.map((v) => {
                                        const transmission = v.attributes?.find(a => a.name === 'Transmission')?.value || '';
                                        const engineCapacity = v.attributes?.find(a => a.name === 'Engine Capacity')?.value || v.engine || '';

                                        // Model + Variant + Fuel + Engine Capacity + Transmission
                                        const modelString = [v.model, v.variant, v.fuel, engineCapacity, transmission].filter(Boolean).join(' ');

                                        return (
                                            <TableRow key={v._id} className="hover:bg-blue-50/30 border-slate-50 transition-colors cursor-default group">
                                                <TableCell className="font-semibold text-slate-700 py-4">
                                                    {modelString}
                                                </TableCell>
                                                <TableCell className="text-slate-500">{v.year}</TableCell>
                                                <TableCell className="text-slate-600 font-medium">{v.variant}</TableCell>
                                                <TableCell className="text-slate-500">{engineCapacity}</TableCell>
                                                <TableCell className="text-slate-500">{v.fuel}</TableCell>
                                                <TableCell className="text-slate-500 align-middle">
                                                    <span className="text-xs font-mono bg-slate-50 px-2 py-1 rounded inline-block">
                                                        {v.engineCode}
                                                    </span>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {paginated.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-slate-400 bg-slate-50/30">
                                                No matching vehicles found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                        {visibleCount < total && (
                            <div className="mt-6 text-center">
                                <Button variant="secondary" onClick={() => setVisibleCount(c => c + 20)} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium">
                                    View {total - visibleCount} more models
                                </Button>
                            </div>
                        )}
                    </TabsContent>
                ))}
            </Tabs>
        </div>
    );
};

export default VehicleCompatibility;
