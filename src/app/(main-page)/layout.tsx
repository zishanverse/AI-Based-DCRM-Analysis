"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      {/* Sidebar */}
      <AppSidebar variant="inset" />

      {/* Main Content Area */}
      <SidebarInset>
        {/* Header */}
        <SiteHeader />

        {/* Children = every dashboard page */}
        <div className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
          {children}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
