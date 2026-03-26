import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { syncUser } from "@/lib/auth/sync-user";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppSidebar } from "@/components/app-sidebar";
import { NotificationBell } from "@/components/notification-bell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const email = user?.emailAddresses[0]?.emailAddress ?? "";

  await syncUser(userId, email);

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen>
        <AppSidebar />
        <div className="flex-1 flex flex-col overflow-auto">
          <header className="flex items-center justify-end border-b px-4 py-2">
            <NotificationBell />
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
