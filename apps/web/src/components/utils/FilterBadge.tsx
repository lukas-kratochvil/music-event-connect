import { X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";

type FilterBadgeProps = {
  label: string;
  onRemove: () => void;
};

export const FilterBadge = ({ label, onRemove }: FilterBadgeProps) => (
  <Badge
    variant="secondary"
    className="flex items-center gap-1.5 pl-2.5 pr-0 py-1 text-sm font-normal border-gray-400"
  >
    <span>{label}</span>
    <Button
      title="Remove filter"
      variant="destructive"
      className="ml-1 rounded-full border-0 hover:bg-muted-foreground/20 transition-colors"
      onClick={onRemove}
    >
      <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
    </Button>
  </Badge>
);
