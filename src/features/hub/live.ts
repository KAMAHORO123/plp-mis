import { useEffect, useState } from "react";

export interface HubNotification { id: string; title: string; body: string; link: string | null; read_at: string | null; created_at: string }

/**
 * Keeps one live connection to the platform while signed in. When anyone changes data, open pages refresh
 * (debounced, so a burst of changes causes one refresh); new notifications arrive as "plp:notification" events.
 */
export function useLiveConnection(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof EventSource === "undefined") return;
    const source = new EventSource("/api/live", { withCredentials: true });
    let timer: ReturnType<typeof setTimeout> | undefined;
    const changed = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        for (const name of ["plp:live-change", "plp:school-data-updated", "plp:mentorship-updated", "plp:profile-updated"]) window.dispatchEvent(new Event(name));
      }, 350);
    };
    source.addEventListener("change", changed);
    source.addEventListener("notification", (e) => window.dispatchEvent(new CustomEvent<HubNotification>("plp:notification", { detail: JSON.parse((e as MessageEvent).data) })));
    source.addEventListener("notifications-read", () => window.dispatchEvent(new Event("plp:notifications-read")));
    // After a dropped connection the browser reconnects by itself; refresh once so nothing missed stays stale.
    let dropped = false;
    source.onerror = () => { dropped = true; };
    source.onopen = () => { if (dropped) { dropped = false; changed(); } };
    return () => { clearTimeout(timer); source.close(); };
  }, [enabled]);
}

/** A counter that increases whenever platform data changes; add it to an effect's dependencies to reload live. */
export function useLiveTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((n) => n + 1);
    window.addEventListener("plp:live-change", bump);
    return () => window.removeEventListener("plp:live-change", bump);
  }, []);
  return tick;
}
