import { useMemo } from "react"
import { Link, Navigate, useNavigate, useParams } from "react-router"
import { ArrowRight, ClipboardCheck, HardDrive, HeartPulse, MapPin, Server, ShieldAlert, TriangleAlert, Wrench } from "lucide-react"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/common/stat-card"
import { PlantInfo } from "@/components/dashboard/plant-info"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAssetRows } from "@/data/asset-store"
import { useInspectionRows } from "@/data/inspection-store"
import { plants as dashboardPlants } from "@/data/dashboard"
import { usePlantRows } from "@/data/plant-store"
import { slotLabel } from "@/data/operations"
import { useTaskRows } from "@/data/task-store"
import { td, th } from "@/lib/data-table"
import { healthStatus, inspectionStatus, maintenanceStatus, workStatus, type WorkStatus } from "@/lib/status"
import { PlantRecordSections } from "@/pages/plant-onboarding/plant-record"

const segments = ["healthy", "attention", "critical"] as const

const taskLook = (s: WorkStatus) => maintenanceStatus[s] ?? workStatus[s]
const inspectionLook = (s: WorkStatus) => inspectionStatus[s] ?? workStatus[s]

/** How many rows each register shows here; the full list is a click away */
const shown = 6

/**
 * One plant from the Plants table: its record as the plant form captured it
 * (each section editable on its own), how its assets stand, and the maintenance and
 * inspection work booked against it.
 */
export function PlantDetailsPage() {
  const { id } = useParams()
  const assets = useAssetRows()
  const tasks = useTaskRows()
  const inspections = useInspectionRows()
  const plants = usePlantRows()

  const plant = plants.find((p) => p.id === id)

  const own = useMemo(() => {
    if (!plant) return { assets: [], tasks: [], inspections: [] }
    // The registers name a plant as the dashboard data does, so an edited name still finds its records
    const name = dashboardPlants.find((p) => p.id === plant.id)?.name ?? plant.name
    return {
      assets: assets.filter((a) => a.plant === name),
      tasks: tasks.filter((t) => t.plant === name),
      inspections: inspections.filter((i) => i.plant === name),
    }
  }, [plant, assets, tasks, inspections])

  if (!plant) return <Navigate to="/plants-list" replace />

  // A plant just added has no assets yet
  const pct = (n: number) => (plant.assets ? Math.round((n / plant.assets) * 100) : 0)
  const openTasks = own.tasks.filter((t) => t.status !== "completed" && t.status !== "closed").length
  const openInspections = own.inspections.filter((i) => i.status !== "completed").length

  return (
    <div className="space-y-3">
      <PageHeader
        title={plant.name}
        breadcrumbs={[{ label: "Plants", to: "/plants-list" }, { label: plant.name }]}
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <PlantInfo plant={plant} />

        {/* ---------- Asset health, as one bar with its three bands ---------- */}
        <section className="flex flex-col rounded-xl bg-card p-3 shadow-sm ring-1 ring-foreground/10">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Asset Health</h2>
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5" /> {plant.location}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-healthy-soft-foreground tabular-nums">{pct(plant.healthy)}%</span>
            <span className="text-xs text-muted-foreground">of {plant.assets.toLocaleString("en-IN")} assets healthy</span>
          </div>
          <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-muted">
            {segments.map((k) => (
              <span key={k} className={healthStatus[k].dot} style={{ width: `${pct(plant[k])}%` }} />
            ))}
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
            {segments.map((k) => (
              <div key={k} className="rounded-md bg-muted/50 px-2 py-1.5">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <span className={cn("size-2 rounded-full", healthStatus[k].dot)} /> {healthStatus[k].label}
                </span>
                <span className="font-semibold tabular-nums">{plant[k]}</span> <span className="text-muted-foreground">({pct(plant[k])}%)</span>
              </div>
            ))}
          </div>
          <p className="mt-auto pt-3 text-[0.7rem] text-muted-foreground">
            {plant.activeUsers} active users · {plant.activeThisWeek} active this week
          </p>
        </section>
      </div>

      {/* The plant's record, each part edited on its own as on OCC's enterprise page */}
      <section className="space-y-2.5 rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10">
        <h2 className="text-sm font-semibold">Plant Details</h2>
        <PlantRecordSections plantId={plant.id} entry={plant.entry} />
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Total Assets" value={plant.assets.toLocaleString("en-IN")} icon={Server} tone="info" />
        <StatCard label={`${healthStatus.healthy.label} Assets`} value={plant.healthy} percent={pct(plant.healthy)} icon={HeartPulse} tone="healthy" />
        <StatCard label={healthStatus.attention.label} value={plant.attention} percent={pct(plant.attention)} icon={TriangleAlert} tone="attention" />
        <StatCard label={healthStatus.critical.label} value={plant.critical} percent={pct(plant.critical)} icon={ShieldAlert} tone="critical" />
        <StatCard label="Open Work" value={openTasks + openInspections} icon={Wrench} tone="highlight" />
      </div>

      <div className="space-y-3">
        <Register
          title="Maintenance Tasks"
          icon={Wrench}
          count={own.tasks.length}
          more="/tasks"
          empty="No maintenance tasks at this plant yet."
          head={["Task ID", "Asset", "Task Type", "Scheduled", "Status"]}
          rows={own.tasks.slice(0, shown).map((t) => ({
            key: t.id,
            to: `/tasks/${t.id}`,
            cells: [t.id, t.asset, t.type, `${t.scheduled} · ${slotLabel(t.slot)}`],
            status: taskLook(t.status),
          }))}
        />
        <Register
          title="Inspections"
          icon={ClipboardCheck}
          count={own.inspections.length}
          more="/inspection-activities"
          empty="No inspections at this plant yet."
          head={["Inspection ID", "Asset", "Activity", "Due", "Status"]}
          rows={own.inspections.slice(0, shown).map((i) => ({
            key: i.id,
            to: `/inspection-activities/${i.id}`,
            cells: [i.id, i.asset, i.activity, `${i.due} · ${slotLabel(i.slot)}`],
            status: inspectionLook(i.status),
          }))}
        />
      </div>

      <Register
        title="Assets"
        icon={HardDrive}
        count={own.assets.length}
        more="/assets"
        empty="No assets registered at this plant yet."
        head={["Asset ID", "Asset", "Category", "Department", "Next Due", "Health"]}
        rows={own.assets.slice(0, shown).map((a) => ({
          key: a.tagId,
          to: `/assets/${a.tagId}`,
          cells: [a.tagId, a.name, a.category, a.department, a.nextDue || "-"],
          health: a.health,
        }))}
      />
    </div>
  )
}

