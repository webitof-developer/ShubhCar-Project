import 'express-serve-static-core';
import type { AuthenticatedUser, UploadedFiles } from './modules/common';

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
    sessionId?: string;
    context?: {
      requestId?: string;
      [key: string]: unknown;
    };
    user: AuthenticatedUser;
    file?: Express.Multer.File;
    files?: UploadedFiles;
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
