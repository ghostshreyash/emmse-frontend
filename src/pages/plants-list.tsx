import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import { Factory, FileText, HeartPulse, Plus, Search, Server, Sheet, ShieldAlert, TriangleAlert, UserPlus, UserRound, X } from "lucide-react"
import { cn } from "cn"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/common/stat-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { setPlantManager, usePlantRows, type PlantRecord as Plant } from "@/data/plant-store"
import { PlantManagerDialog } from "@/pages/plant-onboarding/steps"
import { control, td, th } from "@/lib/data-table"
import { exportCsv, exportPdf, type ExportColumn } from "@/lib/table-export"
import { healthStatus } from "@/lib/status"

const segments = ["healthy", "attention", "critical"] as const

const healthyPct = (p: Plant) => (p.assets ? Math.round((p.healthy / p.assets) * 100) : 0)

const exportColumns: ExportColumn<Plant>[] = [
  { header: "Plant Code", value: (p) => p.id },
  { header: "Plant", value: (p) => p.name },
  { header: "Plant Type", value: (p) => p.type },
  { header: "Location", value: (p) => p.location },
  { header: "Plant Head", value: (p) => p.head },
  { header: "Plant Manager", value: (p) => p.entry.manager?.email ?? "" },
  { header: "Capacity", value: (p) => p.capacity },
  { header: "Departments", value: (p) => String(p.departments) },
  { header: "Assets", value: (p) => String(p.assets) },
  { header: "Healthy", value: (p) => String(p.healthy) },
  { header: "Alarming", value: (p) => String(p.attention) },
  { header: "At Risk", value: (p) => String(p.critical) },
  { header: "Commissioned On", value: (p) => p.commissioned },
  { header: "Active Users", value: (p) => String(p.activeUsers) },
]

/**
 * Plants: every plant of the enterprise as one table, laid out like the Asset
 * Management register. A row opens that plant's own screen.
 */
