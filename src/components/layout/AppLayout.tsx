import type { ReactNode } from "react";

import { AppHeader } from "@/components/layout/AppHeader";

type AppLayoutProps = {
  children: ReactNode;
};

export const AppLayout = ({ children }: AppLayoutProps) => (
  <div className="min-h-screen">
    <div className="mx-auto max-w-7xl px-6 py-10 lg:py-12">
      <AppHeader />
      <main className="mt-10">{children}</main>
    </div>
  </div>
);
