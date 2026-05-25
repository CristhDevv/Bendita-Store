/**
 * usePageView — Automatic page view tracker
 *
 * Fires a 'page_view' event on every client-side route change.
 * Designed to be called once in a layout component.
 * Uses Next.js usePathname() to detect navigation.
 */

"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTracking } from "@/hooks/useTracking";

export function usePageView() {
  const pathname = usePathname();
  const { trackEvent } = useTracking();

  useEffect(() => {
    // Small delay so the page title has time to update
    const timer = setTimeout(() => {
      trackEvent("page_view", {
        page_title:
          typeof document !== "undefined" ? document.title : undefined,
      });
    }, 100);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
}
