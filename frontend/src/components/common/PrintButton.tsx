import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";
import type { RefObject } from "react";
import { useReactToPrint } from "react-to-print";

interface PrintButtonProps {
  contentRef: RefObject<HTMLElement | null>;
  documentTitle?: string;
}

export default function PrintButton({ contentRef, documentTitle }: PrintButtonProps) {
  const handlePrint = useReactToPrint({
    contentRef,
    documentTitle,
  });

  return (
    <Button variant="outline" size="sm" onClick={() => handlePrint()}>
      <Printer size={15} className="mr-1.5" />
      প্রিন্ট করুন
    </Button>
  );
}
