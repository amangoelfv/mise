import { redirect } from "next/navigation";
import { Suspense } from "react";
import { PlanView } from "@/components/plan-view";
import { getUser } from "@/lib/session";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata = { title: "Plan", robots: PRIVATE_ROBOTS };

async function SessionPlan() {
  const user = await getUser();
  if (!user) redirect("/login?next=/plan");

  return <PlanView userId={user.id} firstName={user.name.split(/\s+/)[0]} />;
}

export default function PlanPage() {
  return (
    <Suspense fallback={<div className="flex-1" />}>
      <SessionPlan />
    </Suspense>
  );
}
