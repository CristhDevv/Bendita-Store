"use client";

import { usePageView } from "@/hooks/usePageView";

/**
 * PageViewTracker — thin client component mounted inside the
 * (shop) Server Component layout. Renders nothing; only fires
 * usePageView() on each route change.
 */
export function PageViewTracker() {
  usePageView();
  return null;
}
