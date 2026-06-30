import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriorityBadge } from "./PriorityBadge";
import { Check, Clock, FileText, Pencil, X } from "lucide-react";
import type { Issue, Priority } from "@/lib/system-store";

export function QuestDetailModal({
  issue,
  open,
  onOpenChange,
  onToggle,
  onUpdate,
}: {
  issue: Issue | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onToggle: () => void;
  onUpdate: (patch: {
    title?: string;
    description?: string;
    priority?: Priority;
  }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<Priority>("medium");
  const [titleError, setTitleError] = useState("");

  // Reset whenever a new issue opens
  useEffect(() => {
    if (issue) {
      setEditTitle(issue.title);
      setEditDescription(issue.description ?? "");
      setEditPriority(issue.priority);
    }
    setEditing(false);
    setTitleError("");
  }, [issue, open]);

  if (!issue) return null;

  const createdDate = new Date(issue.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleSave = () => {
    const trimmedTitle = editTitle.trim();
    if (!trimmedTitle) {
      setTitleError("Title cannot be empty.");
      return;
    }
    onUpdate({
      title: trimmedTitle,
      description: editDescription.trim(),
      priority: editPriority,
    });
    setEditing(false);
    setTitleError("");
  };

  const handleCancel = () => {
    setEditTitle(issue.title);
    setEditDescription(issue.description ?? "");
    setEditPriority(issue.priority);
    setTitleError("");
    setEditing(false);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) handleCancel();
        onOpenChange(o);
      }}
    >
      <DialogContent className="sys-panel sys-hud-scan sys-pop-in rounded-xl border max-w-lg w-full p-6">
        {/* ── Header ── */}
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-6">
            {editing ? (
              <div className="flex-1 space-y-1">
                <input
                  autoFocus
                  value={editTitle}
                  onChange={(e) => {
                    setEditTitle(e.target.value);
                    setTitleError("");
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSave()}
                  placeholder="Quest title..."
                  className="sys-glass-card w-full rounded-lg px-3 py-2 text-sm font-bold outline-none focus:sys-border-glow cursor-text"
                  style={{ color: "#e2e8f0" }}
                />
                {titleError && (
                  <p className="text-xs" style={{ color: "#f87171" }}>
                    {titleError}
                  </p>
                )}
              </div>
            ) : (
              <DialogTitle
                className="text-base font-bold leading-snug break-words tracking-wide"
                style={{ color: "#e2e8f0" }}
              >
                {issue.title}
              </DialogTitle>
            )}

            {/* Priority — editable select in edit mode, badge otherwise */}
            {editing ? (
              <Select
                value={editPriority}
                onValueChange={(v) => setEditPriority(v as Priority)}
              >
                <SelectTrigger
                  className="sys-glass-card sys-label w-28 shrink-0 rounded-lg border-0 text-xs font-bold cursor-pointer"
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
            ) : (
              <PriorityBadge priority={issue.priority} />
            )}
          </div>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* ── Description ── */}
          <div className="sys-glass-card rounded-lg p-4 min-h-[80px]">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-3.5 w-3.5" style={{ color: "#4fc3f7" }} />
              <span
                className="sys-label text-[10px] font-bold tracking-wider"
                style={{ color: "#4fc3f7" }}
              >
                DESCRIPTION
              </span>
            </div>
            {editing ? (
              <textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Add additional details, context, or steps..."
                rows={4}
                className="sys-glass-card w-full rounded-lg px-3 py-2 text-sm outline-none focus:sys-border-glow resize-none cursor-text"
                style={{
                  color: "#e2e8f0",
                }}
              />
            ) : issue.description ? (
              <p
                className="text-sm leading-relaxed whitespace-pre-wrap"
                style={{ color: "#94a3b8" }}
              >
                {issue.description}
              </p>
            ) : (
              <p className="text-sm italic" style={{ color: "#475569" }}>
                No description provided.
              </p>
            )}
          </div>

          {/* ── Footer row ── */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            {/* Timestamp */}
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" style={{ color: "#475569" }} />
              <span
                className="sys-label text-[10px] font-bold tracking-wider"
                style={{ color: "#475569" }}
              >
                {createdDate}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {editing ? (
                <>
                  <button
                    onClick={handleCancel}
                    className="sys-label flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold tracking-wider transition-colors duration-200 hover:bg-white/5 border border-slate-700 text-slate-400 cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" />
                    CANCEL
                  </button>
                  <button
                    onClick={handleSave}
                    className="sys-label flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[10px] font-bold tracking-wider transition-all duration-300 hover:bg-[#4fc3f7]/80 hover:sys-glow cursor-pointer"
                    style={{
                      backgroundColor: "#4fc3f7",
                      color: "#05060f",
                    }}
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    SAVE
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setEditing(true)}
                    className="sys-label flex items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold tracking-wider transition-colors duration-200 hover:bg-white/5 border border-slate-700 text-slate-400 cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    EDIT
                  </button>
                  <button
                    onClick={() => {
                      onToggle();
                      onOpenChange(false);
                    }}
                    className="sys-label flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-[10px] font-bold tracking-wider transition-all duration-300 hover:sys-glow cursor-pointer"
                    style={
                      issue.done
                        ? {
                            backgroundColor: "rgba(79,195,247,0.1)",
                            color: "#4fc3f7",
                            border: "1px solid rgba(79,195,247,0.3)",
                          }
                        : {
                            backgroundColor: "#4fc3f7",
                            color: "#05060f",
                          }
                    }
                  >
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                    {issue.done ? "MARK AS OPEN" : "MARK AS DONE"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
