import { useMemo, useState } from "react"
import type { DateRange } from "react-day-picker"
import { addDays, endOfDay, format, isAfter, isBefore, parse, startOfDay } from "date-fns"
import { Link, useNavigate } from "react-router"
// import { toast } from "sonner" (with Import Assets)
import {
  ChevronLeft,
  ChevronRight,
  FileText,
  HeartPulse,
  Plus,
  Search,
  Server,
  ShieldAlert,
  Sheet,
  TriangleAlert,
  // Upload, (with Import Assets)
  X,
} from "lucide-react"
import { cn } from "cn"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AssetIllustration } from "@/components/common/asset-illustration"
import { DateRangeFilter } from "@/components/common/data-table"
import { PageHeader } from "@/components/common/page-header"
import { StatCard } from "@/components/common/stat-card"
import { departments, type AssetRecord } from "@/data/assets"
import { useAssetRows } from "@/data/asset-store"
import { getDashboardData, plants } from "@/data/dashboard"
import { control, td, th } from "@/lib/data-table"
import { exportCsv, exportPdf, type ExportColumn } from "@/lib/table-export"
import { healthStatus } from "@/lib/status"

/* ---------- Filters ---------- */

type Filters = {
  /** Free-text search over everything a row shows */
  query: string
  plant: string
  department: string
  subDepartment: string
  category: string
  health: string
  manufacturer: string
  commissioned?: DateRange
  inspected?: DateRange
  due?: DateRange
}

const noFilters: Filters = {
  query: "",
  plant: "all",
  department: "all",
  subDepartment: "all",
  category: "all",
  health: "all",
  manufacturer: "all",
}

const PAGE_SIZES = [8, 16, 32]

/** How far ahead a next due date counts as upcoming */
const UPCOMING_DAYS = 30

/** dd-MM-yyyy → yyyy-MM-dd, so register dates compare as plain strings */
const ymd = (dmy: string) => {
  const [d, m, y] = dmy.split("-")
  return `${y}-${m}-${d}`
}

/** Whether a dd-MM-yyyy date falls in a picked range; one picked day is a range of one */
function inRange(dmy: string, range?: DateRange) {
  if (!range?.from) return true
  // An asset with no such date yet (say, never inspected) is outside any range
  if (!dmy) return false
  const on = parse(dmy, "dd-MM-yyyy", new Date())
  return !isBefore(on, startOfDay(range.from)) && !isAfter(on, endOfDay(range.to ?? range.from))
}

/** How an asset's health reads, including one onboarded and not yet inspected */
const notInspected = { ...healthStatus.offline, label: "Not Inspected" }
const healthLook = (a: AssetRecord) => (a.health ? healthStatus[a.health] : notInspected)

/** What the search box looks through: every value a row shows, plus its plant */
const searchText = (a: AssetRecord) =>
  [a.tagId, a.name, a.category, a.plant, a.department, a.subDepartment, a.manufacturer, a.model, healthLook(a).label, a.lastInspection, a.nextDue]
    .join(" ")
    .toLowerCase()

const applyFilters = (rows: AssetRecord[], f: Filters) => {
  const q = f.query.trim().toLowerCase()
  return rows.filter(
    (a) =>
      (!q || searchText(a).includes(q)) &&
      (f.plant === "all" || a.plant === f.plant) &&
      (f.department === "all" || a.department === f.department) &&
      (f.subDepartment === "all" || a.subDepartment === f.subDepartment) &&
      (f.category === "all" || a.category === f.category) &&
      (f.health === "all" || (a.health ?? "unscored") === f.health) &&
      (f.manufacturer === "all" || a.manufacturer === f.manufacturer) &&
      inRange(a.commissionedOn, f.commissioned) &&
      inRange(a.lastInspection, f.inspected) &&
      inRange(a.nextDue, f.due)
  )
}

/** Page numbers with gaps, e.g. 1 2 3 4 5 … 156 */
function pageList(current: number, pages: number): (number | "gap")[] {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1)
  const start = Math.max(1, Math.min(current - 2, pages - 4))
  const window = Array.from({ length: 5 }, (_, i) => start + i)
  return [
    ...(start > 1 ? [1, ...(start > 2 ? (["gap"] as const) : [])] : []),
    ...window,
    ...(start + 4 < pages ? [...(start + 4 < pages - 1 ? (["gap"] as const) : []), pages] : []),
  ]
}

