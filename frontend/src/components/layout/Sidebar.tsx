import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import {
  BarChart3,
  Building2,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  DoorOpen,
  History,
  LayoutDashboard,
  Monitor,
  Moon,
  Receipt,
  Settings,
  Sun,
  Users,
} from "lucide-react";
import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

type NavLink = { type?: "link"; label: string; icon: React.ElementType; path: string };
type NavSection = { type: "section"; label: string };
type NavEntry = NavLink | NavSection;

const NAV_ITEMS: NavEntry[] = [
  { label: "ড্যাশবোর্ড", icon: LayoutDashboard, path: "/dashboard" },
  { type: "section", label: "সম্পত্তি" },
  { label: "বিল্ডিং", icon: Building2, path: "/buildings" },
  { label: "অ্যাপার্টমেন্ট", icon: DoorOpen, path: "/apartments" },
  { label: "ভাড়াটে", icon: Users, path: "/tenants" },
  { type: "section", label: "পেমেন্ট" },
  { label: "বাল্ক পেমেন্ট", icon: CreditCard, path: "/payments" },
  { label: "পেমেন্ট ইতিহাস", icon: History, path: "/payment-history" },
  { type: "section", label: "আর্থিক" },
  { label: "খরচ", icon: Receipt, path: "/expenses" },
  { label: "রিপোর্ট", icon: BarChart3, path: "/reports" },
];

const BOTTOM_ITEMS = [
  { label: "সেটিংস", icon: Settings, path: "/settings" },
] as const;

const THEME_OPTIONS = [
  { value: "light" as const, label: "লাইট", icon: Sun },
  { value: "dark" as const, label: "ডার্ক", icon: Moon },
  { value: "system" as const, label: "সিস্টেম", icon: Monitor },
];

function NavItem({
  item,
  collapsed,
}: {
  item: { label: string; icon: React.ElementType; path: string };
  collapsed: boolean;
}) {
  const location = useLocation();
  const exactPaths = ["/dashboard", "/buildings", "/apartments", "/tenants", "/payments", "/payment-history", "/expenses", "/reports", "/settings"];
  const isActive = exactPaths.includes(item.path)
    ? location.pathname === item.path
    : location.pathname.startsWith(item.path);

  const linkEl = (
    <NavLink
      to={item.path}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
        "text-white/70 hover:text-white hover:bg-white/10",
        isActive && "text-white bg-white/15 border-l-2 border-white rounded-l-none",
        collapsed && "justify-center px-2",
      )}
    >
      <item.icon size={18} className="shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </NavLink>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{linkEl}</TooltipTrigger>
        <TooltipContent side="right">{item.label}</TooltipContent>
      </Tooltip>
    );
  }

  return linkEl;
}

function SidebarContent({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) {
  const { theme, setTheme, toggleSidebar } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const CurrentThemeIcon = THEME_OPTIONS.find((t) => t.value === theme)?.icon ?? Monitor;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-[#0D4A38] text-white transition-all duration-200",
        collapsed ? "w-14" : "w-60",
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-14 px-3 border-b border-white/10 shrink-0",
          collapsed ? "justify-center" : "gap-2",
        )}
      >
        <div className="w-7 h-7 rounded-md bg-white/20 flex items-center justify-center shrink-0">
          <Building2 size={16} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-base tracking-tight">RentFlow</span>
        )}
      </div>

      {/* Nav */}
      <TooltipProvider delayDuration={0}>
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">
          {NAV_ITEMS.map((item, i) =>
            item.type === "section" ? (
              !collapsed ? (
                <p
                  key={`section-${i}`}
                  className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-white/40 select-none"
                >
                  {item.label}
                </p>
              ) : (
                <div key={`section-${i}`} className="border-t border-white/10 my-1" />
              )
            ) : (
              <NavItem key={(item as NavLink).path} item={item as NavLink} collapsed={collapsed} />
            )
          )}
        </nav>

        {/* Bottom */}
        <div className="px-2 pb-3 space-y-0.5 border-t border-white/10 pt-2">
          {BOTTOM_ITEMS.map((item) => (
            <NavItem key={item.path} item={item} collapsed={collapsed} />
          ))}

          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full text-white/70 hover:text-white hover:bg-white/10 justify-center px-2 h-9"
                    >
                      <CurrentThemeIcon size={18} className="shrink-0" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">থিম</TooltipContent>
                </Tooltip>
              ) : (
                <Button
                  variant="ghost"
                  className="w-full text-white/70 hover:text-white hover:bg-white/10 justify-start gap-3 px-3 h-9"
                >
                  <CurrentThemeIcon size={18} className="shrink-0" />
                  <span className="text-sm font-medium">থিম</span>
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent side="right" align="end" className="w-36">
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <DropdownMenuItem
                  key={value}
                  onClick={() => setTheme(value)}
                  className={cn("gap-2", theme === value && "font-medium")}
                >
                  <Icon size={15} />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Owner avatar */}
          {user && (
            <div
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-md",
                collapsed && "justify-center px-2",
              )}
            >
              <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold shrink-0">
                {user.full_name.charAt(0).toUpperCase()}
              </div>
              {!collapsed && (
                <span className="text-xs text-white/70 truncate">{user.full_name}</span>
              )}
            </div>
          )}

          {/* Collapse / close button */}
          <Button
            variant="ghost"
            onClick={onClose ?? toggleSidebar}
            className="flex w-full items-center justify-center h-8 text-white/50 hover:text-white hover:bg-white/10 rounded-md"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </Button>
        </div>
      </TooltipProvider>
    </div>
  );
}

export default function Sidebar() {
  const { sidebarCollapsed, mobileMenuOpen, setMobileMenuOpen, theme } = useUiStore();

  // Apply theme class to <html>
  useEffect(() => {
    const root = document.documentElement;
    const applyTheme = () => {
      if (theme === "dark") {
        root.classList.add("dark");
      } else if (theme === "light") {
        root.classList.remove("dark");
      } else {
        root.classList.toggle("dark", window.matchMedia("(prefers-color-scheme: dark)").matches);
      }
    };
    applyTheme();
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", applyTheme);
      return () => mq.removeEventListener("change", applyTheme);
    }
  }, [theme]);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex h-screen shrink-0">
        <SidebarContent collapsed={sidebarCollapsed} />
      </aside>

      {/* Mobile drawer */}
      <aside
        className={cn(
          "md:hidden fixed inset-y-0 left-0 z-30 transition-transform duration-200",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <SidebarContent collapsed={false} onClose={() => setMobileMenuOpen(false)} />
      </aside>
    </>
  );
}
