import { type ReactNode, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AlertTriangle } from "lucide-react";

interface BulkActionModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description: string;
  confirmLabel: string;
  confirmColor?: "red" | "blue" | "emerald";
  accentColor?: string;
  count: number;
  children?: ReactNode;
  canConfirm?: boolean;
  onConfirm: () => Promise<void>;
}

const COLORS = {
  red: { bar: "bg-red-500", btn: "bg-red-500 hover:bg-red-600" },
  blue: { bar: "bg-blue-500", btn: "bg-blue-500 hover:bg-blue-600" },
  emerald: { bar: "bg-emerald-500", btn: "bg-emerald-500 hover:bg-emerald-600" },
};

export function BulkActionModal({
  open,
  onClose,
  title,
  description,
  confirmLabel,
  confirmColor = "blue",
  count,
  children,
  canConfirm = true,
  onConfirm,
}: BulkActionModalProps) {
  const [loading, setLoading] = useState(false);
  const colors = COLORS[confirmColor];

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md shadow-xl border-0 p-0 overflow-hidden">
        <div className={`h-1.5 w-full ${colors.bar}`} />

        <div className="px-6 pt-5 pb-6 space-y-5">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">
                {title}
              </DialogTitle>
            </div>

            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              {description}{" "}
              <strong className="text-gray-700">
                {count} registro{count !== 1 ? "s" : ""}
              </strong>
              .
            </DialogDescription>
          </DialogHeader>

          {children}

          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={loading || !canConfirm}
              className={`rounded-lg font-semibold text-white ${colors.btn}`}
            >
              {loading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Procesando...
                </>
              ) : (
                confirmLabel
              )}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
