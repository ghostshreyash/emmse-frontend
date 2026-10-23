import { useMemo, useState } from "react"
import { Link } from "react-router"
import type { DateRange } from "react-day-picker"
import { isAfter, isBefore, parse, startOfDay } from "date-fns"
import { FileText, Plus, Search, Sheet, X } from "lucide-react"
import { toast } from "sonner"
import { cn } from "cn"

import { DateRangeFilter, SortHead, TablePager } from "@/components/common/data-table"
import { ConfirmDelete, DeleteRowButton } from "@/components/common/confirm-delete"
import { PageHeader } from "@/components/common/page-header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { plants } from "@/data/dashboard"
import { slotLabel } from "@/data/operations"
import { deleteVisit, useVisitRows, visitStatusOrder, type VisitRow } from "@/data/visit-store"
import { control, nextSort, sortRows, td, th, type Sort } from "@/lib/data-table"
import { exportCsv, exportPdf, type ExportColumn } from "@/lib/table-export"
import { inspectionStatus, workStatus, type WorkStatus } from "@/lib/status"

// A visit reads its states the way an inspection does: Open, In Progress, Completed
const look = (s: WorkStatus) => inspectionStatus[s] ?? workStatus[s]

/** dd-MM-yyyy is what the rows carry; everything here compares real dates */
const parseDate = (d: string) => parse(d, "dd-MM-yyyy", new Date())

type SortKey = "id" | "plant" | "area" | "asset" | "elpremar" | "date" | "status"

const statusRank: Record<WorkStatus, number> = { open: 0, pending: 1, rejected: 2, reopened: 3, assigned: 4, in_progress: 5, completed: 6, closed: 7 }

const sortValue: Record<SortKey, (r: VisitRow) => string | number> = {
  id: (r) => r.id,
  plant: (r) => r.plant,
  area: (r) => r.area,
  asset: (r) => r.assetTag,
  elpremar: (r) => r.elpremar,
  // Sort on the moment, not the text, so the interval breaks ties within a day
  date: (r) => parseDate(r.date).getTime() + r.slot / 100,
  status: (r) => statusRank[r.status],
}

const activitiesOf = (r: VisitRow) => (r.activities.length ? r.activities.join(", ") : "-")

/** Columns shared by the CSV and PDF exports, so both carry what the table shows */
const exportColumns: ExportColumn<VisitRow>[] = [
  { header: "Visit ID", value: (r) => r.id },
  { header: "Plant", value: (r) => r.plant },
  { header: "Location / Area", value: (r) => r.area },
  { header: "Asset ID", value: (r) => r.assetTag },
  { header: "Asset Name", value: (r) => r.asset },
  { header: "Asset Category", value: (r) => r.category },
  { header: "Activity Type", value: activitiesOf },
  { header: "ELPREMAR", value: (r) => r.elpremar },
  { header: "Scheduled", value: (r) => `${r.date} ${slotLabel(r.slot)}` },
  { header: "Duration", value: (r) => r.duration },
  { header: "Priority", value: (r) => r.priority },
  { header: "Status", value: (r) => look(r.status).label },
]

/**
 * Schedule a Visit: every visit booked to an ELPREMAR across the enterprise's
 * plants, laid out like the Inspections list. Add Visit uses the Add Inspection form.
 */
