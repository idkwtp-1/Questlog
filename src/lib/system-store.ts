import { useCallback, useEffect, useState } from "react";
import { supabase } from "./supabaseClient";

export type Priority = "low" | "medium" | "high" | "critical";

export interface Project {
  id: string;
  name: string;
  createdAt: number;
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

const EMPTY: SystemData = { projects: [], issues: [] };

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

export function useSystemStore() {
  const [data, setData] = useState<SystemData>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  // ------------------------------------------------------------------
  // Load and subscribe from/to Supabase
  // ------------------------------------------------------------------
  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const [projectsRes, issuesRes] = await Promise.all([
          supabase.from("projects").select("*"),
          supabase.from("issues").select("*"),
        ]);

        if (!active) return;

        if (projectsRes.error) throw projectsRes.error;
        if (issuesRes.error) throw issuesRes.error;

        setData({
          projects: projectsRes.data || [],
          issues: issuesRes.data || [],
        });
        setHydrated(true);
      } catch (err) {
        console.error("[QuestLog] Failed to load data from Supabase:", err);
      }
    }

    loadData();

    // Subscribe to Postgres changes on both tables
    const channel = supabase
      .channel("schema-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "projects" },
        () => {
          loadData();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "issues" },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // ------------------------------------------------------------------
  // Store operations
  // ------------------------------------------------------------------
  const addProject = useCallback((name: string): Project | null => {
    const trimmed = name.trim();
    if (!trimmed) return null;
    let created: Project | null = null;
    
    setData((d) => {
      const dup = d.projects.some(
        (p) => p.name.toLowerCase() === trimmed.toLowerCase(),
      );
      if (dup) return d;
      created = { id: uid(), name: trimmed, createdAt: Date.now() };
      return { ...d, projects: [...d.projects, created] };
    });

    if (created) {
      const newProj = created;
      supabase
        .from("projects")
        .insert({
          id: newProj.id,
          name: newProj.name,
          createdAt: newProj.createdAt,
        })
        .then(({ error }) => {
          if (error) console.error("[QuestLog] Failed to add project:", error);
        });
    }
    return created;
  }, []);

  const deleteProject = useCallback((id: string) => {
    setData((d) => ({
      projects: d.projects.filter((p) => p.id !== id),
      issues: d.issues.filter((i) => i.projectId !== id),
    }));

    supabase
      .from("projects")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("[QuestLog] Failed to delete project:", error);
      });
  }, []);

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

      setData((d) => ({
        ...d,
        issues: [...d.issues, newIssue],
      }));

      supabase
        .from("issues")
        .insert({
          id: newIssue.id,
          projectId: newIssue.projectId,
          title: newIssue.title,
          description: newIssue.description,
          priority: newIssue.priority,
          done: newIssue.done,
          createdAt: newIssue.createdAt,
        })
        .then(({ error }) => {
          if (error) console.error("[QuestLog] Failed to add issue:", error);
        });
    },
    [],
  );

  const toggleIssue = useCallback((id: string) => {
    let nextDone = false;
    setData((d) => {
      const updatedIssues = d.issues.map((i) => {
        if (i.id === id) {
          nextDone = !i.done;
          return { ...i, done: nextDone };
        }
        return i;
      });
      return { ...d, issues: updatedIssues };
    });

    supabase
      .from("issues")
      .update({ done: nextDone })
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("[QuestLog] Failed to toggle issue:", error);
      });
  }, []);

  const deleteIssue = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      issues: d.issues.filter((i) => i.id !== id),
    }));

    supabase
      .from("issues")
      .delete()
      .eq("id", id)
      .then(({ error }) => {
        if (error) console.error("[QuestLog] Failed to delete issue:", error);
      });
  }, []);

  const updateIssue = useCallback(
    (
      id: string,
      patch: {
        title?: string;
        description?: string;
        priority?: Priority;
      },
    ) => {
      setData((d) => ({
        ...d,
        issues: d.issues.map((i) => (i.id === id ? { ...i, ...patch } : i)),
      }));

      supabase
        .from("issues")
        .update(patch)
        .eq("id", id)
        .then(({ error }) => {
          if (error) console.error("[QuestLog] Failed to update issue:", error);
        });
    },
    [],
  );



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
