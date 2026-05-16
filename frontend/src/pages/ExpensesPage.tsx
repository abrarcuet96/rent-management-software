import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ExpenseCategoriesTab from "@/components/expenses/ExpenseCategoriesTab";
import ExpensesTab from "@/components/expenses/ExpensesTab";

export default function ExpensesPage() {
  return (
    <Tabs defaultValue="expenses">
      <TabsList className="mb-6">
        <TabsTrigger value="expenses">খরচ</TabsTrigger>
        <TabsTrigger value="categories">ক্যাটাগরি</TabsTrigger>
      </TabsList>
      <TabsContent value="expenses">
        <ExpensesTab />
      </TabsContent>
      <TabsContent value="categories">
        <ExpenseCategoriesTab />
      </TabsContent>
    </Tabs>
  );
}
