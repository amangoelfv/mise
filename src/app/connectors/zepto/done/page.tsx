import { Suspense } from "react";
import { ConnectDone } from "@/components/connect-done";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata = { title: "Zepto", robots: PRIVATE_ROBOTS };

async function Result({ searchParams }: { searchParams: PageProps<"/connectors/zepto/done">["searchParams"] }) {
  const { status, message } = await searchParams;
  return (
    <ConnectDone
      ok={status === "ok"}
      message={typeof message === "string" ? message.slice(0, 200) : undefined}
    />
  );
}

/** Where the Zepto sign-in popup lands. Tells the opener and closes itself. */
export default function ZeptoDonePage(props: PageProps<"/connectors/zepto/done">) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6 text-center">
      <Suspense fallback={null}>
        <Result searchParams={props.searchParams} />
      </Suspense>
    </main>
  );
}
