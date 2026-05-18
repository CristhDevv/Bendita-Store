'use client';

import { useUpdateChecker } from '@/hooks/useUpdateChecker';
import { RefreshCw, X, Sparkles } from 'lucide-react';
import { useState } from 'react';

export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = useUpdateChecker();
  const [dismissed, setDismissed] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  if (!updateAvailable || dismissed) return null;

  const handleUpdate = () => {
    setIsReloading(true);
    // Pequeño delay visual antes del reload
    setTimeout(() => applyUpdate(), 400);
  };

  return (
    <>
      <style>{`
        @keyframes slideUpBanner {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);   opacity: 1; }
        }
        @keyframes spinSlow {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        .update-banner {
          animation: slideUpBanner 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .update-banner-btn:hover .update-icon {
          animation: spinSlow 0.6s linear;
        }
        .shimmer-text {
          background: linear-gradient(
            90deg,
            #B8960C 0%,
            #F5D06B 40%,
            #B8960C 60%,
            #F5D06B 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 3s linear infinite;
        }
      `}</style>

      <div
        role="alert"
        aria-live="polite"
        className="update-banner fixed bottom-0 left-0 right-0 z-[9999]"
        style={{
          background: 'linear-gradient(135deg, #0D0D0D 0%, #1A1410 50%, #0D0D0D 100%)',
          borderTop: '1px solid rgba(184, 150, 12, 0.4)',
          boxShadow: '0 -4px 30px rgba(184, 150, 12, 0.15), 0 -1px 0 rgba(184, 150, 12, 0.3)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          {/* Icono + Texto */}
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div
              className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
              style={{
                background: 'rgba(184, 150, 12, 0.15)',
                border: '1px solid rgba(184, 150, 12, 0.4)',
              }}
            >
              <Sparkles size={15} style={{ color: '#B8960C' }} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-white leading-tight">
                <span className="shimmer-text font-semibold">¡Nueva versión disponible!</span>
              </p>
              <p className="text-xs text-gray-400 leading-tight mt-0.5 truncate">
                Actualiza para ver los últimos cambios y mejoras
              </p>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              id="update-banner-refresh-btn"
              onClick={handleUpdate}
              disabled={isReloading}
              className="update-banner-btn flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-200 disabled:opacity-70"
              style={{
                background: isReloading
                  ? 'rgba(184, 150, 12, 0.5)'
                  : 'linear-gradient(135deg, #B8960C, #D4A910)',
                color: '#0D0D0D',
                boxShadow: isReloading ? 'none' : '0 2px 12px rgba(184, 150, 12, 0.4)',
              }}
            >
              <RefreshCw
                size={14}
                className="update-icon"
                style={isReloading ? { animation: 'spinSlow 0.6s linear infinite' } : {}}
              />
              {isReloading ? 'Actualizando…' : 'Actualizar'}
            </button>

            <button
              id="update-banner-dismiss-btn"
              onClick={() => setDismissed(true)}
              className="w-7 h-7 flex items-center justify-center rounded-full transition-colors duration-200"
              style={{ color: '#666' }}
              aria-label="Cerrar"
              title="Recordar más tarde"
            >
              <X size={15} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
