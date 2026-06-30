import { useRef, useState } from "react";

export function SystemIdleScreen() {
  const [hovered, setHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const portalRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = () => {
    setHovered(true);
    if (portalRef.current) {
      rectRef.current = portalRef.current.getBoundingClientRect();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = rectRef.current || portalRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setHovered(false);
    setMousePos({ x: 0, y: 0 });
    rectRef.current = null;
  };

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-transparent p-6 min-h-[400px]">
      {/* Dynamic Grid Background overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f111a_1px,transparent_1px),linear-gradient(to_bottom,#0f111a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-35" />

      {/* Glow Backplate */}
      <div
        className="absolute h-96 w-96 rounded-full opacity-30 blur-[80px] transition-all duration-700 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, #7c4dff 0%, #4c1d95 50%, transparent 100%)",
          transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px) scale(${hovered ? 1.25 : 1})`,
        }}
      />

      <div
        ref={portalRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="group relative flex h-72 w-72 cursor-crosshair items-center justify-center rounded-full transition-transform duration-500 hover:scale-105"
      >
        {/* Layer 1: Swirling Portal Ring Outermost */}
        <svg
          className="absolute inset-0 h-full w-full animate-spin text-[#7c4dff]/40"
          style={{ animationDuration: hovered ? "16s" : "28s" }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="46"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            strokeDasharray="4 8 12 8"
          />
        </svg>

        {/* Layer 2: Swirling Portal Ring Middle */}
        <svg
          className="absolute inset-4 h-[calc(100%-2rem)] w-[calc(100%-2rem)] text-[#4fc3f7]/50"
          style={{
            animationDuration: hovered ? "10s" : "18s",
            animationDirection: "reverse",
            animationName: "spin",
          }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.75"
            strokeDasharray="20 4 8 4"
          />
        </svg>

        {/* Layer 3: Innermost Swirling Core */}
        <svg
          className="absolute inset-8 h-[calc(100%-4rem)] w-[calc(100%-4rem)] text-[#7c4dff]/70"
          style={{
            animationDuration: hovered ? "5s" : "10s",
            animationName: "spin",
          }}
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeDasharray="40 10 5 10"
          />
        </svg>

        {/* Layer 4: SVG Portal Vortex Effect */}
        <div
          className="absolute inset-10 rounded-full border border-[#7c4dff]/30 opacity-70 transition-all duration-500 shadow-[inset_0_0_40px_rgba(124,77,255,0.4)] group-hover:shadow-[inset_0_0_60px_rgba(124,77,255,0.7)]"
          style={{
            background:
              "radial-gradient(circle, rgba(124,77,255,0.15) 0%, rgba(5,6,15,0.6) 80%)",
          }}
        />

        {/* Central HUD Info */}
        <div className="z-10 flex flex-col items-center justify-center font-mono text-center pointer-events-none">
          <div className="relative mb-2">
            <span className="block text-[11px] font-black text-[#e2e8f0] tracking-widest uppercase">
              GATE STATUS
            </span>
            <span className="block text-xs font-bold text-[#7c4dff] tracking-widest animate-pulse mt-0.5">
              UNEXPLORED
            </span>
          </div>

          <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#7c4dff]/60 to-transparent my-1" />

          <span className="block text-[8px] text-[rgba(226,232,240,0.5)] tracking-wider px-6 uppercase leading-relaxed">
            Select dungeon on sidebar to deploy key
          </span>
        </div>
      </div>
    </div>
  );
}
