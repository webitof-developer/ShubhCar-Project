"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { getVehicleBrands, getModelsByBrand, getModelYears, getVehiclesByFilter } from "@/services/vehicleService"; // Restored getVehicleBrands
import { useVehicleSelection } from "@/context/VehicleContext";

// ... (helper functions same)

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

export const VehicleFinder = () => {
  const router = useRouter();
  const { setSelection } = useVehicleSelection();
  
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [yearId, setYearId] = useState("");
  const [variantId, setVariantId] = useState(""); // This is actually vehicleId now

  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [variants, setVariants] = useState([]); // These are actual vehicles now

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
        // Sort years descending like in VehicleSelector
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
        // Use getVehiclesByFilter instead of getVariantsByYear
        const data = await getVehiclesByFilter({ brandId, modelId, yearId: val });
        setVariants(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch variants", error);
      }
    }
  };

  const handleSearch = () => {
    // 1. Update Global Context
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

    // 2. Redirect to Categories page (browsing flow)
    router.push(`/categories`);
  };

  const handleClear = () => {
    setBrandId("");
    setModelId("");
    setYearId("");
    setVariantId("");
    setModels([]);
    setYears([]);
    setVariants([]);
  };

  const isSearchEnabled = 
    brandId && 
    (!models.length || modelId) && 
    (!years.length || yearId) && 
    (!variants.length || variantId);

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-4xl rounded-xl bg-card p-6 shadow-card md:p-8">
          <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-xl font-semibold md:text-2xl text-center md:text-left">
              Find Parts for Your Vehicle
            </h2>
            {(brandId || modelId || yearId || variantId) && (
               <Button 
                variant="link" 
                size="sm" 
                onClick={handleClear} 
                className="text-muted-foreground hover:text-destructive underline decoration-muted-foreground/30 underline-offset-4 px-0 h-auto self-end md:self-auto"
              >
                 Clear Selection
               </Button>
            )}
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
            {/* Brand */}
            <Select value={brandId} onValueChange={handleBrandChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select Brand" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-zinc-200" sideOffset={5}>
                {renderSelectItems(brands)}
              </SelectContent>
            </Select>

            {/* Model */}
            <Select 
              value={modelId} 
              onValueChange={handleModelChange} 
              disabled={!brandId || (models.length === 0)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={!brandId ? "Select Brand First" : (models.length ? "Select Model" : "No Models Found")} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-zinc-200" sideOffset={5}>
                 {renderSelectItems(models)}
              </SelectContent>
            </Select>

            {/* Year */}
            <Select 
              value={yearId} 
              onValueChange={handleYearChange} 
              disabled={!modelId || (years.length === 0)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={!modelId ? "Select Model First" : (years.length ? "Select Year" : "No Years Found")} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-zinc-200" sideOffset={5}>
                {renderSelectItems(years, (y) => y.year)}
              </SelectContent>
            </Select>

            {/* Variant */}
            <Select 
              value={variantId} 
              onValueChange={setVariantId} 
              disabled={!yearId || (variants.length === 0)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={!yearId ? "Select Year First" : (variants.length ? "Select Variant" : "No Variants Found")} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-zinc-200" sideOffset={5}>
                {renderSelectItems(variants, buildVehicleLabel)}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3">
            <Button
              size="lg"
              className="w-full font-semibold"
              disabled={!isSearchEnabled}
              onClick={handleSearch}
            >
              <Search className="mr-2 h-4 w-4" />
              Find Compatible Parts
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
