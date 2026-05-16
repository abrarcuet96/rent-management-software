import { getApartments } from "@/api/apartments.api";
import { getBuildingById } from "@/api/buildings.api";
import ApartmentCard from "@/components/apartments/ApartmentCard";
import CreateApartment from "@/components/apartments/CreateApartment";
import EditApartment from "@/components/apartments/EditApartment";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import SkeletonCard from "@/components/common/SkeletonCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigationStore } from "@/stores/navigationStore";
import type { Apartment } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { DoorOpen, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

export default function BuildingDetailPage() {
  const { buildingId } = useParams<{ buildingId: string }>();
  const [createOpen, setCreateOpen] = useState(false);
  const [editApartment, setEditApartment] = useState<Apartment | null>(null);
  const { setActiveBuilding, setActiveApartment } = useNavigationStore();

  const {
    data: buildingData,
    isLoading: buildingLoading,
    error: buildingError,
    refetch: refetchBuilding,
  } = useQuery({
    queryKey: ["buildings", buildingId],
    queryFn: () => getBuildingById(buildingId!),
    enabled: !!buildingId,
  });

  const {
    data: apartmentsData,
    isLoading: apartmentsLoading,
    error: apartmentsError,
    refetch: refetchApartments,
  } = useQuery({
    queryKey: ["apartments", buildingId],
    queryFn: () => getApartments(buildingId!, { page: 1, page_size: 100 }),
    enabled: !!buildingId,
  });

  const building = buildingData?.data.data;
  const apartments = apartmentsData?.data.data ?? [];

  useEffect(() => {
    if (building) {
      setActiveBuilding(buildingId ?? null, building.name);
    }
    return () => {
      setActiveBuilding(null);
      setActiveApartment(null);
    };
  }, [building, buildingId, setActiveBuilding, setActiveApartment]);

  if (buildingError) {
    return <ErrorState onRetry={() => refetchBuilding()} />;
  }

  if (buildingLoading) {
    return <SkeletonCard />;
  }

  return (
    <div>
      {/* Building info */}
      <div className="bg-surface rounded-xl p-5 border border-border mb-6">
        <h2 className="text-xl font-semibold text-text-primary">{building?.name}</h2>
        <p className="text-sm text-text-secondary mt-1">{building?.address}</p>
        <p className="text-xs text-text-secondary mt-2">
          মোট তলা: {building?.total_floors} • মোট অ্যাপার্টমেন্ট: {apartments.length}
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all">
        <div className="flex items-center justify-between mb-4">
          <TabsList>
            <TabsTrigger value="all">সব</TabsTrigger>
            <TabsTrigger value="vacant">খালি</TabsTrigger>
            <TabsTrigger value="occupied">ভর্তি</TabsTrigger>
          </TabsList>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus size={16} className="mr-1.5" />
            নতুন অ্যাপার্টমেন্ট
          </Button>
        </div>

        <TabsContent value="all">
          <ApartmentGrid
            apartments={apartments}
            buildingId={buildingId!}
            loading={apartmentsLoading}
            error={apartmentsError}
            onRetry={() => refetchApartments()}
            onEdit={setEditApartment}
            emptyTitle="কোনো অ্যাপার্টমেন্ট নেই"
            emptyDescription="এই বিল্ডিংয়ে অ্যাপার্টমেন্ট যোগ করুন"
          />
        </TabsContent>
        <TabsContent value="vacant">
          <ApartmentGrid
            apartments={apartments.filter((a) => a.status === "vacant")}
            buildingId={buildingId!}
            loading={apartmentsLoading}
            error={apartmentsError}
            onRetry={() => refetchApartments()}
            onEdit={setEditApartment}
            emptyTitle="কোনো খালি অ্যাপার্টমেন্ট নেই"
            emptyDescription="সব অ্যাপার্টমেন্ট বর্তমানে ভাড়া দেওয়া আছে"
          />
        </TabsContent>
        <TabsContent value="occupied">
          <ApartmentGrid
            apartments={apartments.filter((a) => a.status === "occupied")}
            buildingId={buildingId!}
            loading={apartmentsLoading}
            error={apartmentsError}
            onRetry={() => refetchApartments()}
            onEdit={setEditApartment}
            emptyTitle="কোনো ভর্তি অ্যাপার্টমেন্ট নেই"
            emptyDescription="কোনো অ্যাপার্টমেন্টে এখনো ভাড়াটে নেই"
          />
        </TabsContent>
      </Tabs>

      <CreateApartment
        open={createOpen}
        onOpenChange={setCreateOpen}
        buildingId={buildingId!}
      />
      {editApartment && (
        <EditApartment
          open={!!editApartment}
          onOpenChange={(open) => {
            if (!open) setEditApartment(null);
          }}
          buildingId={buildingId!}
          apartment={editApartment}
        />
      )}
    </div>
  );
}

interface ApartmentGridProps {
  apartments: Apartment[];
  buildingId: string;
  loading: boolean;
  error: Error | null;
  onRetry: () => void;
  onEdit: (apt: Apartment) => void;
  emptyTitle: string;
  emptyDescription: string;
}

function ApartmentGrid({ apartments, buildingId, loading, error, onRetry, onEdit, emptyTitle, emptyDescription }: ApartmentGridProps) {
  if (error) {
    return <ErrorState onRetry={onRetry} />;
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (apartments.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={<DoorOpen size={48} />}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {apartments.map((apt) => (
        <ApartmentCard
          key={apt.public_id}
          apartment={apt}
          buildingId={buildingId}
          onEdit={() => onEdit(apt)}
        />
      ))}
    </div>
  );
}
