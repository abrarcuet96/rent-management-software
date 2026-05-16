import { getAgreements } from "@/api/agreements.api";
import EmptyState from "@/components/common/EmptyState";
import { formatCurrency } from "@/lib/utils";
import type { TenantAgreement } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { FileText, Loader2 } from "lucide-react";

interface AgreementListProps {
  tenantId: string;
}

export default function AgreementList({ tenantId }: AgreementListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["agreements", tenantId],
    queryFn: () => getAgreements(tenantId),
    enabled: !!tenantId,
  });

  const agreements: TenantAgreement[] = data?.data.data ?? [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 size={20} className="animate-spin text-text-secondary" />
      </div>
    );
  }

  if (agreements.length === 0) {
    return (
      <EmptyState
        title="কোনো চুক্তি নেই"
        icon={<FileText size={36} />}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-neutral-bg">
          <tr>
            <th className="text-left px-3 py-2 font-medium text-text-secondary">
              শুরুর তারিখ
            </th>
            <th className="text-left px-3 py-2 font-medium text-text-secondary">
              শেষের তারিখ
            </th>
            <th className="text-right px-3 py-2 font-medium text-text-secondary">
              ভাড়া
            </th>
            <th className="text-center px-3 py-2 font-medium text-text-secondary">
              স্ট্যাটাস
            </th>
          </tr>
        </thead>
        <tbody>
          {agreements.map((ag) => (
            <tr key={ag.public_id} className="border-t border-border">
              <td className="px-3 py-2.5 text-text-primary">
                {ag.start_date}
              </td>
              <td className="px-3 py-2.5 text-text-secondary">
                {ag.end_date ?? "—"}
              </td>
              <td className="px-3 py-2.5 text-right text-text-primary font-medium">
                {formatCurrency(ag.rent_amount)}
              </td>
              <td className="px-3 py-2.5 text-center">
                {ag.is_active ? (
                  <span className="text-xs bg-success-bg text-success rounded-full px-2 py-0.5">
                    সক্রিয়
                  </span>
                ) : (
                  <span className="text-xs bg-neutral-bg text-text-secondary rounded-full px-2 py-0.5">
                    নিষ্ক্রিয়
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
