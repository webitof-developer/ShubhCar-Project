declare namespace AppTypes {
  interface AuthUser {
    _id?: string;
    id?: string;
    role?: string;
    [key: string]: unknown;
  }

  interface AuthRequest extends Express.Request {
    id?: string;
    user?: AuthUser;
    context?: {
      requestId?: string;
      [key: string]: unknown;
    };
  }
}
