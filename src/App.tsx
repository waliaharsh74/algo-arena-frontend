import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/components/layout/AppLayout";
import { ContestCreationPage } from "@/pages/ContestCreationPage";
import { ContestExplorerPage } from "@/pages/ContestExplorerPage";
import { HomePage } from "@/pages/HomePage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { useAuthStore } from "@/store/authStore";
import { useContestStore } from "@/store/contestStore";

const App = () => {
  const { refresh, user } = useAuthStore();
  const { loadAllContests } = useContestStore();

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (user) {
      void loadAllContests();
    }
  }, [user, loadAllContests]);

  return (
    <AppLayout>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contests"
          element={
            <ProtectedRoute>
              <ContestExplorerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contests/create"
          element={
            <ProtectedRoute requireAdmin>
              <ContestCreationPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AppLayout>
  );
};

export default App;
