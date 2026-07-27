import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export type Priority = "low" | "medium" | "high" | "critical";

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  notepad?: string;
}

export interface Issue {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: Priority;
  done: boolean;
  createdAt: number;
}

interface SystemData {
  projects: Project[];
  issues: Issue[];
}

const STORAGE_DATA_KEY = "questlog_data_v1";
const STORAGE_QUEUE_KEY = "questlog_sync_queue_v1";
const EMPTY: SystemData = { projects: [], issues: [] };

export type SyncAction =
  | { type: "insert_project"; payload: Project }
  | { type: "delete_project"; id: string }
  | { type: "insert_issue"; payload: Issue }
  | { type: "update_issue"; id: string; patch: Partial<Issue> }
  | { type: "delete_issue"; id: string }
  | { type: "update_notepad"; projectId: string; notepad: string };

function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// ------------------------------------------------------------------
// LocalStorage Utilities
// ------------------------------------------------------------------
function getStoredData(): SystemData {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = localStorage.getItem(STORAGE_DATA_KEY);
    if (!raw) return EMPTY;
    return JSON.parse(raw) as SystemData;
  } catch (err) {
    console.error("[QuestLog Storage] Failed to read local data:", err);
    return EMPTY;
  }
}

function saveStoredData(data: SystemData) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_DATA_KEY, JSON.stringify(data));
  } catch (err) {
    console.error("[QuestLog Storage] Failed to write local data:", err);
  }
}

function getSyncQueue(): SyncAction[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SyncAction[];
  } catch (err) {
    console.error("[QuestLog Storage] Failed to read sync queue:", err);
    return [];
  }
}

function saveSyncQueue(queue: SyncAction[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
  } catch (err) {
    console.error("[QuestLog Storage] Failed to write sync queue:", err);
  }
}

function enqueueAction(action: SyncAction) {
  const queue = getSyncQueue();
  queue.push(action);
  saveSyncQueue(queue);
}

// ------------------------------------------------------------------
// Supabase Sync Processor
// ------------------------------------------------------------------
async function processSyncAction(action: SyncAction): Promise<boolean> {
  try {
    switch (action.type) {
      case "insert_project": {
        const { error } = await supabase.from("projects").insert({
          id: action.payload.id,
          name: action.payload.name,
          createdAt: action.payload.createdAt,
        });
        if (error) throw error;
        break;
      }
      case "delete_project": {
        const { error } = await supabase.from("projects").delete().eq("id", action.id);
        if (error) throw error;
        break;
      }
      case "insert_issue": {
        const { error } = await supabase.from("issues").insert({
          id: action.payload.id,
          projectId: action.payload.projectId,
          title: action.payload.title,
          description: action.payload.description,
          priority: action.payload.priority,
          done: action.payload.done,
          createdAt: action.payload.createdAt,
        });
        if (error) throw error;
        break;
      }
      case "update_issue": {
        const { error } = await supabase.from("issues").update(action.patch).eq("id", action.id);
        if (error) throw error;
        break;
      }
      case "delete_issue": {
        const { error } = await supabase.from("issues").delete().eq("id", action.id);
        if (error) throw error;
        break;
      }
      case "update_notepad": {
        const { error } = await supabase
          .from("projects")
          .update({ notepad: action.notepad })
          .eq("id", action.projectId);
        if (error) throw error;
        break;
      }
    }
    return true;
  } catch (err) {
    console.error("[QuestLog Sync] Action failed:", action, err);
    return false;
  }
}

let isSyncing = false;
async function flushSyncQueue(): Promise<boolean> {
  if (isSyncing || typeof window === "undefined" || !navigator.onLine) return false;
  isSyncing = true;
  try {
    const queue = getSyncQueue();
    if (queue.length === 0) {
      isSyncing = false;
      return true;
    }

    const remaining: SyncAction[] = [];
    let allSucceeded = true;

    for (let i = 0; i < queue.length; i++) {
      const action = queue[i];
      const success = await processSyncAction(action);
      if (!success) {
        allSucceeded = false;
        remaining.push(...queue.slice(i));
        break;
      }
    }

    saveSyncQueue(remaining);
    return allSucceeded;
  } finally {
    isSyncing = false;
  }
}

