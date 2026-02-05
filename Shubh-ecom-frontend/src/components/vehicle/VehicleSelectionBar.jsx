"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { VehicleSelector } from "@/components/vehicle/VehicleSelector";
import { useVehicleSelection } from "@/context/VehicleContext";

export const VehicleSelectionBar = ({ title = "Vehicle Filter" }) => {
  const { isActive, summary, clearSelection } = useVehicleSelection();
  const [showSelector, setShowSelector] = useState(false);

  return (
    <div className="mb-4 rounded-xl border border-border/60 bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">{title}</p>
          <p className="text-sm font-medium text-foreground">
            {isActive ? summary : "No vehicle selected"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowSelector((prev) => !prev)}>
            {showSelector ? "Hide" : "Change Vehicle"}
          </Button>
          {isActive ? (
            <Button variant="ghost" onClick={clearSelection}>
              Clear
            </Button>
          ) : null}
        </div>
      </div>

      {showSelector ? (
        <div className="mt-4">
          <VehicleSelector onApplied={() => setShowSelector(false)} />
        </div>
      ) : null}
    </div>
  );
};