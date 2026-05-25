/**
 * useTracking — Core analytics hook
 *
 * Manages an anonymous session_id (sessionStorage) and exposes
 * trackEvent() which fire-and-forgets an INSERT to analytics_events.
 * Never throws — tracking failures are silently swallowed so they
 * never disrupt the user experience.
 */

import { useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type AnalyticsEventType =
  | "page_view"
  | "product_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "begin_checkout"
  | "search"
  | "wishlist_add"
  | "wishlist_remove";

export interface TrackEventPayload {
  product_id?: string;
  product_name?: string;
  product_slug?: string;
  brand_name?: string;
  price?: number;
  quantity?: number;
  ml?: number;
  search_term?: string;
  has_results?: boolean;
  result_count?: number;
  [key: string]: unknown;
}

// ── Session ID ──────────────────────────────────────────────────
// One random ID per browser tab session, stored in sessionStorage.
function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "ssr";
  try {
    const key = "bs_session_id";
    const existing = sessionStorage.getItem(key);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
    return id;
  } catch {
    return "fallback-" + Date.now();
  }
}

// ── Hook ────────────────────────────────────────────────────────
export function useTracking() {
  const { user } = useAuth();

  const trackEvent = useCallback(
    (eventType: AnalyticsEventType, payload: TrackEventPayload = {}) => {
      // Fire and forget — never await, never block
      (async () => {
        try {
          const supabase = createClient();
          const sessionId = getOrCreateSessionId();
          const page =
            typeof window !== "undefined" ? window.location.pathname : "/";

          const { error } = await supabase.from("analytics_events").insert({
            session_id: sessionId,
            user_id: user?.id ?? null,
            event_type: eventType,
            page,
            payload,
          });
          if (error) {
            console.error("Supabase tracking insert error:", error);
          }
        } catch (err) {
          console.error("Failed to execute tracking event:", err);
        }
      })();
    },
    [user?.id]
  );

  return { trackEvent };
}
