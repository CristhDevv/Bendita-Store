'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // cada 5 minutos
const CURRENT_BUILD_ID =
  process.env.NEXT_PUBLIC_BUILD_ID ||
  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
  'local-dev';

export function useUpdateChecker() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const isMounted = useRef(true);

  const checkForUpdate = useCallback(async () => {
    try {
      const res = await fetch('/api/version', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' },
      });

      if (!res.ok) return;

      const data: { buildId: string } = await res.json();

      if (
        isMounted.current &&
        data.buildId !== CURRENT_BUILD_ID &&
        data.buildId !== 'local-dev' &&
        CURRENT_BUILD_ID !== 'local-dev'
      ) {
        setUpdateAvailable(true);
      }
    } catch {
      // Error de red — silenciar, se reintentará en el próximo ciclo
    }
  }, []);

  useEffect(() => {
    isMounted.current = true;

    // Primera verificación al montar (con pequeño delay)
    const initialTimer = setTimeout(checkForUpdate, 10_000);

    // Polling periódico
    const interval = setInterval(checkForUpdate, POLL_INTERVAL_MS);

    // También verificar cuando el usuario regresa a la pestaña
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkForUpdate();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted.current = false;
      clearTimeout(initialTimer);
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [checkForUpdate]);

  const applyUpdate = useCallback(() => {
    // Hard reload limpiando caché
    window.location.reload();
  }, []);

  return { updateAvailable, applyUpdate };
}
