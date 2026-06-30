import type { Priority } from "@/lib/system-store";

const STYLES: Record<
  Priority,
  { label: string; color: string; glow?: string }
> = {
  low: { label: "LOW", color: "#4fc3f7" },
  medium: { label: "MEDIUM", color: "#facc15" },
  high: { label: "HIGH", color: "#f97316" },
  critical: {
    label: "CRITICAL",
    color: "#e040fb",
    glow: "0 0 8px rgba(224,64,251,0.4)",
  },
};

export function PriorityBadge({ priority }: { priority: Priority }) {
  const s = STYLES[priority];
  return (
    <span
      className="sys-label inline-flex w-[72px] shrink-0 items-center justify-center rounded-[4px] border py-0.5 text-[10px] font-bold tracking-[0.12em]"
      style={{
        color: s.color,
        borderColor: `${s.color}60`,
        backgroundColor: `${s.color}12`,
        boxShadow: s.glow,
      }}
    >
      {s.label}
    </span>
  );
}