const exportColumns: ExportColumn<AssetRecord>[] = [
  { header: "Asset Tag ID", value: (a) => a.tagId },
  { header: "Asset Name", value: (a) => a.name },
  { header: "Category", value: (a) => a.category },
  { header: "Plant", value: (a) => a.plant },
  { header: "Department", value: (a) => a.department },
  { header: "Sub-department", value: (a) => a.subDepartment },
  { header: "Manufacturer", value: (a) => a.manufacturer },
  { header: "Model", value: (a) => a.model },
  { header: "Serial Number", value: (a) => a.serial },
  { header: "Health Status", value: (a) => healthLook(a).label },
  { header: "Health Score", value: (a) => (a.healthScore === null ? "" : String(a.healthScore)) },
  { header: "Last Inspection", value: (a) => a.lastInspection },
  { header: "Next Due Date", value: (a) => a.nextDue },
  { header: "Commissioning Date", value: (a) => a.commissionedOn },
]

/* ---------- Small pieces ---------- */

/** A toolbar dropdown whose first option clears it */
function Choice({ value, onChange, options, all, className }: { value: string; onChange: (v: string) => void; options: readonly string[]; all: string; className?: string }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" className={cn(control, "bg-card", className)} aria-label={all}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all" className="text-xs">{all}</SelectItem>
        {options.map((o) => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

/* ---------- Page ---------- */

/**
 * Asset Management: review and act on every electrical asset across the enterprise's
 * plants. The list filters as soon as a filter changes, like the Tasks and Inspections
 * lists, using this app's naming (Plant / Department / Sub-department).
 */
export function AssetsPage() {
  const today = format(new Date(), "yyyy-MM-dd")
  // Assets due on or before this date count as upcoming and get a green row
  const soon = format(addDays(new Date(), UPCOMING_DAYS), "yyyy-MM-dd")

  const [filters, setFilters] = useState<Filters>(noFilters)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0])

  const navigate = useNavigate()
  // The live register, so an asset onboarded this session is listed straight away
  const register = useAssetRows()
  const rows = useMemo(() => applyFilters(register, filters), [register, filters])
  // Filter options come from what the register actually holds
  const manufacturers = useMemo(() => [...new Set(register.map((a) => a.manufacturer).filter(Boolean))].sort(), [register])
  const categories = useMemo(() => [...new Set(register.map((a) => a.category))].sort(), [register])
  const pages = Math.max(1, Math.ceil(rows.length / pageSize))
  const current = Math.min(page, pages)
  const start = (current - 1) * pageSize
  const shown = rows.slice(start, start + pageSize)


  // Any change of filter starts again from page 1
  const set = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }))
    setPage(1)
  }
  const reset = () => {
    setFilters(noFilters)
    setPage(1)
  }

  const filtered = (Object.keys(noFilters) as (keyof Filters)[]).some((k) => filters[k] !== noFilters[k]) || !!(filters.commissioned || filters.inspected || filters.due)
  const count = (h: AssetRecord["health"]) => rows.filter((a) => a.health === h).length
  const pct = (n: number) => (rows.length ? Math.round((n / rows.length) * 100) : 0)
  const enterpriseChange = getDashboardData("all").assetKpis.total.change



  return (
    <div className="space-y-3">
      <PageHeader
        title="Asset Management"
        description=""
        breadcrumbs={[{ label: "Asset Management" }]}
        actions={
          <>
            <Button size="sm" asChild>
              <Link to="/assets/add"><Plus /> Add New Asset</Link>
            </Button>
            {/* Import is hidden for now; restore with the Upload icon and toast imports above.
            <Button variant="outline" size="sm" className="bg-card" asChild>
              <label className="cursor-pointer">
                <Upload /> Import Assets
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) toast.info(`${file.name} received`, { description: "Bulk import will validate and load it once the backend exists." })
                    e.target.value = ""
                  }}
                />
              </label>
            </Button> */}
            {/* Exports carry everything the filters match */}
            <Button variant="outline" size="sm" className="bg-card" onClick={() => exportCsv("assets", exportColumns, rows)}>
              <Sheet /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className="bg-card" onClick={() => exportPdf("Asset List", exportColumns, rows)}>
              <FileText /> Export PDF
            </Button>
          </>
        }
      />

      {/* ---------- Totals ---------- */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Total Assets"
          value={rows.length.toLocaleString("en-IN")}
          change={filtered ? undefined : enterpriseChange}
          icon={Server}
          tone="highlight"
        />
        <StatCard label={`${healthStatus.healthy.label} Assets`} value={count("healthy")} percent={pct(count("healthy"))} icon={HeartPulse} tone="healthy" />
        <StatCard label={healthStatus.attention.label} value={count("attention")} percent={pct(count("attention"))} icon={TriangleAlert} tone="attention" />
        <StatCard label={healthStatus.critical.label} value={count("critical")} percent={pct(count("critical"))} icon={ShieldAlert} tone="critical" />
      </div>

      {/* ---------- Asset List: laid out like the Enterprises register ---------- */}
      <section className="flex flex-col rounded-lg bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10">
        {/* Search first, then the filters in reading order, clear hard right */}
        <div className="flex flex-wrap items-center gap-2 border-b px-3 py-2.5">
          <div className="relative">
            <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={filters.query}
              onChange={(e) => set({ query: e.target.value })}
              placeholder="Search here..."
              aria-label="Search assets"
              className={cn(control, "w-52 bg-card pl-7 md:text-xs")}
            />
          </div>
          <div className="contents">
            <Choice value={filters.plant} onChange={(v) => set({ plant: v })} options={plants.map((p) => p.name)} all="All Plants" className="w-36" />
            <Choice
              value={filters.department}
              onChange={(v) => set({ department: v, subDepartment: "all" })}
              options={Object.keys(departments)}
              all="All Departments"
              className="w-40"
            />
            <Choice
              value={filters.subDepartment}
              onChange={(v) => set({ subDepartment: v })}
              options={filters.department === "all" ? [] : departments[filters.department]}
              all="All Sub-departments"
              className="w-40"
            />
            <Choice value={filters.category} onChange={(v) => set({ category: v })} options={categories} all="All Categories" className="w-32" />
            <Select value={filters.health} onValueChange={(v) => set({ health: v })}>
              <SelectTrigger size="sm" className={cn(control, "w-28 bg-card")} aria-label="Health status"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">All Health</SelectItem>
                {(["healthy", "attention", "critical"] as const).map((h) => (
                  <SelectItem key={h} value={h} className="text-xs">{healthStatus[h].label}</SelectItem>
                ))}
                <SelectItem value="unscored" className="text-xs">{notInspected.label}</SelectItem>
              </SelectContent>
            </Select>
            <Choice value={filters.manufacturer} onChange={(v) => set({ manufacturer: v })} options={manufacturers} all="All Manufacturers" className="w-36" />
            <DateRangeFilter label="Commissioned" range={filters.commissioned} onApply={(r) => set({ commissioned: r })} />
            <DateRangeFilter label="Last Inspection" range={filters.inspected} onApply={(r) => set({ inspected: r })} />
            <DateRangeFilter label="Next Due" range={filters.due} onApply={(r) => set({ due: r })} />
          </div>
          <Button variant="outline" size="sm" className={cn(control, "ml-auto bg-card")} disabled={!filtered} onClick={reset}>
            <X className="size-3.5" /> Clear Filters
          </Button>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className={cn(th, "pl-3")}>Asset</TableHead>
                <TableHead className={th}>Category</TableHead>
                <TableHead className={cn(th, "hidden lg:table-cell")}>Location</TableHead>
                <TableHead className={th}>Manufacturer</TableHead>
                <TableHead className={th}>Health Status</TableHead>
                <TableHead className={cn(th, "hidden md:table-cell")}>Last Inspection</TableHead>
                <TableHead className={th}>Next Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((a) => {
                const due = a.nextDue ? ymd(a.nextDue) : ""
                const overdue = !!due && due < today
                const upcoming = !!due && !overdue && due <= soon
                const look = healthLook(a)
                return (
                  <TableRow
                    key={a.tagId}
                    // The whole row opens the asset
                    onClick={() => navigate(`/assets/${encodeURIComponent(a.tagId)}`)}
                    className={cn(
                      "cursor-pointer",
                      overdue && "bg-critical-soft/70 hover:bg-critical-soft",
                      upcoming && "bg-healthy-soft/70 hover:bg-healthy-soft"
                    )}
                  >
                    <TableCell className={cn(td, "relative pl-3")}>
                      {/* Health stripe, reinforcing the badge further along the row */}
                      <span title={`Health: ${look.label}`} className={cn("absolute inset-y-0 left-0 w-0.5", look.dot)}>
                        <span className="sr-only">Health: {look.label}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <AssetIllustration category={a.category} className="h-7 w-10 shrink-0 rounded" />
                        <span className="min-w-0">
                          <Link
                            to={`/assets/${encodeURIComponent(a.tagId)}`}
                            onClick={(e) => e.stopPropagation()}
                            className="block truncate font-medium hover:text-primary hover:underline"
                          >
                            {a.name}
                          </Link>
                          <span className="block text-[0.65rem] text-muted-foreground tabular-nums">{a.tagId}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className={td}>{a.category}</TableCell>
                    <TableCell className={cn(td, "hidden lg:table-cell")}>
                      <div>{a.department}</div>
                      <div className="text-[0.65rem] text-muted-foreground">{a.plant}</div>
                    </TableCell>
                    <TableCell className={td}>
                      <div>{a.manufacturer}</div>
                      <div className="text-[0.65rem] text-muted-foreground">{a.model}</div>
                    </TableCell>
                    <TableCell className={td}>
                      <Badge variant={look.badge} className="rounded px-1.5 py-0 text-[0.65rem]">{look.label}</Badge>
                    </TableCell>
                    <TableCell className={cn(td, "hidden tabular-nums md:table-cell")}>{a.lastInspection || "—"}</TableCell>
                    <TableCell
                      className={cn(td, "tabular-nums", overdue && "font-semibold text-critical", upcoming && "font-semibold text-healthy-soft-foreground")}
                      title={overdue ? "Overdue" : upcoming ? `Due within ${UPCOMING_DAYS} days` : undefined}
                    >
                      {a.nextDue || "—"}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>

        {/* Empty state: says what happened and offers the next action */}
        {rows.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <Server className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium">No assets match these filters</p>
              <p className="text-xs text-muted-foreground">
                Try a different search term, or clear the filters to see all {register.length.toLocaleString("en-IN")}.
              </p>
            </div>
            <Button variant="outline" size="sm" className="mt-1 h-7 text-xs" onClick={reset}>
              <X className="size-3.5" /> Clear filters
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t px-3 py-2 text-[0.7rem]">
            <span className="flex flex-wrap items-center gap-x-4 gap-y-1 text-muted-foreground tabular-nums">
              <span>
              Showing <strong className="text-foreground">{start + 1}–{Math.min(start + pageSize, rows.length)}</strong> of{" "}
              <strong className="text-foreground">{rows.length.toLocaleString("en-IN")}</strong>
              </span>
              {/* Key for the row colours */}
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-critical-soft ring-1 ring-critical/40" /> Overdue
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2.5 rounded-sm bg-healthy-soft ring-1 ring-healthy/40" /> Due within {UPCOMING_DAYS} days
              </span>
            </span>

            <div className="flex items-center gap-2">
              <span className="text-muted-foreground">Rows</span>
              <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1) }}>
                <SelectTrigger size="sm" aria-label="Rows per page" className="h-6 w-14 text-[0.7rem]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SIZES.map((n) => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>

              <nav aria-label="Pagination" className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="size-6" onClick={() => setPage(current - 1)} disabled={current === 1} aria-label="Previous page">
                  <ChevronLeft className="size-3.5" />
                </Button>
                {/* 156 pages at 8 a page, so the middle collapses into gaps */}
                {pageList(current, pages).map((n, i) =>
                  n === "gap" ? (
                    <span key={`gap-${i}`} className="px-1 text-muted-foreground">…</span>
                  ) : (
                    <Button
                      key={n}
                      variant={n === current ? "default" : "ghost"}
                      size="icon"
                      // Grows with the number, so 3-digit pages stay inside the button
                      className="h-6 w-auto min-w-6 px-1.5 text-[0.7rem] tabular-nums"
                      onClick={() => setPage(n)}
                      aria-label={`Page ${n}`}
                      aria-current={n === current ? "page" : undefined}
                    >
                      {n}
                    </Button>
                  )
                )}
                <Button variant="ghost" size="icon" className="size-6" onClick={() => setPage(current + 1)} disabled={current === pages} aria-label="Next page">
                  <ChevronRight className="size-3.5" />
                </Button>
              </nav>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
