import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
import { FileText, Search, Sheet, X } from "lucide-react"
import { cn } from "cn"

import { SortHead, TablePager } from "@/components/common/data-table"
import { PageHeader } from "@/components/common/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { plants } from "@/data/dashboard"
import { healthBandFor } from "@/data/master-data"
import { contaminationTone, findingLook, findings, reportRows, type Finding, type ReportRow } from "@/data/reports"
import { control, nextSort, sortRows, td, th, type Sort } from "@/lib/data-table"
import { exportCsv, exportPdf, type ExportColumn } from "@/lib/table-export"
import { healthStatus } from "@/lib/status"

const ANY = "all"

type SortKey = "assetId" | "asset" | "plant" | "health" | "contamination" | "hygiene" | "cleaning" | "inspection"

const findingRank: Record<Finding, number> = { Healthy: 0, Alarming: 1, "At Risk": 2 }

/** dd-MM-yyyy sorts as a moment, not as text, or December would come before February */
const asMoment = (dmy: string) => {
  if (!dmy) return 0
  const [d, m, y] = dmy.split("-").map(Number)
  return new Date(y, m - 1, d).getTime()
}

const sortValue: Record<SortKey, (r: ReportRow) => string | number> = {
  assetId: (r) => r.asset.tagId,
  asset: (r) => r.asset.name,
  plant: (r) => r.asset.plant,
  health: (r) => r.healthScore,
  contamination: (r) => findingRank[r.contaminationStatus],
  hygiene: (r) => r.hygieneOpen,
  cleaning: (r) => asMoment(r.maintenance?.on ?? ""),
  inspection: (r) => asMoment(r.inspection.on),
}

/**
 * Columns shared by the CSV and PDF exports. The exports carry what the table
 * shows, including which Inspection and Task each report traces back to - the
 * reason to export this screen at all is usually to chase one of those.
 */
const exportColumns: ExportColumn<ReportRow>[] = [
  { header: "Asset ID", value: (r) => r.asset.tagId },
  { header: "Asset", value: (r) => r.asset.name },
  { header: "Plant", value: (r) => r.asset.plant },
  { header: "Category", value: (r) => r.asset.category },
  { header: "Health Score", value: (r) => String(r.healthScore) },
  { header: "Health", value: (r) => healthBandFor(r.healthScore).label },
  { header: "Contamination", value: (r) => `${r.contamination} · ${r.contaminationStatus}` },
  { header: "Hygiene", value: (r) => (r.hygieneOpen ? `${r.hygieneOpen} of ${r.hygiene.length} open` : "All points clear") },
  { header: "Last Cleaned", value: (r) => r.maintenance?.on ?? "Not cleaned yet" },
  { header: "Inspection", value: (r) => `${r.inspection.id} (${r.inspection.activity})` },
  { header: "Task", value: (r) => (r.maintenance ? `${r.maintenance.id} (${r.maintenance.type})` : "") },
]

/**
 * Reports & Analytics: every asset that has been inspected, and the three
 * documents its record holds.
 *
 * One row per asset rather than one row per report. The question this screen
 * answers is "what has this asset got, and what does it say" - so the three
 * reports are three columns, each reading its own headline, and the row opens
 * the asset where all of its detail and the documents themselves live.
 *
 * The Inspection and Task columns are the flow made visible: a report exists
 * because an ELPREMAR inspected the asset in EVITA and because the maintenance
 * that inspection raised has run. Both link through to those screens.
 *
 * EMMS-E is one enterprise, so there is no customer filter - the plant filter
 * is the widest cut available here, as it is on Tasks and Inspections.
 */
