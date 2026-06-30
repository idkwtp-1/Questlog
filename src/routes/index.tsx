import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useSystemStore } from "@/lib/system-store";
import { Sidebar } from "@/components/system/Sidebar";
import { MainPanel } from "@/components/system/MainPanel";
import { MobileProjectTabs } from "@/components/system/MobileProjectTabs";
import { NewProjectModal } from "@/components/system/NewProjectModal";
import { AddIssueModal } from "@/components/system/AddIssueModal";
import { DeleteProjectDialog } from "@/components/system/DeleteProjectDialog";

import { LeaveConfirmationModal } from "@/components/system/LeaveConfirmationModal";
import { NotepadHUD } from "@/components/system/NotepadHUD";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "QuestLog — Quest Tracker" },
      {
        name: "description",
        content:
          "A minimalist Solo Leveling-inspired personal project and issue tracker. All data lives in your browser.",
      },
      { property: "og:title", content: "QuestLog — Quest Tracker" },
      {
        property: "og:description",
        content:
          "A minimalist Solo Leveling-inspired personal project and issue tracker. All data lives in your browser.",
      },
    ],
  }),
  component: TheSystem,
});

function TheSystem() {
  const store = useSystemStore();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [addIssueOpen, setAddIssueOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [isWidget, setIsWidget] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("widget") === "true") {
      setIsWidget(true);
    }
  }, []);

  // Global Esc key to open exit application dialog (if no other modal is open)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const dialogs = document.querySelectorAll(
          '[role="dialog"]:not([data-state="closed"]), [role="alertdialog"]:not([data-state="closed"])',
        );
        if (dialogs.length > 0) {
          // A modal is already open; let it handle its own escape key.
          return;
        }
        e.preventDefault();
        setLeaveOpen(true);
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const project = store.projects.find((p) => p.id === selectedId) ?? null;
  const pendingDeleteProject =
    store.projects.find((p) => p.id === pendingDelete) ?? null;

  const handleSelectProject = (id: string) => {
    setSelectedId((prev) => (prev === id ? null : id));
  };

  if (!store.hydrated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#05060f]">
        <p className="sys-label text-sm font-semibold tracking-[0.2em] text-[#4fc3f7] animate-pulse">
          {isWidget ? "LOAD_NOTEPAD_WIDGET..." : "INITIALIZING SYSTEM..."}
        </p>
      </div>
    );
  }

  if (isWidget) {
    return (
      <div className="h-screen w-full bg-[#05060f] overflow-hidden select-none">
        <NotepadHUD
          projects={store.projects}
          selectedProjectId={selectedId}
          onSelectProject={handleSelectProject}
          onAddIssue={store.addIssue}
          onUpdateNotepad={store.updateProjectNotepad}
          isWidget={true}
          onCloseWidget={store.closeNotepadWidget}
        />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden md:flex-row bg-[#05060f] p-0 md:p-4 md:gap-4">
      <div className="hidden md:block md:h-full shrink-0">
        <Sidebar
          projects={store.projects}
          issues={store.issues}
          selectedId={selectedId}
          onSelect={handleSelectProject}
          onNew={() => setNewProjectOpen(true)}
          onDelete={(id) => setPendingDelete(id)}
        />
      </div>

      <div className="md:hidden">
        <MobileProjectTabs
          projects={store.projects}
          issues={store.issues}
          selectedId={selectedId}
          onSelect={handleSelectProject}
          onNew={() => setNewProjectOpen(true)}
        />
      </div>

      <MainPanel
        project={project}
        issues={store.issues}
        hasAnyProject={store.projects.length > 0}
        onCreateFirstProject={() => setNewProjectOpen(true)}
        onAddIssue={() => setAddIssueOpen(true)}
        onToggleIssue={store.toggleIssue}
        onDeleteIssue={store.deleteIssue}
        onUpdateIssue={store.updateIssue}
        onDeleteProject={(id) => setPendingDelete(id)}
      />

      <NewProjectModal
        open={newProjectOpen}
        onOpenChange={setNewProjectOpen}
        existingNames={store.projects.map((p) => p.name)}
        onConfirm={(name) => {
          const created = store.addProject(name);
          if (created) setSelectedId(created.id);
        }}
      />

      <AddIssueModal
        open={addIssueOpen && !!project}
        onOpenChange={setAddIssueOpen}
        onConfirm={(title, priority, description) => {
          if (project) store.addIssue(project.id, title, priority, description);
        }}
      />

      <DeleteProjectDialog
        open={!!pendingDeleteProject}
        onOpenChange={(o) => !o && setPendingDelete(null)}
        projectName={pendingDeleteProject?.name ?? ""}
        onConfirm={() => {
          if (pendingDelete) {
            store.deleteProject(pendingDelete);
            if (selectedId === pendingDelete) {
              setSelectedId(null);
            }
          }
          setPendingDelete(null);
        }}
      />

      <LeaveConfirmationModal
        open={leaveOpen}
        onOpenChange={setLeaveOpen}
        onConfirm={() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const api = (window as any).pywebview?.api;
          if (api && typeof api.close_app === "function") {
            api.close_app();
          } else {
            window.close();
          }
        }}
      />

      <NotepadHUD
        projects={store.projects}
        selectedProjectId={selectedId}
        onSelectProject={handleSelectProject}
        onAddIssue={store.addIssue}
        onUpdateNotepad={store.updateProjectNotepad}
        onSpawnWidget={store.spawnNotepadWidget}
      />
    </div>
  );
}
