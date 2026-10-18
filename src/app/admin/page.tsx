import { notFound, redirect } from "next/navigation";
import { AdminConnect } from "@/components/admin-connect";
import { zeptoState } from "@/lib/connectors";
import { getConnections, getUser } from "@/lib/session";

/**
 * Operator-only admin path to connect the single demo Zepto account.
 * Gated by ADMIN_ENABLED=1 (set it only when you need to connect; never for judges).
 * Judges use the app via the env token override and never see this page.
 */
export default async function AdminPage() {
  if (process.env.ADMIN_ENABLED !== "1") notFound();

  const user = await getUser();
  if (!user) redirect("/login?next=/admin");

  const zepto = zeptoState(await getConnections(user));

  return (
    <main className="mx-auto w-full max-w-xl px-6 py-14">
      <h1 className="display text-[32px]">Admin · Connect Zepto</h1>
      <p className="mt-2 text-[14px] text-paper/50">
        Operator-only. Sign in the single demo account; its token powers carts for everyone.
      </p>
      <div className="panel mt-8 p-6">
        <AdminConnect initial={zepto} tokenExport={process.env.ZEPTO_TOKEN_EXPORT === "1"} />
      </div>
    </main>
  );
}
