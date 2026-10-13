import { Factory, Layers } from "lucide-react"

import { Select, SelectContent, SelectItem, SelectSeparator, SelectTrigger, SelectValue } from "@/components/ui/select"
import { plants, type DashboardScope } from "@/data/dashboard"

const item = "py-2 pr-8 pl-2"
const iconTile = "flex size-7 shrink-0 items-center justify-center rounded-md"

/** Scopes the whole dashboard to one plant, or to every plant in the enterprise ("All") */
export function PlantSelect({ value, onChange }: { value: DashboardScope; onChange: (value: DashboardScope) => void }) {
  const label = value === "all" ? "All Plants" : plants.find((p) => p.id === value)?.name

  return (
    <Select value={value} onValueChange={(v) => onChange(v as DashboardScope)}>
      <SelectTrigger
        aria-label="Plant"
        className="min-w-56 gap-2.5 rounded-lg border-primary/25 bg-card py-1.5 pr-2.5 pl-1.5 shadow-sm transition-[border-color,box-shadow] hover:border-primary/50 data-[size=default]:h-auto data-[state=open]:border-primary data-[state=open]:ring-3 data-[state=open]:ring-primary/15"
      >
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-brand-navy text-white">
          <Factory className="size-4" />
        </span>
        <span className="flex min-w-0 flex-1 flex-col items-start leading-tight">
          <span className="text-[0.6rem] font-semibold tracking-wider text-muted-foreground uppercase">Plant</span>
          {/* Children override the item text, so the trigger shows just the name */}
          <SelectValue>
            <span className="truncate text-sm font-semibold text-brand-navy dark:text-foreground">{label}</span>
          </SelectValue>
        </span>
      </SelectTrigger>
      <SelectContent position="popper" align="end" className="min-w-64 p-1">
        <SelectItem value="all" className={item}>
          <span className={`${iconTile} bg-highlight/12 text-highlight`}>
            <Layers className="size-3.5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-semibold">All Plants</span>
            <span className="text-[0.65rem] text-muted-foreground">Enterprise-wide · {plants.length} plants</span>
          </span>
        </SelectItem>
        <SelectSeparator />
        {plants.map((p) => (
          <SelectItem key={p.id} value={p.id} className={item}>
            <span className={`${iconTile} bg-primary/10 text-[0.6rem] font-bold text-primary`}>{p.id}</span>
            <span className="flex flex-col leading-tight">
              <span className="text-xs font-semibold">{p.name}</span>
              <span className="text-[0.65rem] text-muted-foreground">{p.location}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
