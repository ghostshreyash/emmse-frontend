import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { Eye, FileText, Search, Sheet, X } from "lucide-react"
import { cn } from "cn"

import { SortHead, TablePager } from "@/components/common/data-table"
import { DocumentDialog, type OpenDocument } from "@/components/common/document-dialog"
import { PageHeader } from "@/components/common/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { plants } from "@/data/dashboard"
import { healthBandFor } from "@/data/master-data"
import { reportDocuments, type ReportKind } from "@/data/report-documents"
import { contaminationTone, findingLook, findings, reportRows, type Finding, type ReportRow } from "@/data/reports"
import { control, nextSort, sortRows, td, th, type Sort } from "@/lib/data-table"
import { exportCsv, exportPdf, type ExportColumn } from "@/lib/table-export"
import { healthStatus } from "@/lib/status"

const ANY = "all"

/** The three documents by kind, so a column can reach its own one */
const documentFor = Object.fromEntries(reportDocuments.map((doc) => [doc.kind, doc])) as Record<
  ReportKind,
  (typeof reportDocuments)[number]
>

type SortKey = "assetId" | "asset" | "plant" | "health" | "contamination" | "hygiene" | "cleaning"

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
}

/**
 * Columns shared by the CSV and PDF exports.
 *
 * The export carries the Inspection and Task the reports were read off even
 * though the table no longer shows them: chasing a figure back to the activity
 * that produced it is usually why this screen gets exported, and an export has
 * no detail screen to click into.
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
 * One row per asset rather than one row per report, and the three reports are
 * three columns at the right of it - Contamination, Hygiene, Cleaning - each
 * reading its own headline with View Report under it, so the document itself
 * opens from the table without going through the asset first. That is what the
 * screen is for: the three reports are the thing being read.
 *
 * The Inspection ID and Task ID the reports were read off are deliberately not
 * columns here. They are provenance rather than content - worth having when a
 * figure is being chased, which is what the asset's own screen and the export
 * are for, and nine columns of them crowded out the reports themselves.
 *
 * EMMS-E is one enterprise, so there is no customer filter - the plant filter
 * is the widest cut available, as it is on Tasks and Inspections.
 */
export function ReportsPage() {
  const navigate = useNavigate()
  const [open, setOpen] = useState<OpenDocument | null>(null)
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
        /* Still searchable, so a ticket quoting an Inspection ID finds its asset */
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

  /** Open one asset's copy of one report, named for that asset when it is saved */
  const openReport = (row: ReportRow, kind: ReportKind) => {
    const doc = documentFor[kind]
    setOpen({
      title: doc.title,
      file: doc.file,
      detail: `${row.asset.tagId} · ${doc.detail}`,
      fileName: doc.fileName(row.asset.tagId),
    })
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
              {/* The three reports are grouped under one head, so the columns read as documents */}
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead colSpan={5} className={cn(th, "border-b-0")} />
                <TableHead colSpan={3} className={cn(th, "border-b-0 border-l border-foreground/10 text-center")}>
                  Reports — open any one as a PDF
                </TableHead>
              </TableRow>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className={cn(th, "w-10")}>#</TableHead>
                <SortHead label="Asset ID" column="assetId" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Asset" column="asset" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Plant" column="plant" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Health Score" column="health" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead
                  label="Contamination"
                  column="contamination"
                  sort={sort}
                  onSort={(c) => setSort(nextSort(sort, c))}
                  className="border-l border-foreground/10"
                />
                <SortHead label="Hygiene" column="hygiene" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Cleaning" column="cleaning" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
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

                    {/* ---------- The three reports ---------- */}

                    {/* Contamination: the dust level, what it scores as, and the document */}
                    <ReportCell
                      className="border-l border-foreground/10"
                      onView={() => openReport(r, "contamination")}
                      headline={
                        <>
                          <span className={cn("rounded px-1.5 py-0.5 text-[0.65rem] font-semibold", contaminationTone[r.contamination])}>
                            {r.contamination}
                          </span>
                          <span className="block text-[0.65rem] text-muted-foreground">{r.contaminationStatus}</span>
                        </>
                      }
                    />

                    {/* Hygiene: point-specific and carries no score, so it reports its open points */}
                    <ReportCell
                      onView={() => openReport(r, "hygiene")}
                      headline={
                        <Badge variant={findingLook[r.hygieneStatus].badge} className="rounded px-1.5 py-0 text-[0.65rem]">
                          {r.hygieneOpen ? `${r.hygieneOpen} of ${r.hygiene.length} open` : "All clear"}
                        </Badge>
                      }
                    />

                    {/* Cleaning: the before and after of a clean, so there is none until one has happened */}
                    <ReportCell
                      onView={r.maintenance ? () => openReport(r, "cleaning") : undefined}
                      missing="Not cleaned yet"
                      headline={
                        r.maintenance ? (
                          <>
                            <span className="text-[0.7rem] tabular-nums">{r.maintenance.on}</span>
                            <span className="block text-[0.65rem] text-muted-foreground">Next {r.nextCleaningDue}</span>
                          </>
                        ) : null
                      }
                    />
                  </TableRow>
                )
              })}
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-xs text-muted-foreground">
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

      <DocumentDialog document={open} onClose={() => setOpen(null)} />
    </div>
  )
}

/**
 * One report in the table: what it says about this asset, and the way into the
 * document under it.
 *
 * The click is stopped here rather than on the button, so neither the button nor
 * the space around it opens the asset behind the row - the cell belongs to the
 * report, and the rest of the row opens the asset.
 *
 * A report that does not exist yet keeps its cell and says so, so the column
 * reads as "no cleaning report" rather than as a blank nobody can account for.
 */
function ReportCell({
  headline,
  onView,
  missing,
  className,
}: {
  headline: React.ReactNode
  /** Absent when this asset has no such report yet */
  onView?: () => void
  missing?: string
  className?: string
}) {
  return (
    <TableCell className={cn(td, "align-top whitespace-nowrap", className)} onClick={(e) => e.stopPropagation()}>
      {onView ? (
        <>
          {headline}
          <Button variant="outline" size="xs" className="mt-1 bg-card" onClick={onView}>
            <Eye className="size-3" /> View Report
          </Button>
        </>
      ) : (
        <span className="text-[0.7rem] text-muted-foreground/60">{missing}</span>
      )}
    </TableCell>
  )
}
