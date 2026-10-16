import Link from "next/link";
import { Suspense } from "react";
import { Logo } from "@/components/brand";
import { Orb } from "@/components/orb";
import { SignIn } from "@/components/sign-in";
import { demoLoginEnabled, googleClientId, safeNext } from "@/lib/config";
import { PRIVATE_ROBOTS } from "@/lib/site";

export const metadata = { title: "Sign in", robots: PRIVATE_ROBOTS };

async function SignInWithNext({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const { next } = await searchParams;
  return (
    <SignIn
      clientId={googleClientId}
      demoEnabled={demoLoginEnabled}
      next={safeNext(Array.isArray(next) ? next[0] : next)}
    />
  );
}

// proxy.ts sends signed-in visitors straight on to `next`.
export default function LoginPage(props: PageProps<"/login">) {
  return (
    <main className="relative grid min-h-dvh lg:grid-cols-2">
      <Link href="/" className="absolute left-6 top-6 z-10 md:left-10 md:top-8">
        <Logo />
      </Link>

      <section className="dot-grid relative hidden items-center justify-center border-r border-line lg:flex">
        <div className="size-[min(36vw,520px)]">
          <Orb energy={0.3} />
        </div>
      </section>

      <section className="flex flex-col items-center justify-center px-6 py-24">
        <div className="w-full max-w-[340px]">
          <div className="mx-auto mb-8 size-40 lg:hidden">
            <Orb energy={0.3} />
          </div>
          <p className="label animate-rise">Sign in</p>
          <h1 className="display animate-rise mt-4 text-[40px]">Welcome to mise.</h1>
          <p className="animate-rise mt-4 text-[15px] leading-relaxed text-paper/55">
            We use your Google name and email to keep your kitchen settings and store connections. Nothing else.
          </p>
          <div className="animate-rise mt-10 [&>div]:items-start">
            <Suspense fallback={<div className="h-11" />}>
              <SignInWithNext searchParams={props.searchParams} />
            </Suspense>
          </div>
        </div>
      </section>
    </main>
  );
}
