import APP_CONFIG from '@/config/app.config'
import { logger } from '@/utils/logger';

export const resolveAssetUrl = (url) => {
  if (!url || typeof url !== 'string') {
    logger.error('[MEDIA] Invalid asset URL', { url })
    return ''
  }
  const trimmed = url.trim()
  if (trimmed.startsWith('/api/proxy/')) {
    return trimmed
  }
  const origin = APP_CONFIG.api.origin
  const isProd = process.env.NODE_ENV === 'production'

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const parsed = new URL(trimmed)
      if (parsed.pathname.startsWith('/api/proxy/')) {
        return `${parsed.pathname}${parsed.search}`
      }
      if (origin && parsed.origin === origin) {
        // Return same-origin backend URLs directly so next/image can optimize and cache.
        return trimmed
      }
    } catch {
      return trimmed
    }
    return trimmed
  }
  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }

  if (!origin) {
    logger.error('[MEDIA] Missing API origin for asset resolution', { url: trimmed })
    return ''
  }

  if (isProd && origin.includes('localhost')) {
    logger.error('[MEDIA] Refusing to use localhost origin in production', { origin, url: trimmed })
    return ''
  }

  if (trimmed.startsWith('/uploads/')) {
    // Direct backend URL allows optimized resized delivery in frontend image components.
    return `${origin}${trimmed}`
  }

  return `${origin}${trimmed}`
}

export const resolveProductImages = (images = []) => {
  if (!Array.isArray(images)) return []
  return images
    .map((image) => {
      if (!image) return ''
      const url = typeof image === 'string' ? image : image.url
      return resolveAssetUrl(url)
    })
    .filter(Boolean)
}
