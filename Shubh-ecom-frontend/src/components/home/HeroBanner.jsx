"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
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
        {group.groupTitle} {group.yearRangeLabel ? `(${group.yearRangeLabel})` : ""}
        {group.lifecycle ? ` • ${group.lifecycle}` : ""}
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

export const HeroBanner = () => {
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
    <section className="relative min-h-[550px] md:min-h-[600px] h-auto py-20 md:py-0 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?q=80&w=2672&auto=format&fit=crop"
          alt="Car Parts Background"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-slate-900/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-slate-900/30" />
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
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

        <div className="max-w-5xl mx-auto bg-white/10 backdrop-blur-md border border-white/20 p-4 md:p-6 rounded-2xl shadow-2xl animate-fade-in-up delay-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-center">
            <Select value={brandId} onValueChange={handleBrandChange}>
              <SelectTrigger className="h-12 w-full bg-white/10 hover:bg-white/20 border border-white/20 focus:ring-2 focus:ring-primary text-white font-medium data-[placeholder]:text-white [&>span]:text-white [&_svg]:!text-white [&_svg]:!opacity-100 disabled:opacity-80 disabled:cursor-not-allowed">
                <SelectValue placeholder="Select Brand" />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {renderSelectItems(brands)}
              </SelectContent>
            </Select>

            <Select value={modelId} onValueChange={handleModelChange} disabled={!brandId}>
              <SelectTrigger className="h-12 w-full bg-white/10 hover:bg-white/20 border border-white/20 focus:ring-2 focus:ring-primary text-white font-medium data-[placeholder]:text-white [&>span]:text-white [&_svg]:!text-white [&_svg]:!opacity-100 disabled:opacity-80 disabled:cursor-not-allowed">
                <SelectValue placeholder={modelPlaceholder} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {modelFetchError ? (
                  <SelectItem value="none" disabled>{modelFetchError}</SelectItem>
                ) : models.length ? (
                  renderSelectItems(models)
                ) : (
                  <SelectItem value="none" disabled>No models available</SelectItem>
                )}
              </SelectContent>
            </Select>

            <Select value={yearId} onValueChange={handleYearChange} disabled={!modelId}>
              <SelectTrigger className="h-12 w-full bg-white/10 hover:bg-white/20 border border-white/20 focus:ring-2 focus:ring-primary text-white font-medium data-[placeholder]:text-white [&>span]:text-white [&_svg]:!text-white [&_svg]:!opacity-100 disabled:opacity-80 disabled:cursor-not-allowed">
                <SelectValue placeholder={yearPlaceholder} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {yearFetchError ? (
                  <SelectItem value="none" disabled>{yearFetchError}</SelectItem>
                ) : years.length ? (
                  renderSelectItems(years, (y) => y.year)
                ) : (
                  <SelectItem value="none" disabled>No years available</SelectItem>
                )}
              </SelectContent>
            </Select>

            <Select value={variantId} onValueChange={setVariantId} disabled={!yearId}>
              <SelectTrigger className="h-12 w-full bg-white/10 hover:bg-white/20 border border-white/20 focus:ring-2 focus:ring-primary text-white font-medium data-[placeholder]:text-white [&>span]:text-white [&_svg]:!text-white [&_svg]:!opacity-100 disabled:opacity-80 disabled:cursor-not-allowed">
                <SelectValue placeholder={modificationPlaceholder} />
              </SelectTrigger>
              <SelectContent className="max-h-[300px]">
                {modificationFetchError ? (
                  <SelectItem value="none" disabled>{modificationFetchError}</SelectItem>
                ) : modificationOptions.length ? (
                  renderModificationItems(modificationGroups)
                ) : (
                  <SelectItem value="none" disabled>No modifications available</SelectItem>
                )}
              </SelectContent>
            </Select>

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
