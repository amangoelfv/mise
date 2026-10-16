"use client";

import Link from "next/link";
import { useEffect } from "react";
import { LogoMark } from "./brand";

export const CONNECT_MESSAGE = "mise:zepto-connect";

export function ConnectDone({ ok, message }: { ok: boolean; message?: string }) {
  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: CONNECT_MESSAGE, ok, message }, window.location.origin);
      window.close();
    }
  }, [ok, message]);

  return (
    <div className="flex max-w-sm flex-col items-center">
      <LogoMark size={40} />
      <h1 className="display mt-6 text-3xl">{ok ? "Zepto connected." : "Zepto isn't connected."}</h1>
      <p className="mt-3 text-paper/55">{ok ? "You can close this window." : message}</p>
      <Link href={ok ? "/app" : "/settings"} className="btn mt-8">
        {ok ? "Back to mise" : "Back to settings"}
      </Link>
    </div>
  );
}