export function ReportsPage() {
  const navigate = useNavigate()
  const [query, setQuery] = useState("")
  const [plant, setPlant] = useState(ANY)
  const [category, setCategory] = useState(ANY)
  const [status, setStatus] = useState(ANY)
  const [sort, setSort] = useState<Sort<SortKey>>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  /** Only the categories that actually have a report, so the filter cannot empty the table */
  const categories = useMemo(() => [...new Set(reportRows.map((r) => r.asset.category))].sort(), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return reportRows.filter((r) => {
      if (plant !== ANY && r.asset.plant !== plant) return false
      if (category !== ANY && r.asset.category !== category) return false
      /* Either report's standing counts: an asset is on screen if either flags it */
      if (status !== ANY && r.contaminationStatus !== status && r.hygieneStatus !== status) return false
      if (!q) return true
      const haystack = [
        r.asset.tagId,
        r.asset.name,
        r.asset.plant,
        r.asset.category,
        r.asset.department,
        r.contamination,
        r.contaminationStatus,
        r.hygieneStatus,
        r.inspection.id,
        r.inspection.activity,
        r.maintenance?.id ?? "",
        r.maintenance?.type ?? "",
      ]
      return haystack.some((f) => f.toLowerCase().includes(q))
    })
  }, [query, plant, category, status])

  const sorted = useMemo(() => sortRows(filtered, sort, sortValue), [filtered, sort])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  // Narrowing the results can strand the viewer past the last page, so clamp on read
  const current = Math.min(page, pages)
  const start = (current - 1) * pageSize
  const shown = sorted.slice(start, start + pageSize)

  const filtersOn = !!query || plant !== ANY || category !== ANY || status !== ANY
  const clearFilters = () => {
    setQuery("")
    setPlant(ANY)
    setCategory(ANY)
    setStatus(ANY)
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="Reports & Analytics"
        description="Contamination, hygiene and cleaning reports for every inspected asset."
        breadcrumbs={[{ label: "Reports & Analytics" }]}
        actions={
          <>
            <Button variant="outline" size="sm" className={cn(control, "bg-card")} onClick={() => exportCsv("reports", exportColumns, sorted)}>
              <Sheet className="size-3.5" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className={cn(control, "bg-card")} onClick={() => exportPdf("Reports & Analytics", exportColumns, sorted)}>
              <FileText className="size-3.5" /> Export PDF
            </Button>
          </>
        }
      />

      <section className="flex flex-col rounded-lg bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10">
        {/* Search hard left, filters centred, clear hard right — as on Tasks and Inspections */}
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
          <div className="relative">
            <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder="Search asset, plant or report..."
              className={cn(control, "w-60 bg-card pl-7")}
            />
          </div>
          <div className="mx-auto flex flex-wrap items-center gap-2">
            <Select value={plant} onValueChange={(v) => { setPlant(v); setPage(1) }}>
              <SelectTrigger size="sm" className={cn(control, "w-44 bg-card")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All Plants</SelectItem>
                {plants.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1) }}>
              <SelectTrigger size="sm" className={cn(control, "w-44 bg-card")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1) }}>
              <SelectTrigger size="sm" className={cn(control, "w-40 bg-card")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All Findings</SelectItem>
                {findings.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm" className={cn(control, "bg-card")} disabled={!filtersOn} onClick={clearFilters}>
            <X className="size-3.5" /> Clear Filters
          </Button>
        </div>

        <div className="overflow-x-auto px-2 pb-3">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className={cn(th, "w-10")}>#</TableHead>
                <SortHead label="Asset ID" column="assetId" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Asset" column="asset" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Plant" column="plant" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Health Score" column="health" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Contamination" column="contamination" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Hygiene" column="hygiene" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Cleaning" column="cleaning" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Inspection" column="inspection" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <TableHead className={th}>Task</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((r, i) => {
                const band = healthBandFor(r.healthScore)
                return (
                  <TableRow key={r.asset.tagId} onClick={() => navigate(`/reports/${r.asset.tagId}`)} className="cursor-pointer">
                    <TableCell className={cn(td, "tabular-nums text-muted-foreground")}>{start + i + 1}</TableCell>
                    <TableCell className={cn(td, "font-medium whitespace-nowrap")}>{r.asset.tagId}</TableCell>
                    <TableCell className={cn(td, "font-medium")}>
                      {r.asset.name}
                      <span className="block text-[0.65rem] text-muted-foreground">{r.asset.category}</span>
                    </TableCell>
                    <TableCell className={td}>
                      {r.asset.plant}
                      <span className="block text-[0.65rem] text-muted-foreground">{r.asset.department}</span>
                    </TableCell>
                    <TableCell className={cn(td, "whitespace-nowrap")}>
                      <span className="flex items-center gap-1.5">
                        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", healthStatus[band.tone].dot)} />
                        <span className="font-semibold tabular-nums">{r.healthScore}</span>
                        <span className="text-[0.65rem] text-muted-foreground">{band.label}</span>
                      </span>
                    </TableCell>
                    {/* Contamination Report: the dust level, and what it scores as */}
                    <TableCell className={cn(td, "whitespace-nowrap")}>
                      <span className={cn("rounded px-1.5 py-0.5 text-[0.65rem] font-semibold", contaminationTone[r.contamination])}>
                        {r.contamination}
                      </span>
                      <span className="block text-[0.65rem] text-muted-foreground">{r.contaminationStatus}</span>
                    </TableCell>
                    {/* Hygiene Report: point-specific and carries no score, so it reports its open points */}
                    <TableCell className={cn(td, "whitespace-nowrap")}>
                      <Badge variant={findingLook[r.hygieneStatus].badge} className="rounded px-1.5 py-0 text-[0.65rem]">
                        {r.hygieneOpen ? `${r.hygieneOpen} of ${r.hygiene.length} open` : "All clear"}
                      </Badge>
                    </TableCell>
                    {/* Cleaning Report: only exists once a clean has happened */}
                    <TableCell className={cn(td, "tabular-nums whitespace-nowrap")}>
                      {r.maintenance ? (
                        <>
                          {r.maintenance.on}
                          <span className="block text-[0.65rem] text-muted-foreground">Next {r.nextCleaningDue}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground/60">Not cleaned yet</span>
                      )}
                    </TableCell>
                    <TableCell className={cn(td, "whitespace-nowrap")} onClick={(e) => e.stopPropagation()}>
                      <Link to={`/inspection-activities/${r.inspection.id}`} className="tabular-nums text-primary hover:underline">
                        {r.inspection.id}
                      </Link>
                      <span className="block text-[0.65rem] text-muted-foreground">{r.inspection.activity}</span>
                    </TableCell>
                    <TableCell className={cn(td, "whitespace-nowrap")} onClick={(e) => e.stopPropagation()}>
                      {r.maintenance ? (
                        <>
                          <Link to={`/tasks/${r.maintenance.id}`} className="tabular-nums text-primary hover:underline">
                            {r.maintenance.id}
                          </Link>
                          <span className="block text-[0.65rem] text-muted-foreground">{r.maintenance.type}</span>
                        </>
                      ) : (
                        <span className="text-muted-foreground/60">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-xs text-muted-foreground">
                    No asset report matches the filters.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>

          <TablePager
            page={current}
            pages={pages}
            pageSize={pageSize}
            total={sorted.length}
            start={start}
            onPage={setPage}
            onPageSize={(n) => { setPageSize(n); setPage(1) }}
          />
        </div>
      </section>
    </div>
  )
}
