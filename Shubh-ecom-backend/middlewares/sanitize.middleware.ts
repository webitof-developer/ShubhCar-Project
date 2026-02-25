const isPlainObject = (val: unknown) =>
  Object.prototype.toString.call(val) === '[object Object]';

function clean(value: any): any {
  if (Array.isArray(value)) {
    return value.map(clean);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  return Object.entries(value).reduce((acc: Record<string, any>, [key, val]) => {
    // Drop dangerous keys often used in NoSQL injection
    if (key.startsWith('$') || key.includes('.')) {
      return acc;
    }

    acc[key] = clean(val);
    return acc;
  }, {});
}

module.exports = function sanitizeMiddleware(req: any, res: any, next: any) {
  ['body', 'query', 'params'].forEach((section) => {
    if (req[section]) {
      const sanitized = clean(req[section]);

      if (section === 'query') {
        Object.defineProperty(req, 'query', {
          value: sanitized,
          writable: true,
          enumerable: true,
          configurable: true,
        });
      } else {
        req[section] = sanitized;
      }
    }
  });

  next();
};
