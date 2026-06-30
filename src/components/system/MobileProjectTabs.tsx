import { Plus } from "lucide-react";
import type { Issue, Project } from "@/lib/system-store";

export function MobileProjectTabs({
  projects,
  issues,
  selectedId,
  onSelect,
  onNew,
}: {
  projects: Project[];
  issues: Issue[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="sys-panel flex items-center gap-2 overflow-x-auto rounded-none border-x-0 border-t-0 px-3 py-3 border-b border-border">
      <h1
        className="sys-label shrink-0 pr-2 text-sm font-bold tracking-wider sys-text-glow"
        style={{ color: "#4fc3f7" }}
      >
        [SYSTEM]
      </h1>
      {projects.map((p) => {
        const open = issues.filter(
          (i) => i.projectId === p.id && !i.done,
        ).length;
        const active = p.id === selectedId;
        return (
          <button
            key={p.id}
            onClick={() => onSelect(p.id)}
            className="sys-label flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-[10px] font-bold tracking-wider transition-all duration-300 cursor-pointer"
            style={{
              color: active ? "#05060f" : "#cbd5e1",
              backgroundColor: active ? "#4fc3f7" : "rgba(79,195,247,0.06)",
              boxShadow: active ? "0 0 12px rgba(79,195,247,0.45)" : undefined,
              border: active
                ? "1px solid #4fc3f7"
                : "1px solid rgba(79,195,247,0.1)",
            }}
          >
            <span className="max-w-[120px] truncate">{p.name}</span>
            <span className="opacity-70">({open})</span>
          </button>
        );
      })}
      <button
        onClick={onNew}
        aria-label="New project"
        className="ml-auto shrink-0 rounded-lg border p-2 transition-all duration-300 hover:bg-[rgba(79,195,247,0.15)] hover:sys-glow cursor-pointer"
        style={{ borderColor: "rgba(79, 195, 247, 0.5)", color: "#4fc3f7" }}
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
