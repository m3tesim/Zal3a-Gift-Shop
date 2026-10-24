"use client";

import { useEffect } from "react";
import { useShop } from "@/lib/store";
import { PlantIcon } from "./icons";

export function Toast() {
  const toast = useShop((s) => s.toast);
  const hideToast = useShop((s) => s.hideToast);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(hideToast, 2600);
    return () => clearTimeout(id);
  }, [toast, hideToast]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-[max(1.25rem,env(safe-area-inset-bottom))] z-[60] flex justify-center px-4"
    >
      {toast && (
        <p
          key={toast.id}
          className="flex animate-rise items-center gap-2 rounded-full border-[3px] border-ink bg-lime px-4 py-2 font-extrabold shadow-pop"
        >
          <PlantIcon plant="cactus" className="size-8 shrink-0 animate-wiggle" />
          {toast.message}
        </p>
      )}
    </div>
  );
}
