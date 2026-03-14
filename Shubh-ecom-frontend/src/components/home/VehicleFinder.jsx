"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter } from "next/navigation";
import { getVehicleBrands, getModelsByBrand, getModelYears, getVehicleModificationGroups } from "@/services/vehicleService"; // Restored getVehicleBrands
import { useVehicleSelection } from "@/context/VehicleContext";
import { logger } from '@/utils/logger';

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
    .join(" | ");
  return meta ? `${name} (${meta})` : name;
};

const renderModificationItems = (groups) => {
  if (!Array.isArray(groups) || groups.length === 0) {
    return <SelectItem value="none" disabled>No modifications found</SelectItem>;
  }
  return groups.map((group) => (
    <SelectGroup key={group.groupKey || `${group.groupTitle}-${group.yearRangeLabel}`}>
      <SelectLabel className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        {group.groupTitle} {group.yearRangeLabel ? `(${group.yearRangeLabel})` : ''}
        {group.lifecycle ? ` • ${group.lifecycle}` : ''}
      </SelectLabel>
      {(Array.isArray(group.options) ? group.options : []).map((option) => (
        <SelectItem key={option.vehicleId || option._id} value={String(option.vehicleId || option._id)}>
          {option.label || buildVehicleLabel(option)}
        </SelectItem>
      ))}
      <SelectSeparator />
    </SelectGroup>
  ));
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
  const [modificationGroups, setModificationGroups] = useState([]);
  const [modificationOptions, setModificationOptions] = useState([]);
  const [modelFetchError, setModelFetchError] = useState("");
  const [yearFetchError, setYearFetchError] = useState("");
  const [modificationFetchError, setModificationFetchError] = useState("");

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const data = await getVehicleBrands();
        setBrands(Array.isArray(data) ? data : []);
      } catch (error) {
        logger.error("Failed to fetch brands", error);
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
    setModificationGroups([]);
    setModificationOptions([]);
    setModelFetchError("");
    setYearFetchError("");
    setModificationFetchError("");

    if (val) {
      try {
        const data = await getModelsByBrand(val);
        setModels(Array.isArray(data) ? data : []);
      } catch (error) {
        setModelFetchError("Unable to load models");
        logger.error("Failed to fetch models", error);
      }
    }
  };

  const handleModelChange = async (val) => {
    setModelId(val);
    setYearId("");
    setVariantId("");
    setYears([]);
    setModificationGroups([]);
    setModificationOptions([]);
    setYearFetchError("");
    setModificationFetchError("");

    if (val) {
      try {
        const data = await getModelYears(val, brandId);
        // Sort years descending like in VehicleSelector
        const sorted = Array.isArray(data) 
          ? [...data].sort((a, b) => Number(b.year || 0) - Number(a.year || 0)) 
          : [];
        setYears(sorted);
      } catch (error) {
        setYearFetchError("Unable to load years");
        logger.error("Failed to fetch years", error);
      }
    }
  };

  const handleYearChange = async (val) => {
    setYearId(val);
    setVariantId("");
    setModificationGroups([]);
    setModificationOptions([]);
    setModificationFetchError("");

    if (val) {
      try {
        const groups = await getVehicleModificationGroups({ brandId, modelId, yearId: val });
        const normalizedGroups = Array.isArray(groups) ? groups : [];
        setModificationGroups(normalizedGroups);
        const options = normalizedGroups.flatMap((group) => Array.isArray(group.options) ? group.options : []);
        setModificationOptions(options);
      } catch (error) {
        setModificationFetchError("Unable to load modifications");
        logger.error("Failed to fetch modifications", error);
      }
    }
  };

  const handleSearch = () => {
    // 1. Update Global Context
    if (brandId && modelId && yearId && variantId) {
      const brand = brands.find((item) => toId(item._id || item.id) === toId(brandId));
      const model = models.find((item) => toId(item._id || item.id) === toId(modelId));
      const year = years.find((item) => toId(item._id || item.id) === toId(yearId));
      const vehicle = modificationOptions.find((item) => toId(item.vehicleId || item._id || item.id) === toId(variantId));
      
      setSelection({
        brandId,
        brandName: brand?.name || "",
        modelId,
        modelName: model?.name || "",
        yearId,
        yearLabel: year?.year ? String(year.year) : "",
        vehicleIds: [variantId],
        vehicleLabels: vehicle ? [vehicle.label || buildVehicleLabel(vehicle)] : [],
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
    setModificationGroups([]);
    setModificationOptions([]);
  };

  const isValidModel = Boolean(
    modelId && models.some((item) => toId(item._id || item.id) === toId(modelId))
  );
  const isValidYear = Boolean(
    yearId && years.some((item) => toId(item._id || item.id) === toId(yearId))
  );
  const isValidModification = Boolean(
    variantId &&
    modificationOptions.some((item) => toId(item.vehicleId || item._id || item.id) === toId(variantId))
  );
  const isSearchEnabled = Boolean(brandId && isValidModel && isValidYear && isValidModification);

  const modelPlaceholder = !brandId
    ? "Select Brand First"
    : modelFetchError
      ? modelFetchError
      : models.length
        ? "Select Model"
        : "No models available";
  const yearPlaceholder = !modelId
    ? "Select Model First"
    : yearFetchError
      ? yearFetchError
      : years.length
        ? "Select Year"
        : "No years available";
  const modificationPlaceholder = !yearId
    ? "Select Year First"
    : modificationFetchError
      ? modificationFetchError
      : modificationOptions.length
        ? "Select Modification"
        : "No modifications available";

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
              disabled={!brandId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={modelPlaceholder} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-zinc-200" sideOffset={5}>
                {modelFetchError ? (
                  <SelectItem value="none" disabled>{modelFetchError}</SelectItem>
                ) : models.length ? (
                  renderSelectItems(models)
                ) : (
                  <SelectItem value="none" disabled>No models available</SelectItem>
                )}
              </SelectContent>
            </Select>

            {/* Year */}
            <Select 
              value={yearId} 
              onValueChange={handleYearChange} 
              disabled={!modelId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={yearPlaceholder} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-zinc-200" sideOffset={5}>
                {yearFetchError ? (
                  <SelectItem value="none" disabled>{yearFetchError}</SelectItem>
                ) : years.length ? (
                  renderSelectItems(years, (y) => y.year)
                ) : (
                  <SelectItem value="none" disabled>No years available</SelectItem>
                )}
              </SelectContent>
            </Select>

            {/* Modification */}
            <Select 
              value={variantId} 
              onValueChange={setVariantId} 
              disabled={!yearId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={modificationPlaceholder} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-zinc-200" sideOffset={5}>
                {modificationFetchError ? (
                  <SelectItem value="none" disabled>{modificationFetchError}</SelectItem>
                ) : modificationOptions.length ? (
                  renderModificationItems(modificationGroups)
                ) : (
                  <SelectItem value="none" disabled>No modifications available</SelectItem>
                )}
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


