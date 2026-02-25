const { httpRequestDuration } = require('../config/metrics');

module.exports = function metricsMiddleware(req: any, res: any, next: any) {
  const end = httpRequestDuration.startTimer();
  res.on('finish', () => {
    end({
      method: req.method,
      route: req.route?.path || req.originalUrl || 'unknown',
      status_code: res.statusCode,
    });
  });
  next();
};
