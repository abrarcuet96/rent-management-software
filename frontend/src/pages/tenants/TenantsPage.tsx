import { getTenants } from "@/api/tenants.api";
import EmptyState from "@/components/common/EmptyState";
import ErrorState from "@/components/common/ErrorState";
import SkeletonCard from "@/components/common/SkeletonCard";
import TenantCard from "@/components/tenants/TenantCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Tenant } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Users } from "lucide-react";

export default function TenantsPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => getTenants({ page: 1, page_size: 100 }),
  });

  const tenants = data?.data.data ?? [];

  if (error) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  return (
    <div>
      <Tabs defaultValue="active">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">ভাড়াটেদের তালিকা</h2>
          <TabsList>
            <TabsTrigger value="active">সক্রিয়</TabsTrigger>
            <TabsTrigger value="moved_out">চলে গেছে</TabsTrigger>
            <TabsTrigger value="all">সব</TabsTrigger>
          </TabsList>
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
  tenants: Tenant[];
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
        <TenantCard key={t.public_id} tenant={t} />
      ))}
    </div>
  );
}
