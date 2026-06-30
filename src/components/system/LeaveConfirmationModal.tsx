import { useEffect, useRef } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function LeaveConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: () => void;
}) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Listen for Enter / Esc while open
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        e.stopImmediatePropagation();
        onConfirm();
      } else if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [open, onConfirm, onOpenChange]);

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sys-panel sys-hud-scan sys-pop-in rounded-xl border p-6">
        <AlertDialogHeader>
          <AlertDialogTitle
            className="sys-label text-lg font-bold tracking-wider"
            style={{
              color: "#ff5252",
              textShadow: "0 0 10px rgba(255,82,82,0.3)",
            }}
          >
            EXIT APPLICATION
          </AlertDialogTitle>
          <AlertDialogDescription
            className="text-sm font-medium tracking-wide mt-2"
            style={{ color: "#94a3b8" }}
          >
            Are you sure you want to exit QuestLog?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-4">
          <AlertDialogCancel
            ref={cancelRef}
            onClick={() => onOpenChange(false)}
            className="sys-label rounded-lg border border-slate-700 px-4 py-2.5 text-xs font-bold tracking-wider text-slate-400 hover:bg-white/5 cursor-pointer"
            style={{ backgroundColor: "transparent" }}
          >
            CANCEL (ESC)
          </AlertDialogCancel>
          <AlertDialogAction
            autoFocus
            onClick={onConfirm}
            className="sys-label rounded-lg px-4 py-2.5 text-xs font-bold tracking-wider transition-all duration-300 hover:bg-[#ff5252]/80 hover:shadow-[0_0_12px_rgba(255,82,82,0.5)] cursor-pointer"
            style={{
              backgroundColor: "#ff5252",
              color: "#05060f",
            }}
          >
            LEAVE (ENTER)
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
