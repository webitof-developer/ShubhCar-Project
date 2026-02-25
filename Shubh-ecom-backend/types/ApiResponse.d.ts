interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  code?: string;
  meta?: Record<string, unknown>;
  requestId?: string;
}
