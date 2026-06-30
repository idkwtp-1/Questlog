import React, { useState } from "react";
import { StickyNote, X, GripHorizontal, Plus } from "lucide-react";
import type { Project, Priority } from "@/lib/system-store";

interface NotepadHUDProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onAddIssue: (
    projectId: string,
    title: string,
    priority: Priority,
    description: string,
  ) => void;
  onUpdateNotepad: (projectId: string, text: string) => void;
  isWidget?: boolean;
  onCloseWidget?: () => void;
  onSpawnWidget?: () => void;
}

export function NotepadHUD({
  projects,
  selectedProjectId,
  onSelectProject,
  onAddIssue,
  onUpdateNotepad,
  isWidget = false,
  onCloseWidget,
  onSpawnWidget,
}: NotepadHUDProps) {
  const [newQuestTitle, setNewQuestTitle] = useState("");
  const [newQuestPriority, setNewQuestPriority] = useState<Priority>("medium");

  // Determine active project. Default to the first project if none is selected.
  const activeProject =
    projects.find((p) => p.id === selectedProjectId) ?? projects[0] ?? null;

  const handleQuickAddQuest = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedTitle = newQuestTitle.trim();
    if (!trimmedTitle || !activeProject) return;
    
    // Add the quest with the priority selector and current notepad description
    onAddIssue(
      activeProject.id,
      trimmedTitle,
      newQuestPriority,
      activeProject.notepad ?? "",
    );
    setNewQuestTitle("");
    onUpdateNotepad(activeProject.id, "");
  };

  // --- WIDGET MODE VIEW ---
  if (isWidget) {
    if (projects.length === 0) {
      return (
        <div className="flex h-screen w-full items-center justify-center bg-[#05060f] p-4 text-center">
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">
            No projects available
          </p>
        </div>
      );
    }

    if (!activeProject) return null;

    return (
      <div
        className="flex flex-col w-full h-full border overflow-hidden select-none"
        style={{
          backgroundColor: "rgba(6, 9, 22, 0.95)",
          borderColor: "rgba(79, 195, 247, 0.25)",
        }}
      >
        {/* Header (Gray Top) - pywebview-drag-region allows moving the OS window natively */}
        <div
          className="pywebview-drag-region flex h-10 items-center justify-between px-3 select-none touch-none border-b cursor-grab active:cursor-grabbing shrink-0"
          style={{
            backgroundColor: "#1e293b",
            borderColor: "rgba(79, 195, 247, 0.15)",
          }}
        >
          <div className="flex items-center gap-1.5 overflow-hidden flex-1 mr-2">
            <GripHorizontal className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <div className="flex items-center gap-1 overflow-hidden w-full">
              <span className="shrink-0 text-[9px] font-bold tracking-[0.1em] text-slate-400">
                SYSTEM MEMORIES:
              </span>
              <select
                value={activeProject.id}
                onChange={(e) => onSelectProject(e.target.value)}
                className="bg-slate-800 text-slate-200 border border-slate-700 text-[10px] font-bold tracking-wide rounded px-1.5 py-0.5 outline-none cursor-pointer focus:border-[#4fc3f7] uppercase truncate max-w-[140px]"
                onPointerDown={(e) => e.stopPropagation()} // Let input work within drag region
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onCloseWidget?.()}
            className="flex h-6 w-6 cursor-pointer items-center justify-center rounded hover:bg-slate-700/60 transition-colors shrink-0"
            style={{ color: "#94a3b8" }}
            title="Close Notepad"
          >
            <X className="h-3.5 w-3.5 hover:text-red-400" />
          </button>
        </div>

        {/* Text Area Body */}
        <div className="flex-1 p-3 flex flex-col min-h-0">
          <textarea
            value={activeProject.notepad ?? ""}
            onChange={(e) =>
              onUpdateNotepad(activeProject.id, e.target.value)
            }
            placeholder="Enter quest details / description here..."
            className="w-full flex-1 resize-none bg-transparent text-sm leading-relaxed text-slate-200 placeholder-slate-500 focus:outline-none cursor-text select-text"
          />
        </div>

        {/* Bottom Quick Quest Form */}
        <form
          onSubmit={handleQuickAddQuest}
          className="border-t border-slate-800/80 p-2 bg-slate-900/60 flex items-center gap-1.5 shrink-0"
        >
          <input
            type="text"
            value={newQuestTitle}
            onChange={(e) => setNewQuestTitle(e.target.value)}
            placeholder="+ Quick Quest"
            className="flex-1 bg-slate-950/60 border border-slate-800 focus:border-[#4fc3f7]/50 rounded px-2 py-1 text-xs text-slate-200 placeholder-slate-500 outline-none transition-colors min-w-0"
          />
          <select
            value={newQuestPriority}
            onChange={(e) => setNewQuestPriority(e.target.value as Priority)}
            className="bg-slate-950/60 border border-slate-800 text-slate-200 text-xs rounded px-1.5 py-1 outline-none cursor-pointer focus:border-[#4fc3f7] uppercase shrink-0"
          >
            <option value="low">Low</option>
            <option value="medium">Med</option>
            <option value="high">High</option>
            <option value="critical">Crit</option>
          </select>
          <button
            type="submit"
            className="h-7 px-2 rounded bg-slate-800 text-[#4fc3f7] hover:bg-[#4fc3f7]/15 border border-[#4fc3f7]/20 text-[10px] font-bold tracking-wider cursor-pointer transition-all duration-200 flex items-center justify-center gap-1 shrink-0"
          >
            <Plus className="h-3 w-3" />
            ADD
          </button>
        </form>
      </div>
    );
  }

  // --- DASHBOARD MODE VIEW (Launcher button only) ---
  return (
    <button
      onClick={() => onSpawnWidget?.()}
      className="fixed bottom-6 right-6 z-40 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border transition-all duration-300 shadow-[0_0_15px_rgba(79,195,247,0.15)] hover:shadow-[0_0_20px_rgba(79,195,247,0.4)] focus:outline-none"
      style={{
        backgroundColor: "rgba(8, 12, 28, 0.85)",
        borderColor: "rgba(79, 195, 247, 0.4)",
        color: "#94a3b8",
      }}
      title="Launch Standalone Notepad"
    >
      <StickyNote className="h-5 w-5" />
    </button>
  );
}
