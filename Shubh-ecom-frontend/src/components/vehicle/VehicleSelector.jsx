"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  getVehicleBrands,
  getModelsByBrand,
  getModelYears,
  getVehicleModificationGroups,
} from "@/services/vehicleService";
import { useVehicleSelection } from "@/context/VehicleContext";

const toId = (value) => String(value || "");

const buildVehicleLabel = (vehicle) => {
  const name = vehicle.variantName || vehicle.display?.variantName || "Variant";
  const meta = [vehicle.display?.fuelType, vehicle.display?.transmission, vehicle.display?.engineCapacity]
    .filter(Boolean)
    .join(" | ");
  return meta ? `${name} (${meta})` : name;
};

export const VehicleSelector = ({
  onApplied,
  showApplyButton = true,
  applyLabel = "Apply Vehicle Filter",
}) => {
  const { selection, setSelection, clearSelection } = useVehicleSelection();
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [years, setYears] = useState([]);
  const [modificationGroups, setModificationGroups] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [brandId, setBrandId] = useState("");
  const [modelId, setModelId] = useState("");
  const [yearId, setYearId] = useState("");
  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [loading, setLoading] = useState({ brands: false, models: false, years: false, vehicles: false });
  const [error, setError] = useState("");
  const [modelFetchError, setModelFetchError] = useState("");
  const [yearFetchError, setYearFetchError] = useState("");
  const [vehicleFetchError, setVehicleFetchError] = useState("");

  useEffect(() => {
    if (!selection) return;
    setBrandId(selection.brandId || "");
    setModelId(selection.modelId || "");
    setYearId(selection.yearId || "");
    setSelectedVehicleIds(Array.isArray(selection.vehicleIds) ? selection.vehicleIds.map(toId) : []);
  }, [selection]);

  useEffect(() => {
    const fetchBrands = async () => {
      setLoading((prev) => ({ ...prev, brands: true }));
      try {
        const data = await getVehicleBrands();
        setBrands(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.message || "Failed to load vehicle brands");
      } finally {
        setLoading((prev) => ({ ...prev, brands: false }));
      }
    };
    fetchBrands();
  }, []);

  useEffect(() => {
    if (!brandId) {
      setModels([]);
      setModelId("");
      setYearId("");
      setYears([]);
      setVehicles([]);
      setModificationGroups([]);
      setSelectedVehicleIds([]);
      setModelFetchError("");
      setYearFetchError("");
      setVehicleFetchError("");
      return;
    }
    const fetchModels = async () => {
      setLoading((prev) => ({ ...prev, models: true }));
      setModelFetchError("");
      try {
        const data = await getModelsByBrand(brandId);
        setModels(Array.isArray(data) ? data : []);
      } catch (err) {
        setModelFetchError("Unable to load models");
        setError(err.message || "Failed to load vehicle models");
      } finally {
        setLoading((prev) => ({ ...prev, models: false }));
      }
    };
    fetchModels();
  }, [brandId]);

  useEffect(() => {
    if (!modelId) {
      setYears([]);
      setYearId("");
      setVehicles([]);
      setModificationGroups([]);
      setSelectedVehicleIds([]);
      setYearFetchError("");
      setVehicleFetchError("");
      return;
    }
    const fetchYears = async () => {
      setLoading((prev) => ({ ...prev, years: true }));
      setYearFetchError("");
      try {
        const data = await getModelYears(modelId);
        const sorted = Array.isArray(data)
          ? [...data].sort((a, b) => Number(b.year || 0) - Number(a.year || 0))
          : [];
        setYears(sorted);
      } catch (err) {
        setYearFetchError("Unable to load years");
        setError(err.message || "Failed to load years");
      } finally {
        setLoading((prev) => ({ ...prev, years: false }));
      }
    };
    fetchYears();
  }, [modelId]);

  useEffect(() => {
    if (!brandId || !modelId || !yearId) {
      setVehicles([]);
      setModificationGroups([]);
      setSelectedVehicleIds([]);
      setVehicleFetchError("");
      return;
    }
    const fetchVehicles = async () => {
      setLoading((prev) => ({ ...prev, vehicles: true }));
      setVehicleFetchError("");
      try {
        const groups = await getVehicleModificationGroups({ brandId, modelId, yearId });
        const normalizedGroups = Array.isArray(groups) ? groups : [];
        setModificationGroups(normalizedGroups);
        const options = normalizedGroups.flatMap((group) =>
          Array.isArray(group.options) ? group.options : []
        );
        setVehicles(options);
      } catch (err) {
        setVehicleFetchError("Unable to load modifications");
        setError(err.message || "Failed to load modifications");
      } finally {
        setLoading((prev) => ({ ...prev, vehicles: false }));
      }
    };
    fetchVehicles();
  }, [brandId, modelId, yearId]);

  const toggleVehicle = (id) => {
    setSelectedVehicleIds((prev) => {
      const value = toId(id);
      if (prev.includes(value)) return prev.filter((item) => item !== value);
      return [...prev, value];
    });
  };

  const selectedVehicles = useMemo(() => {
    const selectedSet = new Set(selectedVehicleIds.map((id) => toId(id)));
    return vehicles.filter((v) => selectedSet.has(toId(v.vehicleId || v._id)));
  }, [vehicles, selectedVehicleIds]);

  const handleApply = () => {
    if (!selectedVehicleIds.length) {
      setError("Select at least one variant to apply.");
      return;
    }
    const brand = brands.find((item) => toId(item._id || item.id) === toId(brandId));
    const model = models.find((item) => toId(item._id || item.id) === toId(modelId));
    const year = years.find((item) => toId(item._id || item.id) === toId(yearId));
    const vehicleLabels = selectedVehicles.map((vehicle) => vehicle.label || buildVehicleLabel(vehicle));
    setSelection({
      brandId,
      brandName: brand?.name || "",
      modelId,
      modelName: model?.name || "",
      yearId,
      yearLabel: year?.year ? String(year.year) : "",
      vehicleIds: selectedVehicleIds,
      vehicleLabels,
    });
    setError("");
    if (onApplied) onApplied();
  };

  const handleClear = () => {
    clearSelection();
    setBrandId("");
    setModelId("");
    setYearId("");
    setModels([]);
    setYears([]);
    setVehicles([]);
    setModificationGroups([]);
    setSelectedVehicleIds([]);
    setError("");
  };

  return (
    <div className="rounded-xl border border-border/60 bg-card p-4 md:p-5">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Select Your Vehicle</h3>
          <p className="text-sm text-muted-foreground">Choose your exact variant for compatibility.</p>
        </div>
        {selection?.vehicleIds?.length ? (
          <div className="flex items-center gap-1 text-xs text-success">
            <CheckCircle2 className="h-4 w-4" />
            Active
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
          <AlertTriangle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <Select value={brandId} onValueChange={setBrandId}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loading.brands ? "Loading brands..." : "Select Brand"} />
          </SelectTrigger>
          <SelectContent>
            {brands.map((b) => (
              <SelectItem key={b._id || b.id} value={toId(b._id || b.id)}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={modelId} onValueChange={setModelId} disabled={!brandId}>
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                !brandId
                  ? "Select brand first"
                  : modelFetchError
                    ? modelFetchError
                    : models.length
                      ? "Select Model"
                      : "No models available"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {modelFetchError ? (
              <SelectItem value="none" disabled>{modelFetchError}</SelectItem>
            ) : models.length ? (
              models.map((m) => (
                <SelectItem key={m._id || m.id} value={toId(m._id || m.id)}>
                  {m.name}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>No models available</SelectItem>
            )}
          </SelectContent>
        </Select>

        <Select value={yearId} onValueChange={setYearId} disabled={!modelId}>
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                !modelId
                  ? "Select model first"
                  : yearFetchError
                    ? yearFetchError
                    : years.length
                      ? "Select Year"
                      : "No years available"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {yearFetchError ? (
              <SelectItem value="none" disabled>{yearFetchError}</SelectItem>
            ) : years.length ? (
              years.map((y) => (
                <SelectItem key={y._id || y.id} value={toId(y._id || y.id)}>
                  {y.year}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>No years available</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-4">
        <div className="mb-2 text-sm font-semibold text-foreground">Variants / Modifications</div>
        {!yearId ? (
          <div className="text-sm text-muted-foreground">Select brand, model, and year to view variants.</div>
        ) : loading.vehicles ? (
          <div className="text-sm text-muted-foreground">Loading variants...</div>
        ) : vehicleFetchError ? (
          <div className="text-sm text-muted-foreground">{vehicleFetchError}</div>
        ) : vehicles.length === 0 ? (
          <div className="text-sm text-muted-foreground">No modifications available for this year.</div>
        ) : (
          <div className="max-h-72 overflow-y-auto rounded-lg border border-border/60">
            {modificationGroups.map((group) => (
              <div key={group.groupKey || `${group.groupTitle}-${group.yearRangeLabel}`}>
                <div className="border-b border-border/60 bg-muted/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.groupTitle} {group.yearRangeLabel ? `(${group.yearRangeLabel})` : ""}
                  {group.lifecycle ? ` • ${group.lifecycle}` : ""}
                </div>
                {(Array.isArray(group.options) ? group.options : []).map((vehicle) => {
                  const id = toId(vehicle.vehicleId || vehicle._id);
                  const checked = selectedVehicleIds.includes(id);
                  return (
                    <label
                      key={id}
                      className="flex cursor-pointer items-start gap-3 border-b border-border/60 px-3 py-3 last:border-b-0"
                    >
                      <Checkbox checked={checked} onCheckedChange={() => toggleVehicle(id)} />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-foreground">
                          {vehicle.label || buildVehicleLabel(vehicle)}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {showApplyButton ? (
          <Button onClick={handleApply} disabled={!selectedVehicleIds.length}>
            {applyLabel}
          </Button>
        ) : null}
        <Button variant="outline" onClick={handleClear}>
          Clear Selection
        </Button>
      </div>
    </div>
  );
};
