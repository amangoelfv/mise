"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/client";
import { ArrowRight } from "./icons";

interface GoogleId {
  initialize(options: {
    client_id: string;
    callback: (response: { credential: string }) => void;
    ux_mode?: "popup" | "redirect";
    auto_select?: boolean;
    itp_support?: boolean;
    use_fedcm_for_button?: boolean;
  }): void;
  renderButton(element: HTMLElement, options: Record<string, string | number>): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

function loadGsi(): Promise<void> {
  if (window.google?.accounts) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Couldn't load Google sign-in")), { once: true });
  });
}

export function SignIn({ clientId, demoEnabled, next }: { clientId: string; demoEnabled: boolean; next: string }) {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        const google = window.google;
        if (cancelled || !google || !buttonRef.current) return;
        google.accounts.id.initialize({
          client_id: clientId,
          ux_mode: "popup",
          itp_support: true,
          use_fedcm_for_button: true,
          callback: async ({ credential }) => {
            setBusy(true);
            setError(null);
            try {
              await api("/api/auth/google", { body: { credential } });
              router.replace(next);
              router.refresh();
            } catch (e) {
              setError(errorMessage(e));
              setBusy(false);
            }
          },
        });
        google.accounts.id.renderButton(buttonRef.current, {
          type: "standard",
          theme: "filled_black",
          size: "large",
          shape: "rectangular",
          text: "continue_with",
          logo_alignment: "left",
          width: 300,
        });
      })
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [clientId, next, router]);

  async function demo() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/auth/demo", { body: {} });
      router.replace(next);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(false);
    }
  }

  return (
    <div className="flex w-full flex-col items-center gap-3">
      {clientId ? (
        <div className={`flex h-11 items-center justify-center transition-opacity ${busy ? "pointer-events-none opacity-50" : ""}`}>
          <div ref={buttonRef} />
        </div>
      ) : (
        <p className="max-w-xs text-center font-mono text-[11.5px] leading-relaxed text-paper/40">
          Google sign-in turns on once NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.
        </p>
      )}

      {demoEnabled && (
        <button type="button" onClick={demo} disabled={busy} className={clientId ? "btn-ghost w-[300px]" : "btn w-[300px]"}>
          {busy && !clientId ? "Signing in…" : "Continue with demo account"}
          <ArrowRight size={17} />
        </button>
      )}

      {error && <p className="text-sm text-chili">{error}</p>}
    </div>
  );
}
