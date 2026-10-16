"use client";

import { useEffect, useEffectEvent, useState } from "react";
import { api, errorMessage } from "@/lib/client";
import type { ZeptoState } from "@/lib/types";
import { CONNECT_MESSAGE } from "./connect-done";
import { ArrowUpRight } from "./icons";

const START_URL = "/api/connectors/zepto/start";

/** Neutral store tile: the first letter set in the dot-matrix face. */
export function StoreMark({ name, size = 40, live = false }: { name: string; size?: number; live?: boolean }) {
  return (
    <span
      className={`dots grid shrink-0 place-items-center rounded-[12px] border ${live ? "border-saffron/40 text-saffron" : "border-line text-paper/40"}`}
      style={{ width: size, height: size, fontSize: size * 0.5 }}
      aria-hidden
    >
      {name[0]}
    </span>
  );
}

/**
 * Connect Zepto through its official MCP OAuth: the user signs in on Zepto's own page
 * (phone + OTP) in a popup, so whatever the user was doing in Mise stays put.
 */
export function ZeptoConnect({
  onConnected,
  allowSimulated,
}: {
  onConnected: (state: ZeptoState) => void;
  allowSimulated: boolean;
}) {
  const [waiting, setWaiting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onMessage = useEffectEvent((e: MessageEvent) => {
    if (e.origin !== window.location.origin || e.data?.type !== CONNECT_MESSAGE) return;
    setWaiting(false);
    if (e.data.ok) onConnected({ connected: true, via: "zepto", since: new Date().toISOString() });
    else setError(e.data.message || "Zepto sign-in didn't finish.");
  });
  useEffect(() => {
    const listener = (e: MessageEvent) => onMessage(e);
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, []);

  function connect() {
    setError(null);
    const width = 460;
    const height = 720;
    const popup = window.open(
      START_URL,
      "mise-zepto",
      `popup,width=${width},height=${height},left=${window.screenX + (window.outerWidth - width) / 2},top=${window.screenY + 60}`,
    );
    if (!popup) {
      // Popup blocked: fall back to a full-page round trip through the OAuth route (not a page).
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign(START_URL);
      return;
    }
    setWaiting(true);
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        setWaiting(false);
      }
    }, 600);
  }

  async function simulate() {
    setBusy(true);
    setError(null);
    try {
      const res = await api<{ since: string }>("/api/connectors/zepto", { body: { action: "simulate" } });
      onConnected({ connected: true, via: "simulated", since: res.since });
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="mb-5 flex items-center gap-3.5">
        <StoreMark name="Zepto" live />
        <div>
          <p className="font-semibold">Zepto</p>
          <p className="font-mono text-[11.5px] uppercase tracking-[0.08em] text-paper/45">Official Zepto sign-in</p>
        </div>
      </div>

      <p className="text-[14.5px] leading-relaxed text-paper/65">
        You sign in on Zepto&apos;s own page with your phone number and OTP. Mise can then search Zepto and fill your
        cart. You still check out and pay in Zepto.
      </p>

      <dl className="mt-5 space-y-1.5 rounded-[12px] border border-line px-4 py-3 font-mono text-[12px]">
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 uppercase tracking-[0.1em] text-herb">Can</dt>
          <dd className="text-paper/70">search products, manage your cart</dd>
        </div>
        <div className="flex gap-3">
          <dt className="w-16 shrink-0 uppercase tracking-[0.1em] text-chili">Can&apos;t</dt>
          <dd className="text-paper/70">place orders, check out, see payments</dd>
        </div>
      </dl>

      {error && <p className="mt-4 text-sm text-chili">{error}</p>}

      <button type="button" onClick={connect} disabled={waiting || busy} className="btn-accent mt-6 w-full">
        {waiting ? <span className="printing">Finish signing in on Zepto</span> : "Continue to Zepto"}
        {!waiting && <ArrowUpRight size={17} />}
      </button>

      {allowSimulated && (
        <button
          type="button"
          onClick={simulate}
          disabled={busy || waiting}
          className="mt-3 w-full font-mono text-[12px] text-paper/45 transition hover:text-paper"
        >
          {busy ? "Connecting…" : "No Zepto account? Use a simulated store"}
        </button>
      )}
    </div>
  );
}
