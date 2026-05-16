import { Button } from "@/components/ui/button";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";

interface ExpandCollapseButtonProps {
  allExpanded: boolean;
  onExpandAll: () => void;
  onCollapseAll: () => void;
}

export default function ExpandCollapseButton({
  allExpanded,
  onExpandAll,
  onCollapseAll,
}: ExpandCollapseButtonProps) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 text-xs text-text-secondary hover:text-text-primary gap-1"
      onClick={allExpanded ? onCollapseAll : onExpandAll}
    >
      {allExpanded ? (
        <>
          <ChevronsDownUp size={13} />
          সব সংকুচিত
        </>
      ) : (
        <>
          <ChevronsUpDown size={13} />
          সব প্রসারিত
        </>
      )}
    </Button>
  );
}