export function PlantsListPage() {
  const navigate = useNavigate()
  const plants = usePlantRows()
  const [query, setQuery] = useState("")
  const [type, setType] = useState("all")
  /* The plant whose Plant Manager is being added from its row */
  const [managerFor, setManagerFor] = useState<Plant | null>(null)

  const types = useMemo(() => [...new Set(plants.map((p) => p.type))].sort(), [plants])
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return plants.filter(
      (p) =>
        (type === "all" || p.type === type) &&
        (!q || [p.id, p.name, p.type, p.location, p.head, p.capacity].join(" ").toLowerCase().includes(q))
    )
  }, [plants, query, type])

  const sum = (k: "assets" | "healthy" | "attention" | "critical") => rows.reduce((n, p) => n + p[k], 0)
  const total = sum("assets")
  const pct = (n: number) => (total ? Math.round((n / total) * 100) : 0)
  const filtered = !!query || type !== "all"

  return (
    <div className="space-y-3">
      <PageHeader
        title="Plants"
        breadcrumbs={[{ label: "Plants" }]}
        actions={
          <>
            <Button size="sm" onClick={() => navigate("/plants-list/add")}>
              <Plus /> Add Plant
            </Button>
            <Button variant="outline" size="sm" className="bg-card" onClick={() => exportCsv("plants", exportColumns, rows)}>
              <Sheet /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className="bg-card" onClick={() => exportPdf("Plants", exportColumns, rows)}>
              <FileText /> Export PDF
            </Button>
          </>
        }
      />

      {/* ---------- Totals across the plants shown ---------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard label="Plants" value={rows.length} icon={Factory} tone="info" />
        <StatCard label="Total Assets" value={total.toLocaleString("en-IN")} icon={Server} tone="highlight" />
        <StatCard label={`${healthStatus.healthy.label} Assets`} value={sum("healthy")} percent={pct(sum("healthy"))} icon={HeartPulse} tone="healthy" />
        <StatCard label={healthStatus.attention.label} value={sum("attention")} percent={pct(sum("attention"))} icon={TriangleAlert} tone="attention" />
        <StatCard label={healthStatus.critical.label} value={sum("critical")} percent={pct(sum("critical"))} icon={ShieldAlert} tone="critical" />
      </div>

      <section className="flex flex-col rounded-lg bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10">
        {/* Search first, filter beside it, clear hard right */}
        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5">
          <div className="relative">
            <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search here..."
              aria-label="Search plants"
              className={cn(control, "w-60 bg-card pl-7 md:text-xs")}
            />
          </div>
          <Select value={type} onValueChange={setType}>
            <SelectTrigger size="sm" className={cn(control, "w-48 bg-card")} aria-label="Plant type"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Plant Types</SelectItem>
              {types.map((t) => <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            className={cn(control, "ml-auto bg-card")}
            disabled={!filtered}
            onClick={() => {
              setQuery("")
              setType("all")
            }}
          >
            <X className="size-3.5" /> Clear Filters
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className={cn(th, "pl-3")}>Plant</TableHead>
                <TableHead className={th}>Plant Type</TableHead>
                <TableHead className={cn(th, "hidden lg:table-cell")}>Location</TableHead>
                <TableHead className={cn(th, "hidden md:table-cell")}>Plant Head</TableHead>
                <TableHead className={th}>Plant Manager</TableHead>
                <TableHead className={th}>Capacity</TableHead>
                <TableHead className={cn(th, "text-right")}>Departments</TableHead>
                <TableHead className={cn(th, "text-right")}>Assets</TableHead>
                <TableHead className={cn(th, "w-48")}>Asset Health</TableHead>
                <TableHead className={cn(th, "hidden xl:table-cell")}>Commissioned On</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((p) => (
                  <TableRow key={p.id} onClick={() => navigate(`/plants-list/${p.id}`)} className="cursor-pointer">
                    <TableCell className={cn(td, "pl-3")}>
                      <Link to={`/plants-list/${p.id}`} onClick={(e) => e.stopPropagation()} className="group/name flex items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded bg-primary/10 text-[0.6rem] font-bold text-primary">{p.id}</span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium group-hover/name:text-primary group-hover/name:underline">{p.name}</span>
                          <span className="block text-[0.65rem] text-muted-foreground">{p.activeUsers} active users</span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className={td}>{p.type}</TableCell>
                    <TableCell className={cn(td, "hidden lg:table-cell")}>{p.location}</TableCell>
                    <TableCell className={cn(td, "hidden md:table-cell")}>{p.head}</TableCell>
                    <TableCell className={td} onClick={(e) => e.stopPropagation()}>
                      {p.entry.manager ? (
                        <span className="flex items-center gap-1.5" title={p.entry.manager.role}>
                          <UserRound className="size-3.5 shrink-0 text-muted-foreground" />
                          <span className="truncate">{p.entry.manager.email}</span>
                        </span>
                      ) : (
                        <Button variant="outline" size="sm" className="h-6 px-2 text-[0.7rem]" onClick={() => setManagerFor(p)}>
                          <UserPlus className="size-3.5" /> Add Manager
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className={cn(td, "tabular-nums")}>{p.capacity}</TableCell>
                    <TableCell className={cn(td, "text-right tabular-nums")}>{p.departments}</TableCell>
                    <TableCell className={cn(td, "text-right font-semibold tabular-nums")}>{p.assets.toLocaleString("en-IN")}</TableCell>
                    <TableCell className={td}>
                      {p.assets === 0 ? (
                        <span className="text-[0.7rem] text-muted-foreground">No assets yet</span>
                      ) : (
                      <div className="flex items-center gap-2">
                        <span
                          className="flex h-2 flex-1 overflow-hidden rounded-full bg-muted"
                          title={segments.map((k) => `${healthStatus[k].label}: ${p[k]}`).join(" · ")}
                        >
                          {segments.map((k) => (
                            <span key={k} className={healthStatus[k].dot} style={{ width: `${(p[k] / p.assets) * 100}%` }} />
                          ))}
                        </span>
                        <span className="w-9 text-right text-[0.7rem] font-semibold text-healthy-soft-foreground tabular-nums">{healthyPct(p)}%</span>
                      </div>
                      )}
                    </TableCell>
                    <TableCell className={cn(td, "hidden tabular-nums xl:table-cell")}>{p.commissioned}</TableCell>
                  </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {rows.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">No plants match these filters.</p>
        ) : (
          <div className="border-t px-3 py-2 text-[0.7rem] text-muted-foreground tabular-nums">
            Showing <strong className="text-foreground">{rows.length}</strong> of <strong className="text-foreground">{plants.length}</strong> plants
          </div>
        )}
      </section>

      {managerFor ? (
        <PlantManagerDialog
          open
          onOpenChange={(open) => !open && setManagerFor(null)}
          plantName={managerFor.name}
          onSave={(manager) => {
            setPlantManager(managerFor.id, manager)
            toast.success(`Plant Manager added to ${managerFor.name}`)
          }}
        />
      ) : null}
    </div>
  )
}
