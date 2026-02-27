/* eslint-disable no-console */
const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && value.constructor === Object

const formatError = (error) => {
  if (!error || typeof error !== 'object') return { error }
  return {
    name: error.name,
    message: error.message,
    stack: error.stack
  }
}

const normalizeMeta = (meta) => {
  if (meta === undefined) return undefined
  if (meta instanceof Error) return formatError(meta)
  if (Array.isArray(meta)) return { items: meta }
  if (isPlainObject(meta)) return meta
  return { value: meta }
}

const emit = (level, message, meta, context) => {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...context,
    ...(meta ? { meta } : {})
  }

  const sink = console[level] || console.log
  sink(JSON.stringify(payload))
}

const createLogger = (context = {}) => ({
  debug: (message, meta) => emit('debug', message, normalizeMeta(meta), context),
  info: (message, meta) => emit('info', message, normalizeMeta(meta), context),
  warn: (message, meta) => emit('warn', message, normalizeMeta(meta), context),
  error: (message, meta) => emit('error', message, normalizeMeta(meta), context),
  withContext: (nextContext) => createLogger({ ...context, ...nextContext })
})

const logger = createLogger()

export default logger
