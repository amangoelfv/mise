"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ZeptoState } from "@/lib/types";
import { ZeptoConnect } from "./zepto-connect";

/** Operator-only Zepto connect (admin path). Not shown to judges/demo users. */
export function AdminConnect({ initial, tokenExport }: { initial: ZeptoState; tokenExport: boolean }) {
  const router = useRouter();
  const [zepto, setZepto] = useState(initial);

  return (
    <div className="space-y-5">
      <p className="font-mono text-[12px] text-paper/50">
        Status:{" "}
        {zepto.connected ? (
          <span className="text-herb">connected{zepto.via === "simulated" ? " (simulated)" : ""}</span>
        ) : (
          <span className="text-turmeric">not connected</span>
        )}
      </p>

      <ZeptoConnect
        allowSimulated={false}
        onConnected={(s) => {
          setZepto(s);
          router.refresh();
        }}
      />

      {zepto.connected && zepto.via === "zepto" && tokenExport && (
        <p className="rounded-[10px] border border-line px-4 py-3 text-[13px] text-paper/65">
          Copy tokens for prod:{" "}
          <a className="text-saffron underline" href="/api/connectors/zepto/token" target="_blank" rel="noreferrer">
            /api/connectors/zepto/token
          </a>{" "}
          → paste into Cloud Run env (<span className="font-mono">ZEPTO_ACCESS_TOKEN</span>,{" "}
          <span className="font-mono">ZEPTO_REFRESH_TOKEN</span>).
        </p>
      )}
    </div>
  );
}
