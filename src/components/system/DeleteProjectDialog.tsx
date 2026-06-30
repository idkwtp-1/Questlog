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

export function DeleteProjectDialog({
  open,
  onOpenChange,
  projectName,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  projectName: string;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sys-panel sys-hud-scan sys-pop-in rounded-xl border p-6">
        <AlertDialogHeader>
          <AlertDialogTitle
            className="sys-label sys-text-glow-purple text-lg font-bold tracking-wider"
            style={{ color: "#e040fb" }}
          >
            DELETE PROJECT
          </AlertDialogTitle>
          <AlertDialogDescription
            className="text-sm font-medium tracking-wide mt-2"
            style={{ color: "#94a3b8" }}
          >
            "{projectName}" — this will delete all quests inside. Proceed?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 mt-4">
          <AlertDialogCancel
            className="sys-label rounded-lg border border-slate-700 px-4 py-2.5 text-xs font-bold tracking-wider text-slate-400 hover:bg-white/5 cursor-pointer"
            style={{ backgroundColor: "transparent" }}
          >
            CANCEL
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className="sys-label rounded-lg px-4 py-2.5 text-xs font-bold tracking-wider transition-all duration-300 hover:bg-[#e040fb]/80 hover:sys-glow-crit cursor-pointer"
            style={{
              backgroundColor: "#e040fb",
              color: "#05060f",
            }}
          >
            DELETE
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
