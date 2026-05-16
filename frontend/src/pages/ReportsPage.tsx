import OverdueReportTable from "@/components/reports/OverdueReportTable";
import MonthlyCollectionTable from "@/components/reports/MonthlyCollectionTable";
import AnnualSummaryTable from "@/components/reports/AnnualSummaryTable";
import PaymentHistoryReport from "@/components/reports/PaymentHistoryReport";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ReportsPage() {
  return (
    <Tabs defaultValue="overdue">
      <TabsList className="mb-6 flex-wrap">
        <TabsTrigger value="overdue">বকেয়া রিপোর্ট</TabsTrigger>
        <TabsTrigger value="collection">মাসিক সংগ্রহ</TabsTrigger>
        <TabsTrigger value="annual">বার্ষিক সারসংক্ষেপ</TabsTrigger>
        <TabsTrigger value="payment-history">পেমেন্ট ইতিহাস</TabsTrigger>
      </TabsList>
      <TabsContent value="overdue">
        <OverdueReportTable />
      </TabsContent>
      <TabsContent value="collection">
        <MonthlyCollectionTable />
      </TabsContent>
      <TabsContent value="annual">
        <AnnualSummaryTable />
      </TabsContent>
      <TabsContent value="payment-history">
        <PaymentHistoryReport />
      </TabsContent>
    </Tabs>
  );
}
