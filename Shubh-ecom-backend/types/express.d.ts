import 'express-serve-static-core';

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
    sessionId?: string;
    context?: {
      requestId?: string;
      [key: string]: unknown;
    };
    user: {
      _id?: string;
      id?: string;
      userId?: string;
      email?: string;
      phone?: string;
      role?: string;
      [key: string]: unknown;
    };
    file?: any;
    files?: any;
  }

  interface Response {
    ok: (
      data?: unknown,
      message?: string,
      statusCode?: number,
      meta?: Record<string, unknown>
    ) => Response;
    fail: (
      message?: string,
      statusCode?: number,
      code?: string
    ) => Response;
    success: (payload?: unknown) => Response;
    badRequest: (message?: string) => Response;
  }
}
