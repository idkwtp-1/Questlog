import { useState } from "react";
import { Check, Trash2, Copy } from "lucide-react";
import { PriorityBadge } from "./PriorityBadge";
import type { Issue } from "@/lib/system-store";

export function IssueCard({
  issue,
  onToggle,
  onDelete,
  onOpen,
}: {
  issue: Issue;
  onToggle: () => void;
  onDelete: () => void;
  onOpen: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(issue.description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  return (
    <div className="sys-glass-card sys-fade-in group flex min-w-0 items-center gap-3.5 overflow-hidden rounded-lg px-4 py-3.5 cursor-pointer">
      {/* Completion checkbox */}
      <button
        onClick={onToggle}
        aria-label={issue.done ? "Mark as not done" : "Mark as done"}
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-all duration-300 cursor-pointer"
        style={{
          borderColor: "rgba(79, 195, 247, 0.6)",
          backgroundColor: issue.done ? "#4fc3f7" : "transparent",
          boxShadow: issue.done
            ? "0 0 10px rgba(79, 195, 247, 0.4)"
            : undefined,
        }}
      >
        {issue.done && (
          <Check
            className="h-3.5 w-3.5"
            style={{ color: "#05060f" }}
            strokeWidth={3}
          />
        )}
      </button>

      {/* Clickable text body — opens detail modal */}
      <button
        onClick={onOpen}
        className="min-w-0 flex-1 overflow-hidden text-left hover:text-[#4fc3f7] transition-colors duration-200 cursor-pointer"
        aria-label="View quest details"
      >
        <p
          className="truncate text-sm font-semibold tracking-wide transition-all duration-200"
          style={{
            color: "#e2e8f0",
            opacity: issue.done ? 0.35 : 1,
            textDecoration: issue.done ? "line-through" : "none",
          }}
        >
          {issue.title}
        </p>
      </button>

      <PriorityBadge priority={issue.priority} />

      {/* Action buttons (Copy/Delete) - group hover opacity transitions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {/* Copy button — always present */}
        <button
          onClick={handleCopy}
          aria-label="Copy description"
          className="rounded p-1 transition-colors duration-200 text-slate-500 hover:text-[#4fc3f7] hover:bg-[#4fc3f7]/10 cursor-pointer"
          style={{
            color: copied ? "#4fc3f7" : undefined,
          }}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Copy className="h-4 w-4" strokeWidth={1.75} />
          )}
        </button>

        {/* Delete button */}
        <button
          onClick={onDelete}
          aria-label="Delete issue"
          className="rounded p-1 text-slate-500 transition-colors duration-200 hover:text-red-400 hover:bg-red-500/10 cursor-pointer"
        >
          <Trash2 className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}
