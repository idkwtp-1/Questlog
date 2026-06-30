import { Plus, Trash2 } from "lucide-react";
import type { Issue, Project } from "@/lib/system-store";

export function Sidebar({
  projects,
  issues,
  selectedId,
  onSelect,
  onNew,
  onDelete,
}: {
  projects: Project[];
  issues: Issue[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}) {
  const counts = (projectId: string) => {
    const list = issues.filter((i) => i.projectId === projectId);
    return { open: list.filter((i) => !i.done).length, total: list.length };
  };

  return (
    <aside className="sys-panel sys-hud-scan flex h-full w-[260px] shrink-0 flex-col rounded-xl border">
      <div className="px-5 pt-6 pb-4 text-center">
        <h1
          className="sys-label sys-text-glow text-xl font-bold tracking-[0.15em] transition-all duration-300 hover:scale-105"
          style={{
            color: "#4fc3f7",
          }}
        >
          [ QUESTLOG ]
        </h1>
        <p
          className="sys-label mt-1 text-[10px] tracking-[0.2em]"
          style={{ color: "#64748b" }}
        >
          Quest Tracker
        </p>
      </div>

      <div
        className="mx-5 h-px opacity-50"
        style={{ backgroundColor: "rgba(79,195,247,0.25)" }}
      />

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {projects.length === 0 ? (
          <p
            className="sys-label px-3 py-6 text-center text-[11px]"
            style={{ color: "#64748b" }}
          >
            No projects yet
          </p>
        ) : (
          <ul className="space-y-1.5">
            {projects.map((p) => {
              const c = counts(p.id);
              const active = p.id === selectedId;
              return (
                <li key={p.id} className="sys-fade-in">
                  <div
                    className="group relative flex items-center gap-2 rounded-lg py-2.5 pr-2 pl-3.5 transition-all duration-300 cursor-pointer overflow-hidden"
                    style={{
                      backgroundColor: active
                        ? "rgba(79, 195, 247, 0.08)"
                        : "rgba(13, 19, 44, 0.2)",
                      border: active
                        ? "1px solid rgba(79, 195, 247, 0.35)"
                        : "1px solid rgba(79, 195, 247, 0.05)",
                      boxShadow: active
                        ? "0 0 16px rgba(79, 195, 247, 0.12)"
                        : undefined,
                    }}
                  >
                    {/* Active neon highlight strip */}
                    {active && (
                      <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#4fc3f7] shadow-[0_0_8px_rgba(79,195,247,0.8)]" />
                    )}

                    <button
                      onClick={() => onSelect(p.id)}
                      className="flex flex-1 items-center gap-2 overflow-hidden text-left cursor-pointer"
                    >
                      <span
                        className="flex-1 truncate text-sm font-semibold tracking-wide transition-colors duration-200"
                        style={{ color: active ? "#e2e8f0" : "#94a3b8" }}
                      >
                        {p.name}
                      </span>
                      <span
                        className="sys-label shrink-0 text-[10px] font-bold tracking-wider"
                        style={{ color: active ? "#4fc3f7" : "#64748b" }}
                      >
                        {c.open}
                      </span>
                    </button>
                    <button
                      onClick={() => onDelete(p.id)}
                      aria-label="Delete project"
                      className="rounded p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-500/10 cursor-pointer"
                      style={{ color: "#64748b" }}
                    >
                      <Trash2 className="h-3.5 w-3.5 hover:text-red-400" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="p-4">
        <button
          onClick={onNew}
          className="sys-label flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-bold tracking-wider transition-all duration-300 hover:bg-[rgba(79,195,247,0.15)] hover:sys-glow cursor-pointer"
          style={{ borderColor: "rgba(79, 195, 247, 0.5)", color: "#4fc3f7" }}
        >
          <Plus className="h-4 w-4" />
          NEW PROJECT
        </button>
      </div>
    </aside>
  );
}
