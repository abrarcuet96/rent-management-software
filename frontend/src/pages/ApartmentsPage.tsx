import { getApartments } from "@/api/apartments.api";
import { getBuildings } from "@/api/buildings.api";
import ApartmentCard from "@/components/apartments/ApartmentCard";
import CreateApartment from "@/components/apartments/CreateApartment";
import EditApartment from "@/components/apartments/EditApartment";
import AssignTenant from "@/components/tenants/AssignTenant";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import SkeletonCard from "@/components/common/SkeletonCard";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { APARTMENT, BUILDING } from "@/types";
import { useFetchData } from "@/hooks/useFetchData";
import { Building2, DoorOpen, Plus } from "lucide-react";
import { useState } from "react";

export default function ApartmentsPage() {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);
  const [editApartment, setEditApartment] = useState<APARTMENT | null>(null);
  const [assignApartmentId, setAssignApartmentId] = useState<string | null>(null);

  const { data: buildingsData } = useFetchData({
    queryKey: ["buildings"],
    queryFn: () => getBuildings({ page: 1, page_size: 100 }),
  });

  const buildings: BUILDING[] = buildingsData?.data.data ?? [];

  const {
    data: apartmentsData,
    isLoading,
    error,
    refetch,
  } = useFetchData({
    queryKey: ["apartments", selectedBuildingId],
    queryFn: () => getApartments(selectedBuildingId, { page: 1, page_size: 100 }),
    enabled: !!selectedBuildingId,
  });

  const apartments: APARTMENT[] = apartmentsData?.data.data ?? [];

  const selectedBuilding = buildings.find((b) => b.public_id === selectedBuildingId);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-text-primary">অ্যাপার্টমেন্ট</h2>
          {selectedBuildingId && !isLoading && (
            <p className="text-sm text-text-secondary mt-0.5">
              {selectedBuilding?.name} — মোট {apartments.length} টি
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-1">
            <Select value={selectedBuildingId} onValueChange={setSelectedBuildingId}>
              <SelectTrigger className="w-52">
                <SelectValue placeholder="বিল্ডিং বেছে নিন" />
              </SelectTrigger>
              <SelectContent>
                {buildings.length === 0 ? (
                  <div className="px-3 py-4 text-center text-xs text-text-secondary">
                    কোনো বিল্ডিং নেই — বিল্ডিং পেজে গিয়ে তৈরি করুন
                  </div>
                ) : (
                  buildings.map((b) => (
                    <SelectItem key={b.public_id} value={b.public_id}>
                      {b.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          {selectedBuildingId && (
            <Button
              onClick={() => setCreateOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus size={16} className="mr-1.5" />
              নতুন
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {!selectedBuildingId ? (
        <EmptyState
          title="বিল্ডিং বেছে নিন"
          description="অ্যাপার্টমেন্ট দেখতে উপরে থেকে একটি বিল্ডিং সিলেক্ট করুন"
          icon={<Building2 size={48} />}
        />
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">
              সব ({apartments.length})
            </TabsTrigger>
            <TabsTrigger value="vacant">
              খালি ({apartments.filter((a) => a.status === "vacant").length})
            </TabsTrigger>
            <TabsTrigger value="occupied">
              ভর্তি ({apartments.filter((a) => a.status === "occupied").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            <ApartmentGrid
              apartments={apartments}
              buildingId={selectedBuildingId}
              loading={isLoading}
              onEdit={setEditApartment}
              onAssignTenant={setAssignApartmentId}
              emptyTitle="কোনো অ্যাপার্টমেন্ট নেই"
              emptyDescription="এই বিল্ডিংয়ে অ্যাপার্টমেন্ট যোগ করুন"
            />
          </TabsContent>
          <TabsContent value="vacant">
            <ApartmentGrid
              apartments={apartments.filter((a) => a.status === "vacant")}
              buildingId={selectedBuildingId}
              loading={isLoading}
              onEdit={setEditApartment}
              onAssignTenant={setAssignApartmentId}
              emptyTitle="কোনো খালি অ্যাপার্টমেন্ট নেই"
              emptyDescription="সব অ্যাপার্টমেন্ট বর্তমানে ভাড়া দেওয়া আছে"
            />
          </TabsContent>
          <TabsContent value="occupied">
            <ApartmentGrid
              apartments={apartments.filter((a) => a.status === "occupied")}
              buildingId={selectedBuildingId}
              loading={isLoading}
              onEdit={setEditApartment}
              onAssignTenant={setAssignApartmentId}
              emptyTitle="কোনো ভর্তি অ্যাপার্টমেন্ট নেই"
              emptyDescription="কোনো অ্যাপার্টমেন্টে এখনো ভাড়াটে নেই"
            />
          </TabsContent>
        </Tabs>
      )}

      {/* Dialogs */}
      {selectedBuildingId && (
        <CreateApartment
          open={createOpen}
          onOpenChange={setCreateOpen}
          buildingId={selectedBuildingId}
          totalFloors={selectedBuilding?.total_floors ?? 99}
        />
      )}
      {editApartment && (
        <EditApartment
          open={!!editApartment}
          onOpenChange={(open) => { if (!open) setEditApartment(null); }}
          buildingId={selectedBuildingId}
          apartment={editApartment}
          totalFloors={selectedBuilding?.total_floors ?? 99}
        />
      )}
      {assignApartmentId && (
        <AssignTenant
          open={!!assignApartmentId}
          onOpenChange={(open) => { if (!open) setAssignApartmentId(null); }}
          apartmentId={assignApartmentId}
        />
      )}
    </div>
  );
}

interface ApartmentGridProps {
  apartments: APARTMENT[];
  buildingId: string;
  loading: boolean;
  onEdit: (apt: APARTMENT) => void;
  onAssignTenant: (aptId: string) => void;
  emptyTitle: string;
  emptyDescription: string;
}

function ApartmentGrid({
  apartments,
  buildingId,
  loading,
  onEdit,
  onAssignTenant,
  emptyTitle,
  emptyDescription,
}: ApartmentGridProps) {
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
          onAssignTenant={() => onAssignTenant(apt.public_id)}
        />
      ))}
    </div>
  );
}
