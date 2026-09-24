import { Wallet } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Wallet className="size-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">MoneyOS</h1>
          <p className="text-sm text-muted-foreground">
            A calm, private dashboard for your money.
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
