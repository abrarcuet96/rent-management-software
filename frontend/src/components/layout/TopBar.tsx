import Breadcrumb from "@/components/layout/Breadcrumb";
import { Button } from "@/components/ui/button";
import { useUiStore } from "@/stores/uiStore";
import { Menu } from "lucide-react";
import type { ReactNode } from "react";

interface TopBarProps {
  children?: ReactNode;
}

export default function TopBar({ children }: TopBarProps) {
  const { toggleMobileMenu } = useUiStore();

  return (
    <header className="h-14 shrink-0 flex items-center px-4 md:px-6 gap-3 bg-surface border-b border-border">
      {/* Mobile hamburger */}
      <Button
        variant="ghost"
        onClick={toggleMobileMenu}
        className="md:hidden h-8 w-8 p-0 text-text-secondary hover:text-text-primary hover:bg-neutral-bg"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </Button>

      {/* Breadcrumb / page title */}
      <div className="flex-1 min-w-0">
        <Breadcrumb />
      </div>

      {/* Page actions slot */}
      <div className="flex items-center gap-2 shrink-0">
        {children}
      </div>
    </header>
  );
}
