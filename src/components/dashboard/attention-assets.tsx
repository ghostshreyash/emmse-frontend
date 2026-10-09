import { Link } from "react-router"
import { FileWarning } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { SectionCard } from "@/components/common/section-card"
import { assetsRequiringAttention } from "@/data/dashboard"
import { healthStatus } from "@/lib/status"

const th = "h-7 px-2 text-[0.65rem] font-semibold"
const td = "px-2 py-1.5 text-xs"

/**
 * Recent Assets Requiring Attention. The mockup labels the first column "Asset
 * Tag ID"; the client confirmed the system-generated Digital Asset ID is the only
 * asset identifier, so that is what it shows.
 */
export function AttentionAssets() {
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
            <TableHead className={th}>Location</TableHead>
            <TableHead className={th}>Health Status</TableHead>
            <TableHead className={th}>Next Due Date</TableHead>
            <TableHead className={th}>Issue / Recommendation</TableHead>
            <TableHead className={`${th} text-center`}>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assetsRequiringAttention.map((a, i) => (
            <TableRow key={a.id}>
              <TableCell className={`${td} text-muted-foreground`}>{i + 1}</TableCell>
              <TableCell className={`${td} font-medium`}>{a.id}</TableCell>
              <TableCell className={`${td} max-w-36 whitespace-normal`}>{a.name}</TableCell>
              <TableCell className={td}>{a.category}</TableCell>
              <TableCell className={td}>{a.location}</TableCell>
              <TableCell className={td}>
                <Badge variant={healthStatus[a.health].badge} className="rounded px-1.5 py-0 text-[0.65rem]">
                  {healthStatus[a.health].label}
                </Badge>
              </TableCell>
              <TableCell className={`${td} tabular-nums`}>{a.nextDue}</TableCell>
              <TableCell className={`${td} max-w-40 whitespace-normal`}>{a.issue}</TableCell>
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
