import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Priority } from "@/lib/system-store";

export function AddIssueModal({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onConfirm: (title: string, priority: Priority, description: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setError("");
    }
  }, [open]);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      setError("Title cannot be empty.");
      return;
    }
    onConfirm(trimmed, priority, description);
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
            REGISTER QUEST
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              className="sys-label text-[10px] font-bold tracking-wider"
              style={{ color: "#94a3b8" }}
            >
              Issue Title
            </label>
            <input
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="Describe the quest..."
              className="sys-glass-card w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:sys-border-glow cursor-text"
              style={{ color: "#e2e8f0" }}
            />
            {error && (
              <p className="text-xs" style={{ color: "#f87171" }}>
                {error}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label
              className="sys-label text-[10px] font-bold tracking-wider"
              style={{ color: "#94a3b8" }}
            >
              Description{" "}
              <span style={{ color: "#475569", fontWeight: 400 }}>
                (optional)
              </span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add additional details, context, or steps..."
              rows={3}
              className="sys-glass-card w-full rounded-lg px-3 py-2.5 text-sm outline-none focus:sys-border-glow resize-none cursor-text"
              style={{ color: "#e2e8f0" }}
            />
          </div>

          <div className="space-y-2">
            <label
              className="sys-label text-[10px] font-bold tracking-wider"
              style={{ color: "#94a3b8" }}
            >
              Priority Rank
            </label>
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as Priority)}
            >
              <SelectTrigger
                className="sys-glass-card sys-label w-full rounded-lg border-0 text-xs font-bold cursor-pointer"
                style={{ color: "#e2e8f0" }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent
                className="sys-panel sys-label"
                style={{ color: "#e2e8f0" }}
              >
                <SelectItem value="low">LOW</SelectItem>
                <SelectItem value="medium">MEDIUM</SelectItem>
                <SelectItem value="high">HIGH</SelectItem>
                <SelectItem value="critical">CRITICAL</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
            REGISTER
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
