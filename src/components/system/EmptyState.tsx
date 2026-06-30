import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  text,
  subtext,
}: {
  icon: LucideIcon;
  text: string;
  subtext: string;
}) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
      <Icon
        className="mb-4 h-12 w-12"
        style={{ color: "#64748b" }}
        strokeWidth={1.25}
      />
      <p
        className="sys-label text-sm font-semibold"
        style={{ color: "#94a3b8" }}
      >
        {text}
      </p>
      <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
        {subtext}
      </p>
    </div>
  );
}
