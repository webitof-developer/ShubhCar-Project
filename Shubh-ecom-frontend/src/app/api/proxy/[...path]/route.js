import { NextResponse } from 'next/server';

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const resolveBackendConfig = () => {
  try {
    const parsed = new URL(RAW_API_URL);
    const basePath = parsed.pathname.replace(/\/$/, '') || '/api/v1';
    return { origin: parsed.origin, basePath };
  } catch {
    return { origin: 'http://localhost:5000', basePath: '/api/v1' };
  }
};

const { origin: BACKEND_ORIGIN, basePath: BACKEND_BASE_PATH } = resolveBackendConfig();

const passthrough = async (request, context) => {
  const params = await context?.params;
  const segments = params?.path || [];
  const joinedPath = Array.isArray(segments) ? segments.join('/') : '';
  const query = request.nextUrl.search || '';
  const isRawPassthrough = joinedPath.startsWith('__raw__/');
  const rawPath = isRawPassthrough ? joinedPath.replace(/^__raw__\/?/, '') : joinedPath;
  const normalizedRawPath = rawPath.startsWith('/') ? rawPath : `/${rawPath}`;
  const targetUrl = isRawPassthrough
    ? `${BACKEND_ORIGIN}${normalizedRawPath}${query}`
    : `${BACKEND_ORIGIN}${BACKEND_BASE_PATH}/${joinedPath}${query}`;

  const headers = new Headers(request.headers);
  headers.delete('host');

  const method = request.method.toUpperCase();
  const canHaveBody = !['GET', 'HEAD'].includes(method);
  const body = canHaveBody ? await request.text() : undefined;

  const upstream = await fetch(targetUrl, {
    method,
    headers,
    body: canHaveBody ? body : undefined,
    redirect: 'manual',
    cache: 'no-store',
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete('content-encoding');
  responseHeaders.delete('transfer-encoding');
  responseHeaders.delete('connection');

  return new NextResponse(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
};

export const GET = passthrough;
export const POST = passthrough;
export const PUT = passthrough;
export const PATCH = passthrough;
export const DELETE = passthrough;
export const OPTIONS = passthrough;
