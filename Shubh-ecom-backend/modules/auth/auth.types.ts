import type { Request } from 'express';

export type QueryScalar = string | number | boolean | null | undefined;

export interface AuthParams {
  id?: string;
  [key: string]: string | undefined;
}

export interface AuthQuery {
  [key: string]: QueryScalar | unknown;
}

export interface AuthBody {
  customerType?: unknown;
  email?: unknown;
  firstName?: unknown;
  identifier?: unknown;
  idToken?: unknown;
  lastName?: unknown;
  newPassword?: unknown;
  otp?: unknown;
  password?: unknown;
  phone?: unknown;
  refreshToken?: unknown;
  role?: unknown;
  [key: string]: unknown;
}

export interface AuthRequestContext {
  user: any;
  id?: string;
  sessionId?: string;
  file?: any;
  files?: any;
  [key: string]: any;
}

export interface AuthRequestShape {
  params: AuthParams;
  query: AuthQuery;
  body: AuthBody;
}

export type AuthRequest = Request<AuthParams, unknown, AuthBody, AuthQuery> &
  AuthRequestContext;

export interface AuthEntity {
  [key: string]: any;
}

export interface AuthServiceInput {
  [key: string]: any;
}

export type AuthServiceResult<T = any> = Promise<T>;

export interface AuthRepoFilter {
  [key: string]: any;
}

export interface AuthRepoUpdate {
  [key: string]: any;
}

export interface AuthValidatorInput {
  [key: string]: any;
}

// ─── Domain Types ────────────────────────────────────────────────────────────

export interface LoginInput {
  email?: string;
  phone?: string;
  password?: string;
}

export interface RegisterInput {
  firstName: string;
  lastName?: string;
  email?: string;
  phone?: string;
  password: string;
  role?: string;
  customerType?: string;
}

export interface OtpRequest {
  phone: string;
}

export interface OtpVerifyInput {
  phone: string;
  otp: string;
}

export interface AuthTokenPayload {
  id: string;
  role: string;
  email?: string;
  phone?: string;
  sessionId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface RefreshTokenInput {
  refreshToken: string;
}

export interface GoogleAuthInput {
  idToken: string;
}

export interface ForgotPasswordInput {
  identifier: string; // email or phone
}

export interface ResetPasswordInput {
  newPassword: string;
  otp: string;
  phone?: string;
  email?: string;
}
