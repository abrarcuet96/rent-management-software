import BulkPaymentHistoryTab from "@/components/payments/BulkPaymentHistoryTab";
import BulkPaymentTab from "@/components/payments/BulkPaymentTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function PaymentsPage() {
  return (
    <Tabs defaultValue="bulk">
      <TabsList className="mb-6">
        <TabsTrigger value="bulk">বাল্ক পেমেন্ট</TabsTrigger>
        <TabsTrigger value="bulk-history">বাল্ক ইতিহাস</TabsTrigger>
      </TabsList>
      <TabsContent value="bulk">
        <BulkPaymentTab />
      </TabsContent>
      <TabsContent value="bulk-history">
        <BulkPaymentHistoryTab />
      </TabsContent>
    </Tabs>
  );
}
