"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight } from "./icons";

/** Operator password form for /admin. On success, reloads so the page renders the admin view. */
export function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setError(data.error ?? "Wrong password.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Operator password"
        autoFocus
        className="h-11 w-full rounded-[12px] border border-line bg-ink px-4 text-[14px] outline-none placeholder:text-paper/25 focus:border-saffron"
      />
      {error && <p className="text-[13px] text-chili">{error}</p>}
      <button type="submit" disabled={!password || busy} className="btn-accent h-11 w-full">
        {busy ? "Checking…" : "Enter"}
        {!busy && <ArrowRight size={17} />}
      </button>
    </form>
  );
}
