import { formatPrice } from "./pricingService";

export function formatTaxBreakdown(taxBreakdown = {}) {
  const components = [
    { key: "cgst", label: "CGST", value: Number(taxBreakdown.cgst || 0) },
    { key: "sgst", label: "SGST", value: Number(taxBreakdown.sgst || 0) },
    { key: "igst", label: "IGST", value: Number(taxBreakdown.igst || 0) },
  ];

  return components
    .filter((component) => component.value > 0)
    .map((component) => ({
      ...component,
      formatted: formatPrice(component.value),
    }));
}
