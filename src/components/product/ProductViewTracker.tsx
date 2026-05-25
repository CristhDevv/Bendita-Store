"use client";

import { useEffect } from "react";
import { useTracking } from "@/hooks/useTracking";
import type { Product } from "@/types";

interface ProductViewTrackerProps {
  product: Product;
}

export function ProductViewTracker({ product }: ProductViewTrackerProps) {
  const { trackEvent } = useTracking();

  useEffect(() => {
    trackEvent("product_view", {
      product_id: product.id,
      product_name: product.name,
      product_slug: product.slug,
      brand_name: product.brand?.name,
      price: product.price,
    });
  }, [product, trackEvent]);

  return null;
}
