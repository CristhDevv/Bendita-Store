"use client";

import dynamic from "next/dynamic";

export const CartDrawer = dynamic(
  () => import("./CartDrawer").then((mod) => mod.CartDrawer),
  { ssr: false }
);
