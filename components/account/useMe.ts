"use client";

import { useEffect } from "react";
import { meAction } from "@/app/[locale]/account/actions";
import { useShop } from "@/lib/store";

let loading: Promise<void> | null = null;

/** Who's signed in. Pages are pre-rendered, so this is fetched once in the browser. */
export function useMe() {
  const me = useShop((s) => s.me);
  const setMe = useShop((s) => s.setMe);
  useEffect(() => {
    if (me !== undefined || loading) return;
    loading = meAction()
      .then(setMe)
      .catch(() => setMe(null))
      .finally(() => (loading = null));
  }, [me, setMe]);
  return me;
}

/** Call after signing in/out or editing the profile so the header etc. update. */
export function refreshMe() {
  loading = null;
  return meAction().then((m) => useShop.getState().setMe(m));
}
