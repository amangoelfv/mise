import { Suspense } from "react";
import { TopBar } from "@/components/top-bar";
import { getUser } from "@/lib/session";

async function SessionTopBar() {
  const user = await getUser();
  return <TopBar name={user?.name} picture={user?.picture} />;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <Suspense fallback={<TopBar />}>
        <SessionTopBar />
      </Suspense>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
