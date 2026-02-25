const Joi = require('joi');

module.exports = function validate(schema: any, property = 'body') {
  if (!schema || !Joi.isSchema(schema)) {
    throw new Error('validate() requires a Joi schema');
  }

  return (req: any, res: any, next: any) => {
    const data = req[property];

    const { error, value } = schema.validate(data, {
      abortEarly: true,
      stripUnknown: true,
      convert: true,
    });

    if (error) {
      // Mark error as Joi error so error.middleware can classify it
      error.isJoi = true;
      return next(error);
    }

    // Replace request data with sanitized value.
    // In Express 5, req.query is getter-only; shadow it on the request instance.
    if (property === 'query') {
      Object.defineProperty(req, 'query', {
        value,
        writable: true,
        enumerable: true,
        configurable: true,
      });
    } else {
      req[property] = value;
    }

    next();
  };
};
