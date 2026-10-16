import { Link } from "react-router"
import { ClipboardPlus, Wrench } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import type { AssetRecord } from "@/data/assets"

/**
 * What to do with the asset next.
 *
 * In EVITA this button starts an inspection on the engineer's tablet, there and
 * then. The enterprise portal does not run inspections itself - it books them for
 * an ELPREMAR - so the same panel offers to schedule an inspection or to log a
 * maintenance task against this asset instead.
 */
export function StartInspection({
  asset,
  /** Run before navigating, for a caller that has a dialog to shut */
  onLeave,
  className,
  size = "lg",
}: {
  asset: AssetRecord
  onLeave?: () => void
  className?: string
  size?: "lg" | "default"
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <Button
        size={size}
        className={cn("w-full font-semibold shadow-md shadow-primary/25", size === "lg" && "h-12 text-base")}
        asChild
      >
        <Link to="/inspection-activities/add" onClick={onLeave}>
          <ClipboardPlus /> Schedule Inspection
        </Link>
      </Button>
      <Button variant="outline" className="w-full" asChild>
        <Link to={`/tasks/add?asset=${encodeURIComponent(asset.tagId)}`} onClick={onLeave}>
          <Wrench /> Log Maintenance Task
        </Link>
      </Button>
    </div>
  )
}
