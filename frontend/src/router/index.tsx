import AppShell from "@/components/layout/AppShell";
import TitleWrapper from "@/components/common/RouteTitle";
import LoginPage from "@/pages/auth/LoginPage";
import RegisterPage from "@/pages/auth/RegisterPage";
import ApartmentsPage from "@/pages/ApartmentsPage";
import BuildingsPage from "@/pages/buildings/BuildingsPage";
import DashboardPage from "@/pages/DashboardPage";
import ExpensesPage from "@/pages/ExpensesPage";
import PaymentHistoryPage from "@/pages/PaymentHistoryPage";
import PaymentsPage from "@/pages/PaymentsPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import TenantDetailPage from "@/pages/tenants/TenantDetailPage";
import TenantsPage from "@/pages/tenants/TenantsPage";
import { Navigate, createBrowserRouter } from "react-router-dom";
import AuthGuard from "./AuthGuard";

export const router = createBrowserRouter([
  {
    element: <TitleWrapper />,
    children: [
      { path: "/login", element: <LoginPage />, handle: { title: "লগইন" } },
      { path: "/register", element: <RegisterPage />, handle: { title: "রেজিস্টার" } },
    ],
  },
  {
    element: <AuthGuard />,
    children: [
      { path: "/", element: <Navigate to="/dashboard" replace /> },
      {
        element: <TitleWrapper />,
        children: [
          {
            element: <AppShell />,
            children: [
              { path: "/dashboard", element: <DashboardPage />, handle: { title: "ড্যাশবোর্ড" } },
              { path: "/buildings", element: <BuildingsPage />, handle: { title: "বিল্ডিং" } },
              { path: "/apartments", element: <ApartmentsPage />, handle: { title: "অ্যাপার্টমেন্ট" } },
              { path: "/tenants", element: <TenantsPage />, handle: { title: "ভাড়াটে" } },
              { path: "/tenants/:tenantId", element: <TenantDetailPage />, handle: { title: "ভাড়াটে বিস্তারিত" } },
              { path: "/payments", element: <PaymentsPage />, handle: { title: "বাল্ক পেমেন্ট" } },
              { path: "/payment-history", element: <PaymentHistoryPage />, handle: { title: "পেমেন্ট ইতিহাস" } },
              { path: "/reports", element: <ReportsPage />, handle: { title: "রিপোর্ট" } },
              { path: "/expenses", element: <ExpensesPage />, handle: { title: "খরচ" } },
              { path: "/settings", element: <SettingsPage />, handle: { title: "সেটিংস" } },
            ],
          },
        ],
      },
    ],
  },
]);
