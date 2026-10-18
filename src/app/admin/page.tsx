import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { AdminConnect } from "@/components/admin-connect";
import { AdminLogin } from "@/components/admin-login";
import { AdminOrders } from "@/components/admin-orders";
import { adminEnabled, isAdmin } from "@/lib/admin";
import { zeptoState } from "@/lib/connectors";
import { orderStore } from "@/lib/orders";
import { getConnections, getUser } from "@/lib/session";

/**
 * Operator-only admin path. Exists only when ADMIN_PASSWORD is set, and that
 * password gates it (plus a login). Judges use the env token override, never this.
 */
async function AdminBody() {
  if (!adminEnabled()) notFound();

  const user = await getUser();
  if (!user) redirect("/login?next=/admin");

  if (!(await isAdmin())) {
    return (
      <main className="mx-auto w-full max-w-sm px-6 py-20">
        <h1 className="display text-[28px]">Admin access</h1>
        <p className="mt-2 text-[14px] text-paper/50">Enter the operator password to continue.</p>
        <div className="panel mt-6 p-6">
          <AdminLogin />
        </div>
      </main>
    );
  }

  const zepto = zeptoState(await getConnections(user));
  const orders = await orderStore.list();

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <h1 className="display text-[32px]">Admin</h1>
      <p className="mt-2 text-[14px] text-paper/50">Incoming orders to fulfil, and the single demo Zepto connection.</p>

      <section className="mt-8">
        <h2 className="label mb-3">Orders ({orders.length})</h2>
        <AdminOrders orders={orders} />
      </section>

      <section className="mt-10">
        <h2 className="label mb-3">Zepto connection</h2>
        <div className="panel p-6">
          <AdminConnect initial={zepto} tokenExport={process.env.ZEPTO_TOKEN_EXPORT === "1"} />
        </div>
      </section>
    </main>
  );
}

export default function AdminPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <AdminBody />
    </Suspense>
  );
}
