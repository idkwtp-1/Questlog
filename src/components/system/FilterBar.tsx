import type { Priority } from "@/lib/system-store";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type StatusFilter = "open" | "done";
export type RankFilter = "all" | Priority;

const pills: { id: StatusFilter; label: string }[] = [
  { id: "open", label: "OPEN" },
  { id: "done", label: "DONE" },
];

export function FilterBar({
  status,
  rank,
  onStatus,
  onRank,
}: {
  status: StatusFilter;
  rank: RankFilter;
  onStatus: (s: StatusFilter) => void;
  onRank: (r: RankFilter) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="sys-panel flex rounded-[6px] p-1">
        {pills.map((p) => {
          const active = status === p.id;
          return (
            <button
              key={p.id}
              onClick={() => onStatus(p.id)}
              className="sys-label rounded-[4px] px-3 py-1 text-xs font-semibold transition-all"
              style={{
                color: active ? "#05060f" : "#94a3b8",
                backgroundColor: active ? "#4fc3f7" : "transparent",
                boxShadow: active ? "0 0 10px rgba(79,195,247,0.5)" : undefined,
              }}
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <Select value={rank} onValueChange={(v) => onRank(v as RankFilter)}>
        <SelectTrigger
          className="sys-panel sys-label w-[150px] rounded-[6px] border-0 text-xs font-semibold"
          style={{ color: "#e2e8f0" }}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent
          className="sys-panel sys-label"
          style={{ color: "#e2e8f0" }}
        >
          <SelectItem value="all">ALL RANKS</SelectItem>
          <SelectItem value="low">LOW</SelectItem>
          <SelectItem value="medium">MEDIUM</SelectItem>
          <SelectItem value="high">HIGH</SelectItem>
          <SelectItem value="critical">CRITICAL</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
