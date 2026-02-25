import type { AuditRequestShape, AuditLogInput } from './audit.types';

const logger = require('../../config/logger');

class AuditService {
  log({ actor, action, target, meta = {} }: AuditLogInput) {
    logger.info('AUDIT', {
      actor,
      action,
      target,
      meta,
      timestamp: new Date().toISOString(),
    });
  }
}

module.exports = new AuditService();
