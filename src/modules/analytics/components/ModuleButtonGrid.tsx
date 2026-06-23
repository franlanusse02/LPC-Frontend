import type { LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ModuleButton {
  icon: LucideIcon;
  label: string;
  to: string;
  hidden?: boolean;
}

interface Props {
  items: ModuleButton[];
  layout: "row" | "tile";
  className?: string;
}

export function ModuleButtonGrid({ items, layout, className }: Props) {
  const navigate = useNavigate();
  const visible = items.filter((i) => !i.hidden);

  return (
    <div
      className={cn(
        layout === "row" ? "grid grid-cols-2 gap-3" : "grid grid-cols-3 gap-3",
        className,
      )}
    >
      {visible.map((item) => {
        const Icon = item.icon;
        return layout === "row" ? (
          <Button
            key={item.to}
            variant="outline"
            onClick={() => navigate(item.to)}
            className="flex items-center justify-start gap-3 h-14 px-4 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
          >
            <Icon className="h-5 w-5 text-gray-500 shrink-0" />
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
          </Button>
        ) : (
          <Button
            key={item.to}
            variant="outline"
            onClick={() => navigate(item.to)}
            className="flex flex-col items-center justify-center gap-2 h-20 px-3 rounded-lg border-gray-200 hover:bg-gray-50 hover:border-gray-300"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gray-100">
              <Icon className="h-4 w-4 text-gray-600" />
            </div>
            <span className="text-xs font-medium text-gray-700 text-center leading-tight">
              {item.label}
            </span>
          </Button>
        );
      })}
    </div>
  );
}