type RegisterRow = {
  key: string
  to: string
  cells: string[]
  status?: { label: string; badge: (typeof workStatus)[WorkStatus]["badge"] }
  health?: keyof typeof healthStatus | null
}

/** A short register of the plant's own records, its first rows and a way to the full list */
function Register({
  title,
  icon: Icon,
  count,
  more,
  empty,
  head,
  rows,
}: {
  title: string
  icon: React.ComponentType<{ className?: string }>
  count: number
  more: string
  empty: string
  head: string[]
  rows: RegisterRow[]
}) {
  const navigate = useNavigate()
  return (
    <section className="flex flex-col rounded-lg bg-card shadow-xs ring-1 ring-foreground/10">
      <div className="flex items-center gap-2 border-b px-3 py-2">
        <Icon className="size-4 text-primary" />
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="rounded bg-muted px-1.5 text-[0.65rem] font-semibold text-muted-foreground tabular-nums">{count}</span>
        <Link to={more} className="ml-auto flex items-center gap-1 text-xs font-medium text-primary hover:underline">
          View all <ArrowRight className="size-3.5" />
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-muted-foreground">{empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                {head.map((h, i) => <TableHead key={h} className={cn(th, i === 0 && "pl-3")}>{h}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.key} onClick={() => navigate(r.to)} className="cursor-pointer">
                  {r.cells.map((c, i) => (
                    <TableCell key={i} className={cn(td, i === 0 && "pl-3 font-medium text-primary")}>{c}</TableCell>
                  ))}
                  <TableCell className={td}>
                    {r.status ? (
                      <Badge variant={r.status.badge} className="rounded px-1.5 py-0 text-[0.65rem]">{r.status.label}</Badge>
                    ) : r.health ? (
                      <span className="flex items-center gap-1.5 text-xs">
                        <span className={cn("size-2 rounded-full", healthStatus[r.health].dot)} /> {healthStatus[r.health].label}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not inspected yet</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  )
}
