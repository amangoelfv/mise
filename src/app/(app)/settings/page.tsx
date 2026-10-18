import { redirect } from "next/navigation";
import { Suspense } from "react";
import { SettingsView } from "@/components/settings-view";
import { cartApiMode } from "@/lib/cart-api";
import { geminiConfigured } from "@/lib/gemini";
import { zeptoState } from "@/lib/connectors";
import { getConnections, getUser } from "@/lib/session";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata = { title: "Settings", robots: PRIVATE_ROBOTS };

async function SessionSettings() {
  const user = await getUser();
  if (!user) redirect("/login?next=/settings");
  const connections = await getConnections(user);

  return (
    <SettingsView
      user={{ id: user.id, name: user.name, email: user.email, picture: user.picture, demo: !!user.demo }}
      zepto={zeptoState(connections)}
      system={{ gemini: geminiConfigured, cartApi: cartApiMode }}
    />
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <SessionSettings />
    </Suspense>
  );
}
