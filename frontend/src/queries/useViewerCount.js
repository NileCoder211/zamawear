import { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env?.VITE_API_BASE_URL ?? "";
const HEARTBEAT_INTERVAL_MS = 15_000;

/**
 * Tracks "N viewing" for a given product/video id by joining a live-viewer
 * session on mount, heartbeating periodically, and leaving on unmount.
 * Talks to the backend routes in viewers.routes.js.
 *
 * Usage: const { count } = useViewerCount(productId);
 */
export function useViewerCount(entityId) {
  const [count, setCount] = useState(0);
  const sessionIdRef = useRef(null);

  useEffect(() => {
    if (!entityId) return;

    // One session id per mount, persisted per-tab so a refresh doesn't
    // spawn a duplicate "viewer" for the same browser tab.
    const storageKey = `viewer-session:${entityId}`;
    let sessionId = sessionStorage.getItem(storageKey);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(storageKey, sessionId);
    }
    sessionIdRef.current = sessionId;

    let cancelled = false;

    const join = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/products/${entityId}/viewers/join`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          },
        );
        const data = await res.json();
        if (!cancelled) setCount(data.count ?? 0);
      } catch {
        // silently ignore — viewer count is a nice-to-have, not critical path
      }
    };

    const heartbeat = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/api/products/${entityId}/viewers/heartbeat`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sessionId }),
          },
        );
        const data = await res.json();
        if (!cancelled) setCount(data.count ?? 0);
      } catch {
        // ignore
      }
    };

    join();
    const intervalId = setInterval(heartbeat, HEARTBEAT_INTERVAL_MS);

    const leave = () => {
      // fetch keepalive works during unload/unmount without waiting on a response
      fetch(`${API_BASE}/api/products/${entityId}/viewers/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
        keepalive: true,
      }).catch(() => {});
    };

    window.addEventListener("beforeunload", leave);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      window.removeEventListener("beforeunload", leave);
      leave();
    };
  }, [entityId]);

  return { count };
}
