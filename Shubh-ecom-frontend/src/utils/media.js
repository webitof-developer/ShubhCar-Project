import APP_CONFIG from '@/config/app.config'

export const resolveAssetUrl = (url) => {
  if (!url || typeof url !== 'string') {
    console.error('[MEDIA] Invalid asset URL', { url })
    return ''
  }
  const trimmed = url.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
    return trimmed
  }

  const origin = APP_CONFIG.api.origin
  const isProd = process.env.NODE_ENV === 'production'

  if (!origin) {
    console.error('[MEDIA] Missing API origin for asset resolution', { url: trimmed })
    return ''
  }

  if (isProd && origin.includes('localhost')) {
    console.error('[MEDIA] Refusing to use localhost origin in production', { origin, url: trimmed })
    return ''
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
