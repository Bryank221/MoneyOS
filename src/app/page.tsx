import Link from "next/link";
import { Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
        <Wallet className="size-7" />
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          MoneyOS
        </h1>
        <p className="mx-auto max-w-md text-balance text-muted-foreground">
          A free, private dashboard for tracking accounts, spending, budgets
          and savings goals in Ringgit Malaysia.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <Link href="/signup" className={buttonVariants({ size: "lg" })}>
          Get started
        </Link>
        <Link href="/login" className={buttonVariants({ variant: "outline", size: "lg" })}>
          Log in
        </Link>
      </div>
    </main>
  );
}
