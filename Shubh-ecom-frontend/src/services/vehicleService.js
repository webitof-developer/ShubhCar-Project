import APP_CONFIG from '@/config/app.config'
import { api } from '@/utils/apiClient'

const baseUrl = APP_CONFIG.api.baseUrl
const normalizeList = (payload) => {
  if (Array.isArray(payload)) return payload
  if (payload && typeof payload === 'object') {
    if (Array.isArray(payload.items)) return payload.items
    if (Array.isArray(payload.data)) return payload.data
  }
  return []
}

const cache = {
  brands: null,
  modelsByBrand: new Map(),
  yearsByModel: new Map(),
  vehiclesByFilter: new Map(),
};

export const getVehicleBrands = async () => {
  if (cache.brands) return cache.brands
  const data = await api.get(`${baseUrl}/vehicle-brands?status=active&limit=200`)
  const list = data?.items || (Array.isArray(data) ? data : [])
  cache.brands = Array.isArray(list) ? list : []
  return cache.brands
}

export const getModelsByBrand = async (brandId) => {
  if (!brandId) return []
  if (cache.modelsByBrand.has(brandId)) return cache.modelsByBrand.get(brandId)
  const data = await api.get(`${baseUrl}/vehicle-models?brandId=${brandId}&status=active&limit=200`)
  const list = data?.items || (Array.isArray(data) ? data : [])
  const normalized = Array.isArray(list) ? list : []
  cache.modelsByBrand.set(brandId, normalized)
  return normalized
}

export const getModelYears = async (modelId) => {
  if (!modelId) return []
  if (cache.yearsByModel.has(modelId)) return cache.yearsByModel.get(modelId)
  const data = await api.get(`${baseUrl}/vehicles/filters/years?modelId=${modelId}`)
  const list = normalizeList(data)
  cache.yearsByModel.set(modelId, list)
  return list
}

export const getVariantsByYear = async (yearId) => {
  if (!yearId) return []
  const data = await api.get(`${baseUrl}/vehicle-variants?modelYearId=${yearId}`)
  const list = data?.items || (Array.isArray(data) ? data : [])
  return Array.isArray(list) ? list : []
}

export const getVehiclesByFilter = async ({ brandId, modelId, yearId } = {}) => {
  if (!brandId || !modelId || !yearId) return []
  const key = `${brandId}:${modelId}:${yearId}`
  if (cache.vehiclesByFilter.has(key)) return cache.vehiclesByFilter.get(key)
  const params = new URLSearchParams({ brandId, modelId, yearId, limit: '200' })
  const data = await api.get(`${baseUrl}/vehicles?${params.toString()}`)
  const list = data?.items || (Array.isArray(data) ? data : [])
  const normalized = Array.isArray(list) ? list : []
  cache.vehiclesByFilter.set(key, normalized)
  return normalized
}
