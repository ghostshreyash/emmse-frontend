import { useId } from "react"
import { X } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { healthStatus, type HealthStatus } from "@/lib/status"

/* ---------- Health score gauge ---------- */

/** The mockup words the score band as Critical rather than the tile's "At Risk" */
const gaugeLabel: Record<HealthStatus, string> = { healthy: "Healthy", attention: "Alarming", critical: "Critical", offline: "Offline" }

/** Half-ring score out of 100, coloured by the asset's health — sized to lead the asset summary */
export function HealthGauge({ score, health }: { score: number; health: HealthStatus }) {
  const look = healthStatus[health]
  return (
    <div className="flex flex-col items-center">
      <svg viewBox="0 0 80 46" className="w-28" aria-label={`Health score ${score} out of 100`}>
        {/* Track in a pale tint of the same colour, as on the mockup */}
        <path d="M 7 40 A 33 33 0 0 1 73 40" fill="none" stroke={look.color} strokeOpacity={0.2} strokeWidth="8" strokeLinecap="round" pathLength={100} />
        <path
          d="M 7 40 A 33 33 0 0 1 73 40"
          fill="none"
          stroke={look.color}
          strokeWidth="8"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${score} 100`}
        />
        <text x="40" y="35" textAnchor="middle" className="fill-foreground text-[17px] font-bold">{score}</text>
        <text x="40" y="44" textAnchor="middle" className="fill-muted-foreground text-[6.5px]">/100</text>
      </svg>
      <span className={cn("rounded px-2 py-px text-xs font-semibold", look.tile)}>
        {gaugeLabel[health]}
      </span>
    </div>
  )
}

/* ---------- Asset illustration ---------- */

type Shape = "transformer" | "ups" | "panel"

/** Which drawing suits a category: transformers and UPSs have their own, everything else is a panel */
const shapeFor = (category: string): Shape =>
  /transformer/i.test(category) ? "transformer" : /ups/i.test(category) ? "ups" : "panel"

/**
 * A drawing of the loaded asset, by category, standing in for its photo until the
 * register carries real images.
 */
export function AssetIllustration({ category, className }: { category: string; className?: string }) {
  const id = useId()
  const shape = shapeFor(category)
  return (
    <svg viewBox="0 0 160 110" preserveAspectRatio="xMidYMid slice" role="img" aria-label={`${category} illustration`} className={cn("overflow-hidden rounded-md ring-1 ring-foreground/10", className)}>
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#bfdbfe" />
          <stop offset="1" stopColor="#f1f5f9" />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#475569" />
          <stop offset="0.5" stopColor="#94a3b8" />
          <stop offset="1" stopColor="#475569" />
        </linearGradient>
      </defs>
      <rect width="160" height="110" fill={`url(#${id}-sky)`} />
      <rect y="96" width="160" height="14" fill="#cbd5e1" />
      <rect x="22" y="90" width="116" height="7" fill="#94a3b8" />

      {shape === "transformer" ? (
        <g>
          {/* Cooling fins either side of the tank */}
          {[26, 31, 36, 116, 121, 126].map((x) => <rect key={x} x={x} y="46" width="3.5" height="42" fill="#475569" />)}
          <rect x="40" y="40" width="80" height="50" rx="3" fill={`url(#${id}-metal)`} />
          <rect x="37" y="35" width="86" height="6" rx="1" fill="#334155" />
          {/* Conservator tank */}
          <rect x="98" y="20" width="30" height="10" rx="5" fill="#64748b" />
          <rect x="108" y="29" width="3" height="7" fill="#475569" />
          {/* HV bushings */}
          {[58, 78].map((x) => (
            <g key={x}>
              <rect x={x - 1} y="10" width="2" height="26" fill="#334155" />
              {[0, 1, 2, 3, 4].map((i) => <ellipse key={i} cx={x} cy={14 + i * 4.5} rx="5" ry="2" fill="#92400e" />)}
            </g>
          ))}
          {/* Rating plate */}
          <rect x="68" y="58" width="24" height="14" rx="1" fill="#e2e8f0" />
          <rect x="71" y="62" width="18" height="1.5" fill="#94a3b8" />
          <rect x="71" y="66" width="12" height="1.5" fill="#94a3b8" />
        </g>
      ) : shape === "ups" ? (
        <g>
          <rect x="56" y="16" width="48" height="74" rx="4" fill="#334155" />
          <rect x="63" y="25" width="34" height="15" rx="1.5" fill="#38bdf8" />
          <rect x="66" y="29" width="18" height="2" fill="#e0f2fe" />
          <rect x="66" y="34" width="12" height="2" fill="#e0f2fe" />
          {[0, 1, 2].map((i) => <circle key={i} cx={68 + i * 8} cy="48" r="2.2" fill={["#22c55e", "#f59e0b", "#e2e8f0"][i]} />)}
          {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x="64" y={58 + i * 4.5} width="32" height="2" rx="1" fill="#1e293b" />)}
        </g>
      ) : (
        <g>
          <rect x="30" y="16" width="100" height="74" rx="2" fill="#cbd5e1" stroke="#94a3b8" />
          <line x1="80" y1="18" x2="80" y2="88" stroke="#94a3b8" />
          {[34, 84].map((x) => (
            <g key={x}>
              {/* Meter, indicator lamps, handle and louvres on each door */}
              <circle cx={x + 12} cy="30" r="6" fill="#f8fafc" stroke="#64748b" />
              <line x1={x + 12} y1="30" x2={x + 15} y2="27" stroke="#dc2626" strokeWidth="1" />
              {["#dc2626", "#16a34a", "#f59e0b"].map((c, i) => <circle key={c} cx={x + 26 + i * 6} cy="30" r="2" fill={c} />)}
              <rect x={x + 38} y="46" width="2.5" height="12" rx="1" fill="#475569" />
              {[0, 1, 2, 3].map((i) => <rect key={i} x={x + 8} y={66 + i * 4.5} width="26" height="1.8" fill="#94a3b8" />)}
            </g>
          ))}
        </g>
      )}
    </svg>
  )
}

/** Small clear button used inside inputs */
export function ClearButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon-xs" aria-label={label} onClick={onClick} className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground">
      <X />
    </Button>
  )
}
