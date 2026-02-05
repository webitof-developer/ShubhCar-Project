import APP_CONFIG from '@/config/app.config'

const baseUrl = APP_CONFIG.api.baseUrl

const cache = {
  brands: null,
  modelsByBrand: new Map(),
  yearsByModel: new Map(),
  vehiclesByFilter: new Map(),
};

const getJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message || `Request failed: ${response.statusText}`);
  }
  return response.json();
}

export const getVehicleBrands = async () => {
  if (cache.brands) return cache.brands
  const data = await getJson(`${baseUrl}/vehicle-brands?status=active&limit=200`)
  const list = data?.data?.items || data?.data || []
  cache.brands = Array.isArray(list) ? list : []
  return cache.brands
}

export const getModelsByBrand = async (brandId) => {
  if (!brandId) return []
  if (cache.modelsByBrand.has(brandId)) return cache.modelsByBrand.get(brandId)
  const data = await getJson(`${baseUrl}/vehicle-models?brandId=${brandId}&status=active&limit=200`)
  const list = data?.data?.items || data?.items || []
  const normalized = Array.isArray(list) ? list : []
  cache.modelsByBrand.set(brandId, normalized)
  return normalized
}

export const getModelYears = async (modelId) => {
  if (!modelId) return []
  if (cache.yearsByModel.has(modelId)) return cache.yearsByModel.get(modelId)
  const data = await getJson(`${baseUrl}/vehicles/filters/years?modelId=${modelId}`)
  const list = data?.data || data?.items || []
  const normalized = Array.isArray(list) ? list : []
  cache.yearsByModel.set(modelId, normalized)
  return normalized
}

export const getVariantsByYear = async (yearId) => {
  if (!yearId) return []
  // Use existing public endpoint with correct query param
  const data = await getJson(`${baseUrl}/vehicle-variants?modelYearId=${yearId}`)
  const list = data?.data?.items || data?.items || []
  const normalized = Array.isArray(list) ? list : []
  return normalized
}

export const getVehiclesByFilter = async ({ brandId, modelId, yearId } = {}) => {
  if (!brandId || !modelId || !yearId) return []
  const key = `${brandId}:${modelId}:${yearId}`
  if (cache.vehiclesByFilter.has(key)) return cache.vehiclesByFilter.get(key)
  const params = new URLSearchParams({ brandId, modelId, yearId, limit: '200' })
  const data = await getJson(`${baseUrl}/vehicles?${params.toString()}`)
  const list = data?.data?.items || data?.items || []
  const normalized = Array.isArray(list) ? list : []
  cache.vehiclesByFilter.set(key, normalized)
  return normalized
}
