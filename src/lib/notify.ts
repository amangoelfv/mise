import type { OrderRecord } from "./orders";

/**
 * Email alerts via Resend's REST API (no SDK, just fetch). Entirely optional:
 * a no-op unless RESEND_API_KEY + RESEND_FROM + RESEND_TO are set. Used to tell
 * the operator the moment someone builds a cart or places an order.
 */

const API_KEY = process.env.RESEND_API_KEY;
const FROM = process.env.RESEND_FROM;
const TO = process.env.RESEND_TO;

export const emailConfigured = !!(API_KEY && FROM && TO);

async function send(subject: string, html: string): Promise<void> {
  if (!API_KEY || !FROM || !TO) return;
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: FROM, to: TO.split(",").map((s) => s.trim()).filter(Boolean), subject, html }),
      cache: "no-store",
    });
    if (!res.ok) console.warn(`[notify] email failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
    else console.info(`[notify] email sent: ${subject}`);
  } catch (error) {
    console.warn("[notify] email error:", error);
  }
}

const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] ?? c);

/** A judge/user placed an order — the signal you most want to see. */
export function notifyOrderPlaced(order: OrderRecord): Promise<void> {
  const rows = order.lines
    .map((l) => `<tr><td>${esc(l.name)}</td><td style="color:#888">${esc(l.packSize)}${l.quantity > 1 ? ` ×${l.quantity}` : ""}</td><td align="right">${inr(l.priceInr)}</td></tr>`)
    .join("");
  const recipe = order.dish.variantTitle || order.dish.name;
  const sub = [order.dish.styleLabel, order.dish.variantTitle ? order.dish.name : ""].filter(Boolean).join(" · ");
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px">
      <h2 style="margin-bottom:2px">🧾 New order · ${esc(recipe)}</h2>
      ${sub ? `<p style="color:#888;margin-top:0">${esc(sub)}</p>` : ""}
      <p><b>${esc(order.contact.name)}</b> · ${esc(order.contact.phone)}<br/>
      ${esc(order.address.line)}${order.address.landmark ? `, ${esc(order.address.landmark)}` : ""}${order.address.pincode ? ` – ${esc(order.address.pincode)}` : ""}</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">${rows}</table>
      <p style="font-size:16px"><b>Total ${inr(order.totals.totalInr)}</b> · ETA ~${order.etaMinutes ?? 10} min</p>
      <p style="color:#888;font-size:12px">Order ${order.id} · ${new Date(order.createdAt).toLocaleString("en-IN")}</p>
    </div>`;
  return send(`🧾 Order placed: ${recipe} · ${inr(order.totals.totalInr)}`, html);
}

/** Optional heads-up when someone builds a cart (set NOTIFY_CART_BUILD=1 to enable). */
export function notifyCartBuilt(info: { dish: string; itemCount: number; totalInr: number; user: string; dataSource?: string }): Promise<void> {
  if (process.env.NOTIFY_CART_BUILD !== "1") return Promise.resolve();
  const html = `
    <div style="font-family:system-ui,sans-serif">
      <h3>🛒 Cart built · ${esc(info.dish)}</h3>
      <p>${info.itemCount} items · ${inr(info.totalInr)} · ${esc(info.user)}${info.dataSource ? ` · ${esc(info.dataSource)}` : ""}</p>
    </div>`;
  return send(`🛒 Cart built: ${info.dish} (${info.itemCount} items)`, html);
}
