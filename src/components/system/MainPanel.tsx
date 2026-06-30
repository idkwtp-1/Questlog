import { useMemo, useState } from "react";
import { Plus, Scroll, ShieldOff, Trash2 } from "lucide-react";
import type { Issue, Project } from "@/lib/system-store";
import { sortIssues } from "@/lib/system-store";
import { IssueCard } from "./IssueCard";
import { EmptyState } from "./EmptyState";
import { FilterBar, type RankFilter, type StatusFilter } from "./FilterBar";
import { QuestDetailModal } from "./QuestDetailModal";
import { SystemIdleScreen } from "./SystemIdleScreen";

export function MainPanel({
  project,
  issues,
  onAddIssue,
  onToggleIssue,
  onDeleteIssue,
  onUpdateIssue,
  hasAnyProject,
  onCreateFirstProject,
  onDeleteProject,
}: {
  project: Project | null;
  issues: Issue[];
  onAddIssue: () => void;
  onToggleIssue: (id: string) => void;
  onDeleteIssue: (id: string) => void;
  onUpdateIssue: (
    id: string,
    patch: {
      title?: string;
      description?: string;
      priority?: import("@/lib/system-store").Priority;
    },
  ) => void;
  hasAnyProject: boolean;
  onCreateFirstProject: () => void;
  onDeleteProject?: (id: string) => void;
}) {
  const [status, setStatus] = useState<StatusFilter>("open");
  const [rank, setRank] = useState<RankFilter>("all");
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  const filtered = useMemo(() => {
    const projectIssues = project
      ? issues.filter((i) => i.projectId === project.id)
      : [];
    const f = projectIssues.filter((i) => {
      if (status === "open" && i.done) return false;
      if (status === "done" && !i.done) return false;
      if (rank !== "all" && i.priority !== rank) return false;
      return true;
    });
    return sortIssues(f);
  }, [project, issues, status, rank]);

  if (!hasAnyProject) {
    return (
      <main className="sys-panel sys-hud-scan flex flex-1 flex-col rounded-xl border justify-center items-center p-6 min-h-[400px]">
        <EmptyState
          icon={ShieldOff}
          text="No dungeons detected."
          subtext="Create a project to begin your journey."
        />
      </main>
    );
  }

  if (!project) {
    return (
      <main className="sys-panel sys-hud-scan flex flex-1 flex-col rounded-xl border overflow-hidden">
        <SystemIdleScreen />
      </main>
    );
  }

  const openCount = issues.filter(
    (i) => i.projectId === project.id && !i.done,
  ).length;

  return (
    <main className="sys-panel sys-hud-scan flex h-full min-h-0 flex-1 flex-col rounded-xl border overflow-hidden">
      <header className="flex flex-wrap items-center justify-between gap-3 px-6 py-5 border-b border-border">
        <div>
          <div className="flex items-center gap-2">
            <h2
              className="text-2xl font-bold tracking-wide"
              style={{ color: "#e2e8f0" }}
            >
              {project.name}
            </h2>
            <button
              onClick={() => onDeleteProject && onDeleteProject(project.id)}
              aria-label="Delete project"
              className="rounded p-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          <p
            className="sys-label mt-1 text-[10px] font-bold tracking-wider"
            style={{ color: "#4fc3f7" }}
          >
            {openCount} QUEST{openCount === 1 ? "" : "S"} ACTIVE
          </p>
        </div>
        <button
          onClick={onAddIssue}
          className="sys-label flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-bold tracking-wider transition-all duration-300 hover:bg-[#4fc3f7]/80 hover:sys-glow cursor-pointer"
          style={{
            backgroundColor: "#4fc3f7",
            color: "#05060f",
          }}
        >
          <Plus className="h-4 w-4" />
          ADD ISSUE
        </button>
      </header>

      <div className="px-6 py-4">
        <FilterBar
          status={status}
          rank={rank}
          onStatus={setStatus}
          onRank={setRank}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Scroll}
            text="Quest board is empty."
            subtext="Add your first issue to get started."
          />
        ) : (
          <ul key={project.id} className="space-y-2.5">
            {filtered.map((issue, idx) => {
              const delay = `${idx * 150}ms`;
              return (
                <li
                  key={issue.id}
                  className="sys-fade-in"
                  style={{
                    animationDelay: delay,
                    animationDuration: "400ms",
                  }}
                >
                  <IssueCard
                    issue={issue}
                    onToggle={() => onToggleIssue(issue.id)}
                    onDelete={() => onDeleteIssue(issue.id)}
                    onOpen={() => setSelectedIssue(issue)}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <QuestDetailModal
        issue={selectedIssue}
        open={!!selectedIssue}
        onOpenChange={(o) => !o && setSelectedIssue(null)}
        onToggle={() => selectedIssue && onToggleIssue(selectedIssue.id)}
        onUpdate={(patch) =>
          selectedIssue && onUpdateIssue(selectedIssue.id, patch)
        }
      />
    </main>
  );
}
