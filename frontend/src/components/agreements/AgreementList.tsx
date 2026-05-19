import { getAgreements } from "@/api/agreements.api";
import EmptyState from "@/components/common/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import type { TENANT_AGREEMENT } from "@/types";
import { useFetchData } from "@/hooks/useFetchData";
import { FileText, Loader2 } from "lucide-react";

interface AgreementListProps {
  tenantId: string;
}

export default function AgreementList({ tenantId }: AgreementListProps) {
  const { data, isLoading } = useFetchData({
    queryKey: ["agreements", tenantId],
    queryFn: () => getAgreements(tenantId),
    enabled: !!tenantId,
  });

  const agreements: TENANT_AGREEMENT[] = data?.data.data ?? [];

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
      <Table className="text-sm">
        <TableHeader className="bg-neutral-bg">
          <TableRow>
            <TableHead className="text-left px-3 py-2 font-medium text-text-secondary">
              শুরুর তারিখ
            </TableHead>
            <TableHead className="text-left px-3 py-2 font-medium text-text-secondary">
              শেষের তারিখ
            </TableHead>
            <TableHead className="text-right px-3 py-2 font-medium text-text-secondary">
              ভাড়া
            </TableHead>
            <TableHead className="text-center px-3 py-2 font-medium text-text-secondary">
              স্ট্যাটাস
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {agreements.map((ag) => (
            <TableRow key={ag.public_id} className="border-t border-border">
              <TableCell className="px-3 py-2.5 text-text-primary">
                {ag.start_date}
              </TableCell>
              <TableCell className="px-3 py-2.5 text-text-secondary">
                {ag.end_date ?? "—"}
              </TableCell>
              <TableCell className="px-3 py-2.5 text-right text-text-primary font-medium">
                {formatCurrency(ag.rent_amount)}
              </TableCell>
              <TableCell className="px-3 py-2.5 text-center">
                {ag.is_active ? (
                  <span className="text-xs bg-success-bg text-success rounded-full px-2 py-0.5">
                    সক্রিয়
                  </span>
                ) : (
                  <span className="text-xs bg-neutral-bg text-text-secondary rounded-full px-2 py-0.5">
                    নিষ্ক্রিয়
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
