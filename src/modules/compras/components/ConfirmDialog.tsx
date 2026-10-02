import { useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  // May be async; the dialog closes itself only when it resolves.
  onConfirm: () => void | Promise<void>;
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm }: Props) {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } catch {
      // caller already surfaced the error; keep the dialog open
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md shadow-xl border-0 p-0 overflow-hidden">
        <div className="h-1.5 w-full bg-red-500" />
        <div className="px-6 pt-5 pb-6 space-y-5">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50 text-red-500">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <DialogTitle className="text-lg font-bold text-gray-900">{title}</DialogTitle>
            </div>
            <DialogDescription className="text-sm text-gray-500 leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm} disabled={busy} className="font-semibold bg-red-500 hover:bg-red-600 text-white">
              {busy ? <><Spinner className="mr-2 h-4 w-4" />{confirmLabel}...</> : confirmLabel}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
