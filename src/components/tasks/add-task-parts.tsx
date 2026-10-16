import { useState } from "react"
import { ChevronsUpDown, ClipboardCheck, X } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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

/** Small clear button used inside inputs */
export function ClearButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button type="button" variant="ghost" size="icon-xs" aria-label={label} onClick={onClick} className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground">
      <X />
    </Button>
  )
}

/* ---------- Inspected-asset picker ---------- */

/** An asset as its latest completed inspection left it — what the Asset Details picker offers */
export type InspectedAsset = {
  tagId: string
  asset: string
  plant: string
  department: string
  category: string
  inspectionId: string
  /** dd-MM-yyyy */
  inspectedOn: string
  activity: string
  health?: Exclude<HealthStatus, "offline">
}

/**
 * Searchable dropdown of recently inspected assets. Each option carries its tag ID and
 * the inspection it came from, and search matches either, the asset name or the plant.
 */
export function InspectedAssetPicker({
  options,
  value,
  onChange,
}: {
  options: InspectedAsset[]
  /** Inspection ID of the chosen option */
  value: string
  onChange: (picked: InspectedAsset | undefined) => void
}) {
  const [open, setOpen] = useState(false)
  const picked = options.find((o) => o.inspectionId === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="h-8 w-full justify-between bg-card px-2.5 text-xs font-normal"
        >
          {picked ? (
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="font-semibold tabular-nums">{picked.tagId}</span>
              <span className="truncate text-muted-foreground">· {picked.asset}</span>
              <span className="shrink-0 rounded bg-primary/10 px-1 py-px text-[0.6rem] font-semibold text-primary tabular-nums">{picked.inspectionId}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">Search by tag ID, asset or inspection ID</span>
          )}
          <ChevronsUpDown className="size-3.5 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-80 p-0">
        <Command>
          <CommandInput placeholder="Type a tag ID, asset, plant or INS-…" className="text-xs" />
          <CommandList>
            <CommandEmpty className="py-4 text-xs text-muted-foreground">No inspected asset matches.</CommandEmpty>
            {picked ? (
              <CommandGroup>
                <CommandItem value="__clear" onSelect={() => { onChange(undefined); setOpen(false) }} className="text-xs text-muted-foreground">
                  <X className="size-3.5" /> Clear the linked asset
                </CommandItem>
              </CommandGroup>
            ) : null}
            <CommandGroup heading="Latest inspected assets">
              {options.map((o) => (
                <CommandItem
                  key={o.inspectionId}
                  value={`${o.tagId} ${o.asset} ${o.inspectionId} ${o.plant}`}
                  data-checked={o.inspectionId === value}
                  onSelect={() => { onChange(o); setOpen(false) }}
                  className="items-start text-xs"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold tabular-nums">{o.tagId}</span>
                    <span className="block truncate text-[0.7rem] text-muted-foreground">{o.asset} · {o.plant}</span>
                  </span>
                  <span className="shrink-0 text-right">
                    <span className="flex items-center justify-end gap-1 text-[0.7rem] font-semibold text-primary tabular-nums">
                      <ClipboardCheck className="size-3" /> {o.inspectionId}
                    </span>
                    <span className="block text-[0.65rem] text-muted-foreground tabular-nums">{o.inspectedOn}</span>
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
