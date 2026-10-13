import { Link } from "react-router"
import { FileWarning } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SectionCard } from "@/components/common/section-card"
import { maintenanceTypes, type AttentionAsset } from "@/data/dashboard"
import { healthStatus } from "@/lib/status"

const th = "h-7 px-2 text-[0.65rem] font-semibold"
const td = "px-2 py-1.5 text-xs"

const activityColor = Object.fromEntries(maintenanceTypes.map((t) => [t.label, t.color]))

/**
 * Recent Assets Requiring Attention. The mockup labels the first column "Asset
 * Tag ID"; the client confirmed the system-generated Digital Asset ID is the only
 * asset identifier, so that is what it shows. `showPlant` adds a Plant column for
 * the enterprise-wide view, where the rows come from several plants.
 */
export function AttentionAssets({ assets, showPlant = false }: { assets: AttentionAsset[]; showPlant?: boolean }) {
  return (
    <SectionCard
      title="Recent Assets Requiring Attention"
      icon={<FileWarning className="size-4 text-primary" />}
      viewAllTo="/assets"
      hoverable={false}
      contentClassName="px-1 overflow-x-auto"
    >
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/60 hover:bg-muted/60">
            <TableHead className={th}>#</TableHead>
            <TableHead className={th}>Digital Asset ID</TableHead>
            <TableHead className={th}>Asset Name</TableHead>
            <TableHead className={th}>Category</TableHead>
            {showPlant ? <TableHead className={th}>Plant</TableHead> : null}
            <TableHead className={th}>Location</TableHead>
            <TableHead className={th}>Health Status</TableHead>
            <TableHead className={th}>Scheduled On</TableHead>
            <TableHead className={th}>Activity Type</TableHead>
            <TableHead className={`${th} text-center`}>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assets.map((a, i) => (
            <TableRow key={a.id}>
              <TableCell className={`${td} text-muted-foreground`}>{i + 1}</TableCell>
              <TableCell className={`${td} font-medium`}>{a.id}</TableCell>
              <TableCell className={`${td} max-w-36 whitespace-normal`}>{a.name}</TableCell>
              <TableCell className={td}>{a.category}</TableCell>
              {showPlant ? <TableCell className={`${td} max-w-32 whitespace-normal`}>{a.plant}</TableCell> : null}
              <TableCell className={`${td} max-w-32 whitespace-normal`}>{a.location}</TableCell>
              <TableCell className={td}>
                <Badge variant={healthStatus[a.health].badge} className="rounded px-1.5 py-0 text-[0.65rem]">
                  {healthStatus[a.health].label}
                </Badge>
              </TableCell>
              <TableCell className={`${td} tabular-nums`}>{a.scheduledOn}</TableCell>
              <TableCell className={td}>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 shrink-0 rounded-full" style={{ background: activityColor[a.activityType] }} />
                  {a.activityType}
                </span>
              </TableCell>
              <TableCell className={`${td} text-center`}>
                <Button asChild variant="outline" size="xs">
                  <Link to={`/assets?asset=${encodeURIComponent(a.id)}`}>View</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </SectionCard>
  )
}
