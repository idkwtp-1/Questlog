import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export function NewProjectModal({
  open,
  onOpenChange,
  onConfirm,
  existingNames,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (name: string) => void;
  existingNames: string[];
}) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setError("");
    }
  }, [open]);

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name cannot be empty.");
      return;
    }
    if (existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())) {
      setError("A project with this name already exists.");
      return;
    }
    onConfirm(trimmed);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sys-panel sys-hud-scan sys-pop-in rounded-xl border p-6">
        <DialogHeader>
          <DialogTitle
            className="sys-label sys-text-glow text-lg font-bold tracking-wider"
            style={{ color: "#4fc3f7" }}
          >
            INITIALIZE PROJECT
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <label
            className="sys-label text-[10px] font-bold tracking-wider"
            style={{ color: "#94a3b8" }}
          >
            Project Name
          </label>
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Enter project name..."
            className="sys-glass-card w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-all focus:sys-border-glow cursor-text"
            style={{ color: "#e2e8f0" }}
          />
          {error && (
            <p className="text-xs" style={{ color: "#f87171" }}>
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 mt-2">
          <button
            onClick={() => onOpenChange(false)}
            className="sys-label rounded-lg px-4 py-2.5 text-xs font-bold tracking-wider transition-colors duration-200 hover:bg-white/5 border border-slate-700 text-slate-400 cursor-pointer"
          >
            CANCEL
          </button>
          <button
            onClick={submit}
            className="sys-label rounded-lg px-4 py-2.5 text-xs font-bold tracking-wider transition-all duration-300 hover:bg-[#4fc3f7]/80 hover:sys-glow cursor-pointer"
            style={{
              backgroundColor: "#4fc3f7",
              color: "#05060f",
            }}
          >
            CONFIRM
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
