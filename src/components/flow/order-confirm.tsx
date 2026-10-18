"use client";

import { useState } from "react";
import { inr } from "@/lib/client";
import { getPrefs, updatePrefs } from "@/lib/prefs";
import { Dialog } from "../dialog";
import { ArrowRight } from "../icons";

export interface OrderSummary {
  packs: number;
  products: number;
  totalInr: number;
  etaMinutes?: number;
}

export interface DeliveryDetails {
  name: string;
  phone: string;
  address: string;
  landmark: string;
}

/**
 * Collects the user's delivery details and confirms the order. We build the cart
 * on our Zepto and deliver to this address — the user never checks out on Zepto.
 */
export function OrderConfirm({
  open,
  summary,
  firstName,
  busy,
  error,
  onClose,
  onConfirm,
}: {
  open: boolean;
  summary: OrderSummary;
  firstName: string;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (details: DeliveryDetails) => void;
}) {
  const prefs = getPrefs();
  const [name, setName] = useState(prefs.name || firstName);
  const [phone, setPhone] = useState(prefs.phone);
  const [address, setAddress] = useState(prefs.address);
  const [landmark, setLandmark] = useState(prefs.landmark);

  const total = summary.totalInr;
  const packs = summary.packs;
  const phoneDigits = phone.replace(/\D/g, "").length;
  const valid = name.trim().length > 0 && phoneDigits >= 10 && address.trim().length > 3;

  function submit() {
    if (!valid || busy) return;
    const details = { name: name.trim(), phone: phone.trim(), address: address.trim(), landmark: landmark.trim() };
    updatePrefs(details); // remember for next time on this device
    onConfirm(details);
  }

  return (
    <Dialog open={open} onClose={onClose} title="Confirm your order">
      <div className="space-y-5">
        <div className="receipt flex items-center justify-between px-4 py-3">
          <div>
            <p className="text-[14px]">
              {packs} item{packs === 1 ? "" : "s"} · {summary.products} product{summary.products === 1 ? "" : "s"}
            </p>
            <p className="mt-0.5 font-mono text-[12.5px] text-paper/45">
              Delivered to your door{summary.etaMinutes ? ` · ~${summary.etaMinutes} min` : ""}
            </p>
          </div>
          <span className="dots text-[22px]">{inr(total)}</span>
        </div>

        <div className="grid gap-3">
          <Field label="Name" value={name} onChange={setName} placeholder="Who's it for?" autoFocus />
          <Field label="Phone" value={phone} onChange={(v) => setPhone(v.replace(/[^\d+ ]/g, ""))} placeholder="10-digit mobile" inputMode="tel" />
          <Field label="Delivery address" value={address} onChange={setAddress} placeholder="Flat / house, street, area" textarea />
          <Field label="Landmark (optional)" value={landmark} onChange={setLandmark} placeholder="Nearby landmark" />
        </div>

        <p className="font-mono text-[12.5px] leading-relaxed text-paper/40">
          We place this order on our Zepto and deliver it to you. You don&apos;t need a Zepto account.
        </p>

        {error && <p className="text-[13px] text-chili">{error}</p>}

        <button type="button" onClick={submit} disabled={!valid || busy} className="btn-accent h-12 w-full text-[15px]">
          {busy ? "Placing your order…" : "Place order"}
          {!busy && <ArrowRight size={18} />}
        </button>
      </div>
    </Dialog>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  textarea,
  inputMode,
  autoFocus,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  textarea?: boolean;
  inputMode?: "tel" | "text";
  autoFocus?: boolean;
}) {
  const className =
    "mt-1.5 w-full rounded-[12px] border border-line bg-ink px-4 text-[14px] outline-none placeholder:text-paper/25 focus:border-saffron";
  return (
    <label className="block">
      <span className="label text-paper/55">{label}</span>
      {textarea ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 200))}
          placeholder={placeholder}
          rows={2}
          className={`${className} resize-none py-3`}
          autoFocus={autoFocus}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, 60))}
          placeholder={placeholder}
          inputMode={inputMode}
          className={`${className} h-11`}
          autoFocus={autoFocus}
        />
      )}
    </label>
  );
}