export function VisitsPage() {
  const rows = useVisitRows()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<WorkStatus | "all">("all")
  /** The Open visit waiting on a delete confirmation */
  const [deleting, setDeleting] = useState<VisitRow | null>(null)
  const [plant, setPlant] = useState("all")
  const [range, setRange] = useState<DateRange | undefined>()
  const [sort, setSort] = useState<Sort<SortKey>>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const from = range?.from && startOfDay(range.from)
    const to = startOfDay(range?.to ?? range?.from ?? new Date(0))

    return rows.filter((r) => {
      if (status !== "all" && r.status !== status) return false
      if (plant !== "all" && r.plant !== plant) return false
      if (from) {
        const on = startOfDay(parseDate(r.date))
        if (isBefore(on, from) || isAfter(on, to)) return false
      }
      // Search runs over everything the row shows, including its status wording and interval
      if (!q) return true
      const haystack = [r.id, r.plant, r.area, r.assetTag, r.asset, r.category, activitiesOf(r), r.elpremar, r.date, slotLabel(r.slot), look(r.status).label]
      return haystack.some((f) => f.toLowerCase().includes(q))
    })
  }, [rows, query, status, plant, range])

  const sorted = useMemo(() => sortRows(filtered, sort, sortValue), [filtered, sort])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  // Narrowing the results can strand the viewer past the last page, so clamp on read
  const current = Math.min(page, pages)
  const start = (current - 1) * pageSize
  const shown = sorted.slice(start, start + pageSize)

  const filtersOn = !!query || status !== "all" || plant !== "all" || !!range?.from
  const clearFilters = () => {
    setQuery("")
    setStatus("all")
    setPlant("all")
    setRange(undefined)
  }

  return (
    <div>
      <PageHeader
        title="Schedule a Visit"
        breadcrumbs={[{ label: "Schedule a Visit" }]}
        actions={
          <>
            <Button size="sm" className={control} asChild>
              <Link to="/visits/add"><Plus className="size-3.5" /> Add Visit</Link>
            </Button>
            <Button variant="outline" size="sm" className={cn(control, "bg-card")} onClick={() => exportCsv("visits", exportColumns, sorted)}>
              <Sheet className="size-3.5" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className={cn(control, "bg-card")} onClick={() => exportPdf("Scheduled Visits", exportColumns, sorted)}>
              <FileText className="size-3.5" /> Export PDF
            </Button>
          </>
        }
      />

      <section className="flex flex-col rounded-lg bg-card text-card-foreground shadow-xs ring-1 ring-foreground/10">
        {/* Search hard left, filters centred, clear hard right */}
        <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
          <div className="relative">
            <Search className="absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => { setQuery(e.target.value); setPage(1) }}
              placeholder="Search here..."
              className={cn(control, "w-60 bg-card pl-7")}
            />
          </div>
          <div className="mx-auto flex flex-wrap items-center gap-2">
            <Select value={plant} onValueChange={(v) => { setPlant(v); setPage(1) }}>
              <SelectTrigger size="sm" className={cn(control, "w-44 bg-card")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plants</SelectItem>
                {plants.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <DateRangeFilter label="Scheduled" range={range} onApply={(r) => { setRange(r); setPage(1) }} />
            <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(1) }}>
              <SelectTrigger size="sm" className={cn(control, "w-40 bg-card")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {visitStatusOrder.map((k) => <SelectItem key={k} value={k}>{look(k).label}</SelectItem>)}
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
                <SortHead label="Visit ID" column="id" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Plant" column="plant" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Location / Area" column="area" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Asset" column="asset" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <TableHead className={th}>Activity Type</TableHead>
                <SortHead label="ELPREMAR" column="elpremar" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Scheduled" column="date" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Status" column="status" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((r, i) => (
                <TableRow key={r.id}>
                  <TableCell className={cn(td, "tabular-nums text-muted-foreground")}>{start + i + 1}</TableCell>
                  <TableCell className={cn(td, "font-medium whitespace-nowrap")}>{r.id}</TableCell>
                  <TableCell className={td}>{r.plant}</TableCell>
                  <TableCell className={td}>{r.area}</TableCell>
                  <TableCell className={td}>
                    <span className="font-medium tabular-nums">{r.assetTag}</span>
                    <span className="block text-[0.65rem] text-muted-foreground">{r.asset} · {r.category}</span>
                  </TableCell>
                  <TableCell className={td}>{activitiesOf(r)}</TableCell>
                  <TableCell className={td}>{r.elpremar}</TableCell>
                  <TableCell className={cn(td, "tabular-nums whitespace-nowrap")}>
                    {r.date}
                    <span className="block text-[0.65rem] text-muted-foreground">{slotLabel(r.slot)}</span>
                  </TableCell>
                  <TableCell className={td}>
                    <span className="flex items-center gap-1.5">
                      <Badge variant={look(r.status).badge} className="rounded px-1.5 py-0 text-[0.65rem]">{look(r.status).label}</Badge>
                      {/* Only a visit that has not started can be deleted */}
                      {r.status === "pending" ? <DeleteRowButton id={r.id} onClick={() => setDeleting(r)} /> : null}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-xs text-muted-foreground">
                    No visits match the filters.
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

      <ConfirmDelete
        id={deleting?.id}
        summary={deleting ? `Visit to ${deleting.area}, ${deleting.plant}, on ${deleting.date}` : undefined}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting && deleteVisit(deleting.id)) toast.success(`${deleting.id} deleted`)
          setDeleting(null)
        }}
      />
    </div>
  )
}
