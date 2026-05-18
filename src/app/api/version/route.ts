import { NextResponse } from 'next/server';

/**
 * GET /api/version
 * Expone el BUILD_ID del servidor actual para que el cliente
 * pueda detectar si hay una nueva versión disponible.
 */
export const dynamic = 'force-dynamic'; // siempre devuelve la versión actual, nunca cacheada

export async function GET() {
  const buildId =
    process.env.NEXT_PUBLIC_BUILD_ID ||   // variable opcional en Vercel
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || // hash corto del commit
    process.env.VERCEL_DEPLOYMENT_ID ||   // ID de deployment en Vercel
    'local-dev';

  return NextResponse.json(
    { buildId, timestamp: Date.now() },
    {
      status: 200,
      headers: {
        // Nunca cachear esta ruta
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    }
  );
}
