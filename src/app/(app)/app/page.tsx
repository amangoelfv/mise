import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Flow } from "@/components/flow/flow";
import { cartApiMode } from "@/lib/cart-api";
import { zeptoState } from "@/lib/connectors";
import { CATALOG } from "@/lib/feed";
import { getConnections, getUser } from "@/lib/session";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata = { title: "What do you want to eat today?", robots: PRIVATE_ROBOTS };

async function SessionFlow({ searchParams }: { searchParams: PageProps<"/app">["searchParams"] }) {
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.slice(0, 80) ?? "";
  // proxy.ts already redirects signed-out visitors; this guards direct renders.
  const user = await getUser();
  if (!user) redirect("/login?next=/app");

  const connections = await getConnections(user);
  return (
    <Flow
      firstName={user.name.split(/\s+/)[0]}
      initialQuery={query}
      zepto={zeptoState(connections)}
      simulatedCart={cartApiMode === "mock"}
      catalog={CATALOG}
    />
  );
}

export default function AppPage(props: PageProps<"/app">) {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <SessionFlow searchParams={props.searchParams} />
    </Suspense>
  );
}
