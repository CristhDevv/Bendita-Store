import type { NextConfig } from "next";

/**
 * Content Security Policy
 *
 * Allows:
 * - Scripts: self + Supabase (realtime websocket client is inlined)
 * - Styles: self + inline (required by Tailwind/framer-motion) + Google Fonts
 * - Fonts: Google Fonts CDN
 * - Images: self + data URIs + Supabase Storage
 * - Connections: self + Supabase REST/WS + Google Analytics (if used)
 * - Frame ancestors: none (also enforced by X-Frame-Options: DENY)
 *
 * Note: 'unsafe-inline' on styles is required by Tailwind CSS v4.
 * Consider a nonce-based approach if stricter CSP is needed in the future.
 */
const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : "*.supabase.co";

const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  img-src 'self' data: blob: https://${supabaseHostname};
  connect-src 'self' https://${supabaseHostname} wss://${supabaseHostname};
  frame-ancestors 'none';
  form-action 'self';
  base-uri 'self';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  compress: true,
  // Expone el hash del commit como variable pública para el update checker
  env: {
    NEXT_PUBLIC_BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ?? "local-dev",
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 86400,
    deviceSizes: [390, 768, 1024, 1280],
    imageSizes: [128, 256, 384],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vtnmuphfaxjiziknchnk.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: ContentSecurityPolicy,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