// ------------------------------------------------------------------
// System Store Hook
// ------------------------------------------------------------------
export function useSystemStore() {
  const [data, setData] = useState<SystemData>(getStoredData);
  const [hydrated, setHydrated] = useState(true);

  // Sync helper that updates state, localStorage, and triggers queue execution
  const dispatchMutation = useCallback(
    (updater: (prev: SystemData) => { nextData: SystemData; action: SyncAction | null }) => {
      let createdAction: SyncAction | null = null;
      setData((prev) => {
        const { nextData, action } = updater(prev);
        createdAction = action;
        saveStoredData(nextData);
        return nextData;
      });

      if (createdAction) {
        enqueueAction(createdAction);
        if (typeof navigator !== "undefined" && navigator.onLine) {
          flushSyncQueue().then((success) => {
            if (success && getSyncQueue().length === 0) {
              loadDataFromSupabase();
            }
          });
        }
      }
    },
    [],
  );

  const loadDataFromSupabase = useCallback(async () => {
    // Skip pulling from remote if there are pending offline mutations to preserve local edits
    if (getSyncQueue().length > 0 || (typeof navigator !== "undefined" && !navigator.onLine)) {
      return;
    }

    try {
      const [projectsRes, issuesRes] = await Promise.all([
        supabase.from("projects").select("*"),
        supabase.from("issues").select("*"),
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (issuesRes.error) throw issuesRes.error;

      const remoteData: SystemData = {
        projects: projectsRes.data || [],
        issues: issuesRes.data || [],
      };

      setData(remoteData);
      saveStoredData(remoteData);
      setHydrated(true);
    } catch (err) {
      console.error("[QuestLog] Failed to load remote data:", err);
    }
  }, []);

  // Sync & Realtime Subscription lifecycle
  useEffect(() => {
    // 1. Flush any pending queue & pull fresh data if online
    if (typeof navigator !== "undefined" && navigator.onLine) {
      flushSyncQueue().then(() => {
        loadDataFromSupabase();
      });
    }

    // 2. Browser online event handler
    const handleOnline = () => {
      console.log("[QuestLog] Internet connection restored. Processing offline sync queue...");
      flushSyncQueue().then((success) => {
        if (success) {
          loadDataFromSupabase();
        }
      });
    };

    window.addEventListener("online", handleOnline);

    // 3. Realtime Postgres change subscriptions
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          if (getSyncQueue().length === 0) {
            loadDataFromSupabase();
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issues" },
        () => {
          if (getSyncQueue().length === 0) {
            loadDataFromSupabase();
          }
        },
      )
      .subscribe();

    return () => {
      window.removeEventListener("online", handleOnline);
      supabase.removeChannel(channel);
    };
  }, [loadDataFromSupabase]);

  // ------------------------------------------------------------------
  // Store Operations
  // ------------------------------------------------------------------
  const addProject = useCallback(
    (name: string): Project | null => {
      const trimmed = name.trim();
      if (!trimmed) return null;
      let created: Project | null = null;

      dispatchMutation((prev) => {
        const dup = prev.projects.some(
          (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
        );
        if (dup) return { nextData: prev, action: null };

        created = { id: uid(), name: trimmed, createdAt: Date.now() };
        const nextData = { ...prev, projects: [...prev.projects, created] };
        return {
          nextData,
          action: { type: "insert_project", payload: created },
        };
      });

      return created;
    },
    [dispatchMutation],
  );

  const deleteProject = useCallback(
    (id: string) => {
      dispatchMutation((prev) => ({
        nextData: {
          projects: prev.projects.filter((p) => p.id !== id),
          issues: prev.issues.filter((i) => i.projectId !== id),
        },
        action: { type: "delete_project", id },
      }));
    },
    [dispatchMutation],
  );

  const addIssue = useCallback(
    (
      projectId: string,
      title: string,
      priority: Priority,
      description: string,
    ) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const newIssue: Issue = {
        id: uid(),
        projectId,
        title: trimmed,
        description: description.trim(),
        priority,
        done: false,
        createdAt: Date.now(),
      };

      dispatchMutation((prev) => ({
        nextData: {
          ...prev,
          issues: [...prev.issues, newIssue],
        },
        action: { type: "insert_issue", payload: newIssue },
      }));
    },
    [dispatchMutation],
  );

  const toggleIssue = useCallback(
    (id: string) => {
      let nextDone = false;
      dispatchMutation((prev) => {
        const updatedIssues = prev.issues.map((i) => {
          if (i.id === id) {
            nextDone = !i.done;
            return { ...i, done: nextDone };
          }
          return i;
        });
        return {
          nextData: { ...prev, issues: updatedIssues },
          action: { type: "update_issue", id, patch: { done: nextDone } },
        };
      });
    },
    [dispatchMutation],
  );

  const deleteIssue = useCallback(
    (id: string) => {
      dispatchMutation((prev) => ({
        nextData: {
          ...prev,
          issues: prev.issues.filter((i) => i.id !== id),
        },
        action: { type: "delete_issue", id },
      }));
    },
    [dispatchMutation],
  );

  const updateIssue = useCallback(
    (
      id: string,
      patch: {
        title?: string;
        description?: string;
        priority?: Priority;
      },
    ) => {
      dispatchMutation((prev) => ({
        nextData: {
          ...prev,
          issues: prev.issues.map((i) => (i.id === id ? { ...i, ...patch } : i)),
        },
        action: { type: "update_issue", id, patch },
      }));
    },
    [dispatchMutation],
  );

  const updateProjectNotepad = useCallback(
    (projectId: string, text: string) => {
      dispatchMutation((prev) => ({
        nextData: {
          ...prev,
          projects: prev.projects.map((p) =>
            p.id === projectId ? { ...p, notepad: text } : p,
          ),
        },
        action: { type: "update_notepad", projectId, notepad: text },
      }));
    },
    [dispatchMutation],
  );

  const spawnNotepadWidget = useCallback(() => {
    // pywebview API helper
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = (window as any).pywebview?.api;
    if (api && typeof api.spawn_notepad_widget === "function") {
      api.spawn_notepad_widget();
    }
  }, []);

  const closeNotepadWidget = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const api = (window as any).pywebview?.api;
    if (api && typeof api.close_notepad_widget === "function") {
      api.close_notepad_widget();
    }
  }, []);

  return {
    hydrated,
    projects: data.projects,
    issues: data.issues,
    addProject,
    deleteProject,
    addIssue,
    toggleIssue,
    deleteIssue,
    updateIssue,
    updateProjectNotepad,
    spawnNotepadWidget,
    closeNotepadWidget,
  };
}

export function sortIssues(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const w = PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
    if (w !== 0) return w;
    return a.createdAt - b.createdAt;
  });
}

export function sortProjects(projects: Project[], issues: Issue[]): Project[] {
  return [...projects].sort((a, b) => {
    const aScore = issues
      .filter((i) => i.projectId === a.id && !i.done)
      .reduce((sum, i) => sum + PRIORITY_WEIGHT[i.priority], 0);

    const bScore = issues
      .filter((i) => i.projectId === b.id && !i.done)
      .reduce((sum, i) => sum + PRIORITY_WEIGHT[i.priority], 0);

    if (bScore !== aScore) {
      return bScore - aScore;
    }

    return b.createdAt - a.createdAt;
  });
}
