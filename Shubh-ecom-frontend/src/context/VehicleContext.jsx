
"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getStorageItem, setStorageItem, removeStorageItem } from '@/utils/storage';

const STORAGE_KEY = 'vehicleSelection';

const VehicleContext = createContext(null);

const buildSummary = (selection) => {
  if (!selection) return '';
  const parts = [
    selection.brandName,
    selection.modelName,
    selection.yearLabel,
  ].filter(Boolean);
  const variantSummary = Array.isArray(selection.vehicleLabels) && selection.vehicleLabels.length
    ? selection.vehicleLabels.join(', ')
    : '';
  if (variantSummary) parts.push(variantSummary);
  return parts.join(' › ');
};

const readSelection = () => {
  if (typeof window === 'undefined') return null;
  try {
    const parsed = getStorageItem(STORAGE_KEY);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const writeSelection = (selection) => {
  if (!selection) {
    removeStorageItem(STORAGE_KEY);
    return;
  }
  setStorageItem(STORAGE_KEY, selection);
};

export const VehicleProvider = ({ children }) => {
  const [selection, setSelectionState] = useState(null);

  useEffect(() => {
    const stored = readSelection();
    if (stored) {
      setSelectionState(stored);
    }
  }, []);

  const setSelection = useCallback((next) => {
    const normalized = next && typeof next === 'object' ? {
      brandId: next.brandId || '',
      brandName: next.brandName || '',
      modelId: next.modelId || '',
      modelName: next.modelName || '',
      yearId: next.yearId || '',
      yearLabel: next.yearLabel || '',
      vehicleIds: Array.isArray(next.vehicleIds) ? next.vehicleIds : [],
      vehicleLabels: Array.isArray(next.vehicleLabels) ? next.vehicleLabels : [],
    } : null;
    setSelectionState(normalized);
    writeSelection(normalized);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectionState(null);
    writeSelection(null);
  }, []);

  const value = useMemo(() => {
    const active = Boolean(selection?.vehicleIds?.length);
    return {
      selection,
      setSelection,
      clearSelection,
      isActive: active,
      summary: buildSummary(selection),
    };
  }, [selection, setSelection, clearSelection]);

  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  );
};

export const useVehicleSelection = () => {
  const ctx = useContext(VehicleContext);
  if (!ctx) {
    throw new Error('useVehicleSelection must be used within VehicleProvider');
  }
  return ctx;
};