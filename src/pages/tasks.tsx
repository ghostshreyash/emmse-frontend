import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router"
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
import { deleteTask, useTaskRows } from "@/data/task-store"
import { taskStatuses, type TaskRow } from "@/data/tasks"
import { control, nextSort, sortRows, td, th, type Sort } from "@/lib/data-table"
import { exportCsv, exportPdf, type ExportColumn } from "@/lib/table-export"
import { maintenanceStatus, workStatus, type WorkStatus } from "@/lib/status"

const look = (s: WorkStatus) => maintenanceStatus[s] ?? workStatus[s]

/** dd-MM-yyyy is what the rows carry; everything here compares real dates */
const parseDate = (d: string) => parse(d, "dd-MM-yyyy", new Date())

type SortKey = "id" | "plant" | "asset" | "type" | "inspectionId" | "elpremar" | "scheduled" | "status"

const statusRank: Record<WorkStatus, number> = { open: 0, pending: 1, rejected: 2, reopened: 3, assigned: 4, in_progress: 5, completed: 6, closed: 7 }

const sortValue: Record<SortKey, (r: TaskRow) => string | number> = {
  id: (r) => r.id,
  plant: (r) => r.plant,
  asset: (r) => r.asset,
  type: (r) => r.type,
  inspectionId: (r) => r.inspectionId ?? "",
  elpremar: (r) => r.elpremar,
  // Sort on the moment, not the text, so the interval breaks ties within a day
  scheduled: (r) => parseDate(r.scheduled).getTime() + r.slot / 100,
  status: (r) => statusRank[r.status],
}

/** Columns shared by the CSV and PDF exports, so both carry what the table shows */
const exportColumns: ExportColumn<TaskRow>[] = [
  { header: "Task ID", value: (r) => r.id },
  { header: "Plant", value: (r) => r.plant },
  { header: "Asset", value: (r) => r.asset },
  { header: "Type", value: (r) => r.type },
  { header: "Inspection", value: (r) => r.inspectionId ?? "" },
  { header: "ELPREMAR", value: (r) => r.elpremar },
  { header: "Scheduled", value: (r) => `${r.scheduled} ${slotLabel(r.slot)}` },
  { header: "Status", value: (r) => look(r.status).label },
]

/**
 * Tasks: the enterprise's maintenance activities across its plants, ported from the
 * OCC Maintenance Activities screen. OCC sees every enterprise, so its Enterprise
 * column and filter become a Plant filter here.
 */
export function TasksPage() {
  const navigate = useNavigate()
  const rows = useTaskRows()
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<WorkStatus | "all">("all")
  /** The Open task waiting on a delete confirmation */
  const [deleting, setDeleting] = useState<TaskRow | null>(null)
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
        const on = startOfDay(parseDate(r.scheduled))
        if (isBefore(on, from) || isAfter(on, to)) return false
      }
      // Search runs over everything the row shows, including its status wording and interval
      if (!q) return true
      const haystack = [r.id, r.plant, r.asset, r.type, r.inspectionId ?? "", r.elpremar, r.scheduled, slotLabel(r.slot), look(r.status).label]
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
        title="Maintenance Tasks"
        breadcrumbs={[{ label: "Maintenance Tasks" }]}
        actions={
          <>
            <Button size="sm" className={control} asChild>
              <Link to="/tasks/add"><Plus className="size-3.5" /> Add Maintenance Task</Link>
            </Button>
            <Button variant="outline" size="sm" className={cn(control, "bg-card")} onClick={() => exportCsv("maintenance-tasks", exportColumns, sorted)}>
              <Sheet className="size-3.5" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className={cn(control, "bg-card")} onClick={() => exportPdf("Maintenance Tasks", exportColumns, sorted)}>
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
            <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(1) }}>
              <SelectTrigger size="sm" className={cn(control, "w-40 bg-card")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                {taskStatuses.map((k) => <SelectItem key={k} value={k}>{look(k).label}</SelectItem>)}
              </SelectContent>
            </Select>
            <DateRangeFilter label="Scheduled" range={range} onApply={(r) => { setRange(r); setPage(1) }} />
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
                <SortHead label="Task ID" column="id" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Plant" column="plant" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Asset" column="asset" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Type" column="type" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Inspection" column="inspectionId" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="ELPREMAR" column="elpremar" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Scheduled" column="scheduled" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Status" column="status" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((r, i) => (
                <TableRow key={r.id} onClick={() => navigate(`/tasks/${r.id}`)} className="cursor-pointer">
                  <TableCell className={cn(td, "tabular-nums text-muted-foreground")}>{start + i + 1}</TableCell>
                  <TableCell className={cn(td, "font-medium whitespace-nowrap")}>{r.id}</TableCell>
                  <TableCell className={td}>{r.plant}</TableCell>
                  <TableCell className={cn(td, "font-medium")}>{r.asset}</TableCell>
                  <TableCell className={td}>{r.type}</TableCell>
                  <TableCell className={cn(td, "whitespace-nowrap")} onClick={(e) => e.stopPropagation()}>
                    {r.inspectionId ? (
                      <Link to={`/inspection-activities/${r.inspectionId}`} className="tabular-nums text-primary hover:underline">
                        {r.inspectionId}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </TableCell>
                  <TableCell className={td}>{r.elpremar}</TableCell>
                  <TableCell className={cn(td, "tabular-nums whitespace-nowrap")}>
                    {r.scheduled}
                    <span className="block text-[0.65rem] text-muted-foreground">{slotLabel(r.slot)}</span>
                  </TableCell>
                  <TableCell className={td} onClick={(e) => r.status === "open" && e.stopPropagation()}>
                    <span className="flex items-center gap-1.5">
                      <Badge variant={look(r.status).badge} className="rounded px-1.5 py-0 text-[0.65rem]">{look(r.status).label}</Badge>
                      {/* Only a task that has not started can be deleted */}
                      {r.status === "open" ? (
                        <DeleteRowButton id={r.id} onClick={() => setDeleting(r)} />
                      ) : null}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-xs text-muted-foreground">
                    No maintenance tasks match the filters.
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
        summary={deleting ? `${deleting.type} on ${deleting.asset}, ${deleting.plant}, scheduled ${deleting.scheduled}` : undefined}
        onCancel={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting && deleteTask(deleting.id)) toast.success(`${deleting.id} deleted`)
          setDeleting(null)
        }}
      />
    </div>
  )
}
