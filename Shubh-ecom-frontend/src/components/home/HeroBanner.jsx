"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getVehicleBrands, getModelsByBrand, getModelYears, getVehiclesByFilter } from "@/services/vehicleService";
import { useVehicleSelection } from "@/context/VehicleContext";

// Logic to render Select Items with fallback
const renderSelectItems = (items, labelFn = (i) => i.name, valueFn = (i) => i.id || i._id) => {
  if (!items || items.length === 0) {
    return <SelectItem value="none" disabled>No entries found</SelectItem>;
  }
  return items.map((item) => (
    <SelectItem key={valueFn(item)} value={valueFn(item)}>
      {labelFn(item)}
    </SelectItem>
  ));
};

const toId = (value) => String(value || "");

const buildVehicleLabel = (vehicle) => {
  const name = vehicle.variantName || vehicle.display?.variantName || "Variant";
  const meta = [vehicle.display?.fuelType, vehicle.display?.transmission, vehicle.display?.engineCapacity]
    .filter(Boolean)
    .join(" • ");
  return meta ? `${name} (${meta})` : name;
};

export const HeroBanner = () => {
  const router = useRouter();
  const { setSelection } = useVehicleSelection();

  // Vehicle Finder State
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [yearId, setYearId] = useState("");
  const [variantId, setVariantId] = useState("");
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [variants, setVariants] = useState([]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await getVehicleBrands();
        setBrands(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch brands", error);
      }
    };
    fetchBrands();
  }, []);

  const handleBrandChange = async (val) => {
    setBrandId(val);
    setModelId("");
    setYearId("");
    setVariantId("");
    setModels([]);
    setYears([]);
    setVariants([]);

    if (val) {
      try {
        const data = await getModelsByBrand(val);
        setModels(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch models", error);
      }
    }
  };

  const handleModelChange = async (val) => {
    setModelId(val);
    setYearId("");
    setVariantId("");
    setYears([]);
    setVariants([]);

    if (val) {
      try {
        const data = await getModelYears(val);
        const sorted = Array.isArray(data)
          ? [...data].sort((a, b) => Number(b.year || 0) - Number(a.year || 0))
          : [];
        setYears(sorted);
      } catch (error) {
        console.error("Failed to fetch years", error);
      }
    }
  };

  const handleYearChange = async (val) => {
    setYearId(val);
    setVariantId("");
    setVariants([]);

    if (val) {
      try {
        const data = await getVehiclesByFilter({ brandId, modelId, yearId: val });
        setVariants(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch variants", error);
      }
    }
  };

  const handleSearch = () => {
    if (brandId && modelId && yearId && variantId) {
      const brand = brands.find((item) => toId(item._id || item.id) === toId(brandId));
      const model = models.find((item) => toId(item._id || item.id) === toId(modelId));
      const year = years.find((item) => toId(item._id || item.id) === toId(yearId));
      const vehicle = variants.find((item) => toId(item._id || item.id) === toId(variantId));

      setSelection({
        brandId,
        brandName: brand?.name || "",
        modelId,
        modelName: model?.name || "",
        yearId,
        yearLabel: year?.year ? String(year.year) : "",
        vehicleIds: [variantId],
        vehicleLabels: vehicle ? [buildVehicleLabel(vehicle)] : [],
      });
    }
    router.push(`/categories`);
  };

  const isSearchEnabled =
    brandId &&
    (!models.length || modelId) &&
    (!years.length || yearId) &&
    (!variants.length || variantId);

  return (
    <section className="relative min-h-[550px] md:min-h-[600px] h-auto py-20 md:py-0 flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2672&auto=format&fit=crop"
          alt="Car Parts Background"
          className="h-full w-full object-cover object-center"
        />
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-slate-900/70" />
        {/* Subtle Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/30" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Main Heading */}
        <div className="max-w-4xl mx-auto mb-12 animate-fade-in-up">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-tight">
            Find Parts For Your Vehicle
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-slate-200 font-light max-w-2xl mx-auto">
            Over hundreds of brands and tens of thousands of parts.
            <br className="hidden md:block" />
            Quality components for every journey.
          </p>
        </div>

        {/* Search Bar / Filter Strip */}
        <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 p-4 md:p-6 rounded-2xl shadow-2xl animate-fade-in-up delay-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
            {/* Brand */}
            <Select value={brandId} onValueChange={handleBrandChange}>
              <SelectTrigger className="h-12 w-full bg-white/10 hover:bg-white/20 border border-white/20 focus:ring-2 focus:ring-primary text-white font-medium data-[placeholder]:text-white [&>span]:text-white [&_svg]:!text-white [&_svg]:!opacity-100 disabled:opacity-80 disabled:cursor-not-allowed">
                <SelectValue placeholder="Select Brand" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {renderSelectItems(brands)}
              </SelectContent>
            </Select>

            {/* Model */}
            <Select value={modelId} onValueChange={handleModelChange} disabled={!brandId || (models.length === 0)}>
              <SelectTrigger className="h-12 w-full bg-white/10 hover:bg-white/20 border border-white/20 focus:ring-2 focus:ring-primary text-white font-medium data-[placeholder]:text-white [&>span]:text-white [&_svg]:!text-white [&_svg]:!opacity-100 disabled:opacity-80 disabled:cursor-not-allowed">
                <SelectValue placeholder="Select Model" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {renderSelectItems(models)}
              </SelectContent>
            </Select>

            {/* Year */}
            <Select value={yearId} onValueChange={handleYearChange} disabled={!modelId || (years.length === 0)}>
              <SelectTrigger className="h-12 w-full bg-white/10 hover:bg-white/20 border border-white/20 focus:ring-2 focus:ring-primary text-white font-medium data-[placeholder]:text-white [&>span]:text-white [&_svg]:!text-white [&_svg]:!opacity-100 disabled:opacity-80 disabled:cursor-not-allowed">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {renderSelectItems(years, (y) => y.year)}
              </SelectContent>
            </Select>

            {/* Variant */}
            <Select value={variantId} onValueChange={setVariantId} disabled={!yearId || (variants.length === 0)}>
              <SelectTrigger className="h-12 w-full bg-white/10 hover:bg-white/20 border border-white/20 focus:ring-2 focus:ring-primary text-white font-medium data-[placeholder]:text-white [&>span]:text-white [&_svg]:!text-white [&_svg]:!opacity-100 disabled:opacity-80 disabled:cursor-not-allowed">
                <SelectValue placeholder="Select Variant" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {renderSelectItems(variants, buildVehicleLabel)}
              </SelectContent>
            </Select>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              disabled={!isSearchEnabled}
              className="h-12 w-full text-base font-bold bg-primary hover:bg-primary/90 text-primary-foreground border border-transparent shadow-lg transition-all duration-200 ease-in-out hover:scale-[1.02]"
            >
              <Search className="w-5 h-5 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};
