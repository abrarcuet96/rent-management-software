import { getTenants } from "@/api/tenants.api";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import SkeletonCard from "@/components/common/SkeletonCard";
import TenantCard from "@/components/tenants/TenantCard";
import CreateTenantDialog from "@/components/tenants/CreateTenantDialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { TENANT } from "@/types";
import { useFetchData } from "@/hooks/useFetchData";
import { Plus, Users } from "lucide-react";
import { useState } from "react";

export default function TenantsPage() {
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, error, refetch } = useFetchData({
    queryKey: ["tenants"],
    queryFn: () => getTenants({ page: 1, page_size: 100 }),
  });

  // TODO: filter by status via API (status param) instead of is_active — is_active is an internal DB field
  const tenants: TENANT[] = data?.data.data ?? [];

  if (error) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div>
      <CreateTenantDialog open={createOpen} onOpenChange={setCreateOpen} />

      <Tabs defaultValue="active">
        <div className="flex items-start justify-between mb-4">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-semibold text-text-primary">ভাড়াটেদের তালিকা</h2>
            <TabsList>
              <TabsTrigger value="active">সক্রিয়</TabsTrigger>
              <TabsTrigger value="moved_out">চলে গেছে</TabsTrigger>
              <TabsTrigger value="all">সব</TabsTrigger>
            </TabsList>
          </div>
          <Button
            onClick={() => setCreateOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            <Plus size={16} className="mr-1.5" />
            নতুন ভাড়াটে
          </Button>
        </div>

        <TabsContent value="active">
          <TenantGrid
            tenants={tenants.filter((t) => t.is_active)}
            loading={isLoading}
          />
        </TabsContent>
        <TabsContent value="moved_out">
          <TenantGrid
            tenants={tenants.filter((t) => !t.is_active)}
            loading={isLoading}
          />
        </TabsContent>
        <TabsContent value="all">
          <TenantGrid
            tenants={tenants}
            loading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface TenantGridProps {
  tenants: TENANT[];
  loading: boolean;
}

function TenantGrid({ tenants, loading }: TenantGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (!tenants || tenants.length === 0) {
    return (
      <EmptyState
        title="কোনো ভাড়াটে নেই"
        description="একটি অ্যাপার্টমেন্টে ভাড়াটে যোগ করুন"
        icon={<Users size={48} />}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {tenants.map((t) => (
        <TenantCard
          key={t.public_id}
          tenant={t}
          buildingName={t.building_name}
          unitNumber={t.apartment_unit_number}
        />
      ))}
    </div>
  );
}
