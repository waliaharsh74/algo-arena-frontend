import type { ReactNode } from "react";

import { AccessDenied } from "@/components/auth/AccessDenied";
import { AuthGate } from "@/components/auth/AuthGate";
import { PageShimmer } from "@/components/layout/PageShimmer";
import { useAuthStore } from "@/store/authStore";

type ProtectedRouteProps = {
  children: ReactNode;
  requireAdmin?: boolean;
};

export const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { user, status } = useAuthStore();

  if (status === "loading") {
    return <PageShimmer />;
  }

  if (!user) {
    return <AuthGate />;
  }

  if (requireAdmin && user.role !== "ADMIN") {
    return <AccessDenied />;
  }

  return <>{children}</>;
};
