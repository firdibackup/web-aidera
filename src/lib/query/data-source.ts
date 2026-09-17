"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState, useSyncExternalStore } from "react";

import { ResponseMetaSchema, type DataSource } from "@/lib/api/contracts";

function readDataSource(caches: Iterable<unknown>): DataSource | null {
  for (const value of caches) {
    if (typeof value !== "object" || value === null || !("meta" in value)) {
      continue;
    }

    const parsed = ResponseMetaSchema.safeParse((value as { meta?: unknown }).meta);

    if (parsed.success) {
      return parsed.data.data_source;
    }
  }

  return null;
}

export function useDataSource(): DataSource | null {
  const queryClient = useQueryClient();

  const subscribe = useCallback(
    (onStoreChange: () => void) => queryClient.getQueryCache().subscribe(onStoreChange),
    [queryClient],
  );

  const getSnapshot = useCallback(() => {
    const entries = queryClient
      .getQueryCache()
      .getAll()
      .map((query) => query.state.data);

    return readDataSource(entries)?.mode ?? null;
  }, [queryClient]);

  const mode = useSyncExternalStore(subscribe, getSnapshot, () => null);

  if (mode === null) {
    return null;
  }

  return mode === "live"
    ? { mode: "live", label: "Live Data", notice: null, persistent_banner: false }
    : {
        mode: "prototype",
        label: "Prototype Data",
        notice: "Prototype Data — tidak tersimpan permanen",
        persistent_banner: true,
      };
}

export type ConnectionState = "prototype" | "live" | "offline";

export function useConnectionState(): ConnectionState {
  const dataSource = useDataSource();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);

    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!online) {
    return "offline";
  }

  return dataSource?.mode === "live" ? "live" : "prototype";
}
