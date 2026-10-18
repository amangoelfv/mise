"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { api, errorMessage } from "@/lib/client";
import { ArrowRight } from "./icons";

/**
 * Our own "Continue with Google" button (Google's rendered button is an iframe we can't style,
 * and it paints a white box on dark pages). Clicking opens Google's OAuth popup via the GIS
 * token client; the server verifies the token was issued to our client ID before trusting it.
 */

interface TokenResponse {
  access_token?: string;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  requestAccessToken(overrides?: { prompt?: string }): void;
}

interface GoogleOAuth2 {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type: string; message?: string }) => void;
  }): TokenClient;
}

declare global {
  interface Window {
    google?: { accounts: { oauth2: GoogleOAuth2 } };
  }
}

const GSI_SRC = "https://accounts.google.com/gsi/client";

function loadGsi(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve();
  return new Promise((resolve, reject) => {
    let script = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`);
    if (!script) {
      script = document.createElement("script");
      script.src = GSI_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", () => resolve(), { once: true });
    script.addEventListener("error", () => reject(new Error("Couldn't load Google sign-in. Check your connection.")), { once: true });
  });
}

/** Google's four-colour G, as their branding guidelines require on custom sign-in buttons. */
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.7 1.2 9.2 3.6l6.9-6.9C35.9 2.4 30.4 0 24 0 14.6 0 6.6 5.4 2.6 13.3l8 6.2C12.5 13.6 17.8 9.5 24 9.5Z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 7l7.4 5.7c4.3-4 6.9-9.9 6.9-17.2Z" />
      <path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-8-6.2C.9 16.5 0 20.1 0 24s.9 7.5 2.6 10.8l7.9-6.2Z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.7c-2.1 1.4-4.8 2.2-8.5 2.2-6.2 0-11.5-4.1-13.4-9.8l-8 6.2C6.6 42.6 14.6 48 24 48Z" />
    </svg>
  );
}

export function SignIn({ clientId, demoEnabled, next }: { clientId: string; demoEnabled: boolean; next: string }) {
  const router = useRouter();
  const tokenClient = useRef<TokenClient | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState<"google" | "demo" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    loadGsi()
      .then(() => {
        const oauth2 = window.google?.accounts?.oauth2;
        if (cancelled || !oauth2) return;
        tokenClient.current = oauth2.initTokenClient({
          client_id: clientId,
          scope: "openid email profile",
          callback: async (response) => {
            if (response.error || !response.access_token) {
              setError(response.error === "access_denied" ? "Google sign-in was cancelled." : "Google sign-in didn't finish.");
              setBusy(null);
              return;
            }
            try {
              await api("/api/auth/google", { body: { accessToken: response.access_token } });
              router.replace(next);
              router.refresh();
            } catch (e) {
              setError(errorMessage(e));
              setBusy(null);
            }
          },
          // Popup closed or blocked: just reset; a closed popup isn't worth an error message.
          error_callback: (err) => {
            setBusy(null);
            if (err.type === "popup_failed_to_open") setError("Your browser blocked the Google popup. Allow popups for this site.");
          },
        });
        setReady(true);
      })
      .catch((e) => !cancelled && setError(errorMessage(e)));
    return () => {
      cancelled = true;
    };
  }, [clientId, next, router]);

  function google() {
    if (!tokenClient.current) return;
    setError(null);
    setBusy("google");
    tokenClient.current.requestAccessToken();
  }

  async function demo() {
    setBusy("demo");
    setError(null);
    try {
      await api("/api/auth/demo", { body: {} });
      router.replace(next);
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
      setBusy(null);
    }
  }

  return (
    <div className="flex w-full flex-col gap-3">
      {clientId ? (
        <button type="button" onClick={google} disabled={!ready || busy !== null} className="btn h-12 w-full gap-3">
          <span className="grid size-7 place-items-center rounded-full bg-white">
            <GoogleG />
          </span>
          {busy === "google" ? "Waiting for Google…" : ready ? "Continue with Google" : "Loading Google…"}
        </button>
      ) : (
        <p className="font-mono text-[11.5px] leading-relaxed text-paper/40">
          Google sign-in turns on once NEXT_PUBLIC_GOOGLE_CLIENT_ID is set.
        </p>
      )}

      {demoEnabled && (
        <button type="button" onClick={demo} disabled={busy !== null} className={`${clientId ? "btn-ghost" : "btn"} h-12 w-full`}>
          {busy === "demo" ? "Opening the demo kitchen…" : "Continue with demo account"}
          <ArrowRight size={17} />
        </button>
      )}

      {error && <p className="text-sm text-chili">{error}</p>}
    </div>
  );
}
