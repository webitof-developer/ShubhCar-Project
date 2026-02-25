module.exports = function responseMiddleware(req: any, res: any, next: any) {
  /**
   * SUCCESS RESPONSE
   */
  res.ok = function (
    data: unknown = null,
    message = 'OK',
    statusCode = 200,
    meta: Record<string, unknown> = {},
  ) {
    const requestId = req.id || req.context?.requestId;
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      meta,
      requestId,
    });
  };

  /**
   * FAILURE RESPONSE
   */
  res.fail = function (
    message = 'Something went wrong',
    statusCode = 500,
    code = 'INTERNAL_ERROR',
  ) {
    const requestId = req.id || req.context?.requestId;
    return res.status(statusCode).json({
      success: false,
      message,
      code,
      requestId,
    });
  };

  next();
};
