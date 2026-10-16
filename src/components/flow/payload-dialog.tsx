"use client";

import { useState } from "react";
import { Dialog } from "../dialog";
import { Check, Copy } from "../icons";
import { JsonCode } from "../json-code";

export type PayloadState = { open: boolean; json?: string; error?: string };

/** Shows the exact CartRequest the cart service receives (connection handle masked). */
export function PayloadDialog({ state, onClose }: { state: PayloadState; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!state.json) return;
    try {
      await navigator.clipboard.writeText(state.json);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard blocked; the JSON is still selectable.
    }
  }

  return (
    <Dialog open={state.open} onClose={onClose} title="Cart request" wide>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="font-mono text-[12px] text-paper/45">
          <span className="text-saffron">POST</span> {"{CART_API_URL}"}/v1/carts · contract v1.0
        </p>
        <button type="button" onClick={copy} disabled={!state.json} className="btn-ghost h-9 px-3 text-[13px]">
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="max-h-[60vh] overflow-auto rounded-xl border border-line bg-ink p-4 font-mono text-[12px] leading-relaxed text-paper/75">
        {state.json ? <JsonCode json={state.json} /> : (state.error ?? "Building payload…")}
      </pre>
      <p className="mt-3 font-mono text-[11.5px] text-paper/35">Field-by-field spec lives in CONTRACT.md at the repo root.</p>
    </Dialog>
  );
}
