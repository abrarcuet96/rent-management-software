import AppShell from "@/components/layout/AppShell";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ApartmentDetailPage from "@/pages/buildings/ApartmentDetailPage";
import BuildingDetailPage from "@/pages/buildings/BuildingDetailPage";
import BuildingsPage from "@/pages/buildings/BuildingsPage";
import DashboardPage from "@/pages/DashboardPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import TenantDetailPage from "@/pages/tenants/TenantDetailPage";
import TenantsPage from "@/pages/tenants/TenantsPage";
import { Navigate, createBrowserRouter } from "react-router-dom";
import AuthGuard from "./AuthGuard";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    element: <AuthGuard />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" replace /> },
      {
        element: <AppShell />,
        children: [
          { path: "/dashboard", element: <DashboardPage /> },
          { path: "/buildings", element: <BuildingsPage /> },
          { path: "/buildings/:buildingId", element: <BuildingDetailPage /> },
          {
            path: "/buildings/:buildingId/apartments/:apartmentId",
            element: <ApartmentDetailPage />,
          },
          { path: "/tenants", element: <TenantsPage /> },
          { path: "/tenants/:tenantId", element: <TenantDetailPage /> },
          { path: "/reports", element: <ReportsPage /> },
          { path: "/settings", element: <SettingsPage /> },
        ],
      },
    ],
  },
]);
