import { NextResponse } from 'next/server';

const allowedOrigins = ['*'];

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
  'Access-Control-Max-Age': '86400',
};

function getClientIp(request) {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-vercel-forwarded-for') ||
    'unknown'
  );
}

function getCountry(request) {
  return (
    request.geo?.country ||
    request.headers.get('x-vercel-ip-country') ||
    'unknown'
  );
}

function logRequest(request, response) {
  const timestamp = new Date().toISOString();
  const ip = getClientIp(request);
  const country = getCountry(request);
  const method = request.method;
  const route = request.nextUrl.pathname + request.nextUrl.search;
  const status = response?.status ?? 0;

  console.log(
    JSON.stringify({
      timestamp,
      type: 'request-log',
      method,
      route,
      ip,
      country,
      userAgent: request.headers.get('user-agent') ?? 'unknown',
      status,
    })
  );
}

export async function middleware(request) {
  // Handle CORS preflight OPTIONS request
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  const response = NextResponse.next();

  // Attach CORS headers to response
  Object.entries(corsHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Skip logging internal Next.js requests
  if (!request.nextUrl.pathname.startsWith('/_next/')) {
    logRequest(request, response);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
