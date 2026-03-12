const User = require('../models/User.model');
const Order = require('../models/Order.model');
const Invoice = require('../models/InvoiceSchema');
const userActivityLogsService = require('../modules/userActivityLogs/userActivityLogs.service');

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const SKIP_PATH_PATTERNS = [
  '/api/v1/user-activity-logs',
  '/api/v1/auth/refresh',
];
const SENSITIVE_KEYS = [
  'password',
  'passwordhash',
  'token',
  'refreshtoken',
  'accesstoken',
  'authorization',
  'otp',
  'secret',
  'cvv',
  'cardnumber',
];

const safeString = (value: unknown) => String(value || '').trim();

const shouldSkipPath = (path: string) =>
  SKIP_PATH_PATTERNS.some((segment) => path.startsWith(segment));

const redactSensitive = (value: unknown): unknown => {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitive(item));
  }
  if (value && typeof value === 'object') {
    const next: Record<string, unknown> = {};
    Object.entries(value as Record<string, unknown>).forEach(([key, keyValue]) => {
      const normalizedKey = key.toLowerCase();
      if (SENSITIVE_KEYS.some((sensitive) => normalizedKey.includes(sensitive))) {
        next[key] = '[REDACTED]';
      } else {
        next[key] = redactSensitive(keyValue);
      }
    });
    return next;
  }
  return value;
};

const deriveResource = (path: string) => {
  const normalized = path
    .replace(/^\/api\/v1\//, '')
    .split('?')[0]
    .split('/')
    .filter(Boolean);

  if (!normalized.length) return 'unknown';
  return normalized[0];
};

const deriveAction = (method: string, path: string) => {
  const normalizedMethod = safeString(method).toUpperCase();
  const tail = safeString(path).toLowerCase();

  if (tail.includes('/status')) return 'status_change';
  if (tail.includes('/cancel')) return 'cancel';
  if (tail.includes('/refund')) return 'refund';
  if (tail.includes('/approve')) return 'approve';
  if (tail.includes('/reject')) return 'reject';

  if (normalizedMethod === 'POST') return 'create';
  if (normalizedMethod === 'PUT' || normalizedMethod === 'PATCH') return 'update';
  if (normalizedMethod === 'DELETE') return 'delete';
  return 'change';
};

const deriveSeverity = (statusCode: number) => {
  if (statusCode >= 500) return 'critical';
  if (statusCode >= 400) return 'error';
  if (statusCode >= 300) return 'warning';
  return 'info';
};

const findResourceId = (req: any) => {
  const candidate = req.params?.id || req.params?.orderId || req.params?.invoiceId;
  if (candidate) return String(candidate);
  const bodyId = req.body?._id || req.body?.id || req.body?.resourceId;
  return bodyId ? String(bodyId) : '';
};

const isMongoId = (value: string) => /^[a-f0-9]{24}$/i.test(String(value || ''));

const resolveTargetDisplay = async (resource: string, resourceId: string) => {
  if (!resourceId) return '';
  if (!isMongoId(resourceId)) return resourceId;

  if (resource === 'orders') {
    const order = await Order.findById(resourceId).select('orderNumber').lean();
    if (order?.orderNumber) return String(order.orderNumber);
  }

  if (resource === 'invoices') {
    const invoice = await Invoice.findById(resourceId).select('invoiceNumber').lean();
    if (invoice?.invoiceNumber) return String(invoice.invoiceNumber);
  }

  return '';
};

module.exports = function activityLoggerMiddleware(req: any, res: any, next: any) {
  if (!WRITE_METHODS.has(safeString(req.method).toUpperCase())) return next();

  const path = safeString(req.originalUrl || req.url);
  if (!path.startsWith('/api/v1/') || shouldSkipPath(path)) return next();

  res.on('finish', async () => {
    try {
      if (!req.user?.id) return;
      if (safeString(req.user?.role).toLowerCase() === 'customer') return;

      const resource = deriveResource(path);
      const action = deriveAction(req.method, path);
      const severity = deriveSeverity(Number(res.statusCode || 0));
      const resourceId = findResourceId(req);
      const targetDisplay = await resolveTargetDisplay(resource, resourceId);
      const activityType = `${resource}.${action}`;

      const actorDoc = await User.findById(req.user.id)
        .select('firstName lastName email role')
        .lean();
      const actorName = `${safeString(actorDoc?.firstName)} ${safeString(actorDoc?.lastName)}`.trim();

      const metadata = redactSensitive({
        params: req.params || {},
        query: req.query || {},
        body: req.body || {},
        changedFields:
          req.body && typeof req.body === 'object' ? Object.keys(req.body) : [],
      });

      await userActivityLogsService.create({
        userId: req.user.id,
        actor: {
          id: req.user.id,
          name: actorName,
          email: safeString(actorDoc?.email),
          role: safeString(req.user?.role || actorDoc?.role),
        },
        activityType,
        action,
        severity,
        resource,
        resourceId,
        targetDisplay,
        message: `${action.toUpperCase()} ${resource}${targetDisplay ? ` (${targetDisplay})` : resourceId ? ` (${resourceId})` : ''}`,
        metadata,
        requestContext: {
          ip:
            safeString(req.headers?.['x-forwarded-for']).split(',')[0] ||
            safeString(req.ip),
          userAgent: safeString(req.headers?.['user-agent']),
          requestId: safeString(req.id),
          method: safeString(req.method).toUpperCase(),
          path: path.split('?')[0],
          statusCode: Number(res.statusCode || 0),
        },
      });
    } catch (err) {
      // Avoid breaking request pipeline if activity logging fails.
    }
  });

  return next();
};
