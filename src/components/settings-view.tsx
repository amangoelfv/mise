"use client";

import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { api, errorMessage } from "@/lib/client";
import { DIET_OPTIONS } from "@/lib/options";
import type { ZeptoState } from "@/lib/types";
import { setPrefsUser, updatePrefs, usePrefs } from "@/lib/prefs";
import { Dialog } from "./dialog";
import { ArrowRight, Logout, Minus, Plus } from "./icons";
import { StoreMark, ZeptoConnect } from "./zepto-connect";

const COMING_SOON = ["Blinkit", "Swiggy Instamart", "BigBasket", "Amazon Fresh"];

function Section({ id, title, hint, children }: { id: string; title: string; hint?: string; children: ReactNode }) {
  return (
    <section id={id} className="animate-rise scroll-mt-24">
      <div className="mb-3 px-1">
        <h2 className="label">{title}</h2>
        {hint && <p className="mt-1.5 text-[13px] text-paper/40">{hint}</p>}
      </div>
      <div className="panel divide-y divide-line">{children}</div>
    </section>
  );
}

function Row({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <p className="text-[15px]">{title}</p>
        {hint && <p className="mt-0.5 text-[13px] text-paper/45">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function SettingsView({
  user,
  zepto: initialZepto,
  system,
}: {
  user: { id: string; name: string; email: string; picture?: string; demo: boolean };
  zepto: ZeptoState;
  system: { gemini: boolean; cartApi: "live" | "mock" };
}) {
  // Before usePrefs(), so the first snapshot is this account's record.
  setPrefsUser(user.id);

  const router = useRouter();
  const prefs = usePrefs();
  const [zepto, setZepto] = useState(initialZepto);
  const [connectOpen, setConnectOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function disconnect() {
    setBusy(true);
    setError(null);
    try {
      await api("/api/connectors/zepto", { method: "DELETE" });
      setZepto({ connected: false });
      router.refresh();
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-2xl px-5 pb-24 pt-10 sm:px-8">
      <h1 className="display animate-rise text-[40px]">Settings</h1>
      <p className="animate-rise mt-3 text-paper/50 [animation-delay:60ms]">Stores, diet and defaults. Kitchen settings are saved on this device.</p>

      <div className="mt-10 space-y-10">
        <Section id="connectors" title="Connectors" hint="Stores Mise can build carts in. Mise never sees your passwords or payment details.">
          <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center">
            <StoreMark name="Zepto" size={44} live={zepto.connected} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="font-semibold">Zepto</p>
                {zepto.connected ? (
                  <span className="tag border-herb/30 text-herb">
                    <span className="size-1.5 rounded-full bg-herb" /> Connected
                  </span>
                ) : (
                  <span className="tag">Not connected</span>
                )}
              </div>
              <p className="mt-0.5 font-mono text-[12px] text-paper/45">
                {zepto.connected
                  ? `${zepto.via === "simulated" ? "Simulated connection" : "Signed in with Zepto"}${zepto.since ? ` · since ${new Date(zepto.since).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}` : ""}`
                  : "Official Zepto sign-in with your phone and OTP."}
              </p>
            </div>
            {zepto.connected ? (
              <button type="button" onClick={disconnect} disabled={busy} className="btn-ghost">
                {busy ? "Disconnecting…" : "Disconnect"}
              </button>
            ) : (
              <button type="button" onClick={() => setConnectOpen(true)} className="btn-accent">
                Connect <ArrowRight size={16} />
              </button>
            )}
          </div>
          {error && <p className="px-5 py-3 text-sm text-chili">{error}</p>}
          {COMING_SOON.map((name) => (
            <div key={name} className="flex items-center gap-4 px-5 py-3.5">
              <StoreMark name={name} size={44} />
              <p className="flex-1 text-[15px] text-paper/50">{name}</p>
              <span className="tag">Planned</span>
            </div>
          ))}
        </Section>

        <Section id="kitchen" title="Kitchen" hint="Sent to Gemini with every dish. Saved on this device.">
          <Row title="Default servings" hint="You can change it per dish too.">
            <div className="flex items-center rounded-[10px] border border-line">
              <button
                type="button"
                aria-label="Fewer servings"
                disabled={prefs.servings <= 1}
                onClick={() => updatePrefs({ servings: prefs.servings - 1 })}
                className="grid size-9 place-items-center text-paper/60 transition hover:text-paper disabled:opacity-30"
              >
                <Minus size={15} />
              </button>
              <span className="dots w-7 text-center text-[18px] leading-none">{prefs.servings}</span>
              <button
                type="button"
                aria-label="More servings"
                disabled={prefs.servings >= 12}
                onClick={() => updatePrefs({ servings: prefs.servings + 1 })}
                className="grid size-9 place-items-center text-paper/60 transition hover:text-paper disabled:opacity-30"
              >
                <Plus size={15} />
              </button>
            </div>
          </Row>
          <div className="px-5 py-4">
            <p className="text-[15px]">Diet</p>
            <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Diet">
              {DIET_OPTIONS.map((diet) => (
                <button
                  key={diet.id}
                  type="button"
                  role="radio"
                  aria-checked={prefs.diet === diet.id}
                  onClick={() => updatePrefs({ diet: diet.id })}
                  className={`rounded-[10px] border px-3.5 py-1.5 text-[13.5px] transition ${prefs.diet === diet.id ? "border-saffron bg-saffron text-ink" : "border-line text-paper/60 hover:border-paper/30 hover:text-paper"}`}
                >
                  {diet.label}
                </button>
              ))}
            </div>
          </div>
          <div className="px-5 py-4">
            <label htmlFor="avoid" className="text-[15px]">
              Allergies & dislikes
            </label>
            <input
              id="avoid"
              value={prefs.avoid}
              onChange={(e) => updatePrefs({ avoid: e.target.value.slice(0, 200) })}
              placeholder="e.g. peanuts, mushrooms, coriander"
              className="mt-3 h-11 w-full rounded-[12px] border border-line bg-ink px-4 text-[14px] outline-none placeholder:text-paper/25 focus:border-saffron"
            />
          </div>
          <Row title="Skip pantry staples" hint="Leave salt, oil and basic spices unticked by default.">
            <button
              type="button"
              role="switch"
              aria-checked={prefs.skipStaples}
              aria-label="Skip pantry staples"
              onClick={() => updatePrefs({ skipStaples: !prefs.skipStaples })}
              className={`relative h-7 w-12 rounded-full transition ${prefs.skipStaples ? "bg-saffron" : "bg-ink-3"}`}
            >
              <span
                className={`absolute top-1 size-5 rounded-full transition-all duration-300 ${prefs.skipStaples ? "left-6 bg-ink" : "left-1 bg-paper/60"}`}
              />
            </button>
          </Row>
          <Row title="Delivery pincode" hint="Optional. Helps match what's in stock near you.">
            <input
              inputMode="numeric"
              aria-label="Delivery pincode"
              value={prefs.pincode}
              onChange={(e) => updatePrefs({ pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
              placeholder="560001"
              className="h-10 w-32 rounded-[10px] border border-line bg-ink px-3 text-center font-mono text-[14px] outline-none placeholder:text-paper/20 focus:border-saffron"
            />
          </Row>
        </Section>

        <Section id="account" title="Account">
          <div className="flex items-center gap-4 px-5 py-5">
            {user.picture ? (
              // eslint-disable-next-line @next/next/no-img-element -- tiny Google avatar
              <img src={user.picture} alt="" referrerPolicy="no-referrer" className="size-12 rounded-full" />
            ) : (
              <span className="grid size-12 place-items-center rounded-full border border-line bg-ink-3 font-mono text-paper/70">
                {user.name[0]}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-semibold">
                {user.name} {user.demo && <span className="tag">Demo</span>}
              </p>
              <p className="truncate font-mono text-[12px] text-paper/45">{user.email}</p>
            </div>
            <form action="/api/auth/logout" method="post">
              <button type="submit" className="btn-ghost">
                <Logout size={17} /> Sign out
              </button>
            </form>
          </div>
        </Section>

        <Section id="system" title="System">
          <Row title="Gemini" hint={system.gemini ? "Generating live with your API key." : "Using built-in sample data. Set GEMINI_API_KEY."}>
            <StatusPill on={system.gemini} onLabel="Live" offLabel="Sample" />
          </Row>
          <Row title="Cart API" hint={system.cartApi === "live" ? "Sending carts to CART_API_URL." : "Simulating carts locally. Set CART_API_URL."}>
            <StatusPill on={system.cartApi === "live"} onLabel="Live" offLabel="Simulated" />
          </Row>
        </Section>
      </div>

      <Dialog open={connectOpen} onClose={() => setConnectOpen(false)} title="Connect Zepto">
        <ZeptoConnect
          allowSimulated={system.cartApi === "mock"}
          onConnected={(state) => {
            setZepto(state);
            setConnectOpen(false);
            router.refresh();
          }}
        />
      </Dialog>
    </main>
  );
}

function StatusPill({ on, onLabel, offLabel }: { on: boolean; onLabel: string; offLabel: string }) {
  return (
    <span
      className={`tag ${on ? "border-herb/30 text-herb" : "border-turmeric/30 text-turmeric"}`}
    >
      <span className={`size-1.5 rounded-full ${on ? "bg-herb" : "bg-turmeric"}`} />
      {on ? onLabel : offLabel}
    </span>
  );
}
