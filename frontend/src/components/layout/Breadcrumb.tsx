import { useNavigationStore } from "@/stores/navigationStore";
import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

interface Crumb {
  label: string;
  path?: string; // undefined = current page (not linked)
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "ড্যাশবোর্ড",
  "/buildings": "বিল্ডিং",
  "/apartments": "অ্যাপার্টমেন্ট",
  "/tenants": "ভাড়াটে",
  "/payments": "বাল্ক পেমেন্ট",
  "/payment-history": "পেমেন্ট ইতিহাস",
  "/expenses": "খরচ",
  "/reports": "রিপোর্ট",
  "/settings": "সেটিংস",
};

function useCrumbs(pathname: string): Crumb[] | null {
  const {
    activeBuildingId,
    activeBuildingName,
    activeApartmentName,
    activeTenantName,
  } = useNavigationStore();

  const segments = pathname.split("/").filter(Boolean);

  // /buildings/:buildingId
  if (segments[0] === "buildings" && segments.length === 2) {
    return [
      { label: "বিল্ডিং", path: "/buildings" },
      { label: activeBuildingName ?? "..." },
    ];
  }

  // /buildings/:buildingId/apartments/:apartmentId
  if (segments[0] === "buildings" && segments.length === 4) {
    const buildingId = activeBuildingId ?? segments[1];
    return [
      { label: "বিল্ডিং", path: "/buildings" },
      { label: activeBuildingName ?? "...", path: `/buildings/${buildingId}` },
      { label: activeApartmentName ?? "..." },
    ];
  }

  // /tenants/:tenantId
  if (segments[0] === "tenants" && segments.length === 2) {
    return [
      { label: "ভাড়াটেদের তালিকা", path: "/tenants" },
      { label: activeTenantName ?? "..." },
    ];
  }

  return null;
}

export default function Breadcrumb() {
  const location = useLocation();
  const crumbs = useCrumbs(location.pathname);

  // Top-level pages: render plain title
  if (!crumbs) {
    const title = PAGE_TITLES[location.pathname];
    if (!title) return null;
    return (
      <h1 className="text-base font-semibold text-text-primary truncate">
        {title}
      </h1>
    );
  }

  // Detail pages: render full clickable breadcrumb trail
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1 text-sm min-w-0">
      <Link
        to="/dashboard"
        className="shrink-0 text-text-secondary hover:text-primary transition-colors"
        aria-label="হোম"
      >
        <Home size={14} />
      </Link>

      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1 min-w-0">
            <ChevronRight size={13} className="text-border shrink-0" />
            {isLast || !crumb.path ? (
              <span
                className={
                  isLast
                    ? "font-semibold text-text-primary truncate max-w-[160px] sm:max-w-[220px]"
                    : "text-text-secondary truncate max-w-[120px]"
                }
                title={crumb.label}
              >
                {crumb.label}
              </span>
            ) : (
              <Link
                to={crumb.path}
                className="text-text-secondary hover:text-primary transition-colors truncate max-w-[120px] sm:max-w-[180px]"
                title={crumb.label}
              >
                {crumb.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
