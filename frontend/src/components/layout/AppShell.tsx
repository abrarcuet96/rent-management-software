import { useUiStore } from "@/stores/uiStore";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function AppShell() {
  const { mobileMenuOpen, setMobileMenuOpen } = useUiStore();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />

      {/* Mobile overlay backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          aria-hidden="true"
        />
      )}

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <TopBar />
        <main className="flex-1 overflow-auto p-4 md:p-6 bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
