"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, Grid, Settings, Droplet } from "lucide-react";
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
import {
  getVehicleBrands,
  getModelsByBrand,
  getModelYears,
  getVehicleModificationGroups,
} from "@/services/vehicleService";
import { useVehicleSelection } from "@/context/VehicleContext";
import { logger } from "@/utils/logger";
import Link from "next/link";

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
      <SelectLabel className="text-[14px] font-semibold text-[#005bb5] py-2.5 px-3 uppercase tracking-tight bg-white">
        {group.groupTitle} {group.yearRangeLabel ? `${group.yearRangeLabel}` : ""}
        {group.lifecycle ? ` • ${group.lifecycle}` : ""}
      </SelectLabel>
      {(Array.isArray(group.options) ? group.options : []).map((option) => (
        <SelectItem 
          key={option.vehicleId || option._id} 
          value={String(option.vehicleId || option._id)}
          className="pl-8 py-2.5 text-[15px] font-normal text-slate-600 focus:bg-[#0073e6] focus:text-white data-[state=checked]:bg-[#0073e6] data-[state=checked]:text-white cursor-pointer rounded-none border-b border-gray-100 last:border-b-0 transition-none"
        >
          {option.label || buildVehicleLabel(option)}
        </SelectItem>
      ))}
    </SelectGroup>
  ));
};

export const HeroSection = () => {
  const router = useRouter();
  const { setSelection } = useVehicleSelection();

  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [yearId, setYearId] = useState("");
  const [variantId, setVariantId] = useState("");

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
        const options = normalizedGroups.flatMap((group) =>
          Array.isArray(group.options) ? group.options : []
        );
        setModificationOptions(options);
      } catch (error) {
        setModificationFetchError("Unable to load modifications");
        logger.error("Failed to fetch modifications", error);
      }
    }
  };

  const handleSearch = () => {
    if (brandId && modelId && yearId && variantId) {
      const brand = brands.find((item) => toId(item._id || item.id) === toId(brandId));
      const model = models.find((item) => toId(item._id || item.id) === toId(modelId));
      const year = years.find((item) => toId(item._id || item.id) === toId(yearId));
      const vehicle = modificationOptions.find((item) =>
        toId(item.vehicleId || item._id || item.id) === toId(variantId)
      );

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

    router.push(`/categories`);
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
    <div className="bg-[#111827] pt-14 pb-8 relative overflow-hidden">
        {/* Subtle background glow effect like Trodo */}
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-red-500/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-blue-500/10 blur-[100px] rounded-full pointer-events-none mix-blend-screen" />
        
        <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
            
            {/* Header Text */}
            <div className="text-center mb-8">

                <h1 className="text-3xl sm:text-4xl md:text-[44px] font-bold text-white mb-3 tracking-tight">
                    Car spare parts online
                </h1>
                <p className="text-slate-300 text-sm">Select your vehicle</p>
            </div>

            {/* Vehicle Selector Form - Horizontal style */}
            <div className="w-full max-w-[850px] mx-auto bg-white/10 backdrop-blur-md rounded-xl mb-12 p-3 shadow-2xl">
                <div className="flex flex-col sm:flex-row gap-2">
                    {/* Brand */}
                    <Select value={brandId} onValueChange={handleBrandChange}>
                        <SelectTrigger style={{backgroundColor: 'white', color: '#1e293b'}} className="h-12 lg:h-14 flex-1 border border-zinc-200 rounded focus:border-[#005bb5] focus:ring-0 shadow-none font-medium outline-none transition-all">
                            <SelectValue placeholder="Select Make" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] border-zinc-200 bg-white shadow-2xl">
                            {renderSelectItems(brands)}
                        </SelectContent>
                    </Select>

                    {/* Model */}
                    <Select value={modelId} onValueChange={handleModelChange} disabled={!brandId}>
                        <SelectTrigger style={{backgroundColor: !brandId ? '#f8fafc' : 'white', color: '#1e293b'}} className="h-12 lg:h-14 flex-1 border border-zinc-200 rounded focus:border-[#005bb5] focus:ring-0 shadow-none font-medium outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                            <SelectValue placeholder="Select Model" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] border-zinc-200 bg-white shadow-2xl">
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
                    <Select value={yearId} onValueChange={handleYearChange} disabled={!modelId}>
                        <SelectTrigger style={{backgroundColor: !modelId ? '#f8fafc' : 'white', color: '#1e293b'}} className="h-12 lg:h-14 flex-1 border border-zinc-200 rounded focus:border-[#005bb5] focus:ring-0 shadow-none font-medium outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                            <SelectValue placeholder="Select Year" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[300px] border-zinc-200 bg-white shadow-2xl">
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
                    <Select value={variantId} onValueChange={setVariantId} disabled={!yearId}>
                        <SelectTrigger style={{backgroundColor: !yearId ? '#f8fafc' : 'white', color: '#1e293b'}} className="h-12 lg:h-14 flex-1 border border-zinc-200 rounded focus:border-[#005bb5] focus:ring-0 shadow-none font-medium outline-none transition-all disabled:opacity-60 disabled:cursor-not-allowed">
                            <SelectValue placeholder="Select Modification" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[400px] w-[320px] md:w-[500px] border-zinc-200 bg-white shadow-2xl">
                            {modificationFetchError ? (
                                <SelectItem value="none" disabled>{modificationFetchError}</SelectItem>
                            ) : modificationOptions.length ? (
                                renderModificationItems(modificationGroups)
                            ) : (
                                <SelectItem value="none" disabled>No engines available</SelectItem>
                            )}
                        </SelectContent>
                    </Select>

                    <button
                        onClick={handleSearch}
                        disabled={!isSearchEnabled}
                        style={{backgroundColor: '#005bb5'}}
                        className="h-12 lg:h-14 w-12 lg:w-14 shrink-0 flex items-center justify-center text-white rounded-lg hover:bg-[#004a99] transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                    >
                        <Search className="w-6 h-6" strokeWidth={2.5} />
                    </button>
                </div>
            </div>

        </div>

    </div>
  );
};
