import { requireUser } from "@/lib/auth/session";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();

  return (
    <div className="flex min-h-screen">
      <SidebarNav email={user.email ?? ""} />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="flex-1 px-4 pb-20 pt-6 sm:px-6 md:pb-6 lg:px-8">
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
