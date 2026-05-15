import { getBuildings } from "@/api/buildings.api";
import BuildingCard from "@/components/buildings/BuildingCard";
import CreateBuilding from "@/components/buildings/CreateBuilding";
import EditBuilding from "@/components/buildings/EditBuilding";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import SkeletonCard from "@/components/common/SkeletonCard";
import { Button } from "@/components/ui/button";
import type { Building } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Building2, Plus } from "lucide-react";
import { useState } from "react";

export default function BuildingsPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editBuilding, setEditBuilding] = useState<Building | null>(null);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["buildings"],
    queryFn: () => getBuildings({ page: 1, page_size: 100 }),
  });

  const buildings = data?.data.data ?? [];

  if (error) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">আপনার বিল্ডিং সমূহ</h2>
          <p className="text-sm text-text-secondary mt-0.5">
            মোট {data?.data.pagination.total ?? 0} টি বিল্ডিং
          </p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Plus size={16} className="mr-1.5" />
          নতুন বিল্ডিং
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : buildings.length === 0 ? (
        <EmptyState
          title="কোনো বিল্ডিং নেই"
          description="আপনার প্রথম বিল্ডিং যোগ করুন"
          icon={<Building2 size={48} />}
          action={
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus size={16} className="mr-1.5" />
              নতুন বিল্ডিং
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {buildings.map((b) => (
            <BuildingCard
              key={b.public_id}
              building={b}
              onEdit={() => setEditBuilding(b)}
            />
          ))}
        </div>
      )}

      <CreateBuilding open={createOpen} onOpenChange={setCreateOpen} />
      {editBuilding && (
        <EditBuilding
          open={!!editBuilding}
          onOpenChange={(open) => {
            if (!open) setEditBuilding(null);
          }}
          building={editBuilding}
        />
      )}
    </div>
  );
}
