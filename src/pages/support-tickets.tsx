import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import type { DateRange } from "react-day-picker"
import { isAfter, isBefore, parse, startOfDay } from "date-fns"
import { FileText, Search, Sheet, TriangleAlert, X } from "lucide-react"
import { cn } from "cn"

import { DateRangeFilter, SortHead, TablePager } from "@/components/common/data-table"
import { PageHeader } from "@/components/common/page-header"
import { ReportIssueDialog } from "@/components/common/report-issue-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { plants } from "@/data/dashboard"
import { priorityTone } from "@/data/operations"
import { useTicketRows } from "@/data/ticket-store"
import { ticketCategories, type TicketRow } from "@/data/tickets"
import { control, nextSort, sortRows, td, th, type Sort } from "@/lib/data-table"
import { exportCsv, exportPdf, type ExportColumn } from "@/lib/table-export"
import { ticketStatuses, workStatus, type WorkStatus } from "@/lib/status"

const ANY = "all"

/** dd-MM-yyyy is what the rows carry; everything here compares real dates */
const parseDate = (d: string) => parse(d, "dd-MM-yyyy", new Date())

/** `dd-MM-yyyy HH:mm` → sortable number, newest largest */
const stamp = (mark: string) => {
  const [date, time = "00:00"] = mark.split(" ")
  const [d = "01", m = "01", y = "1970"] = date.split("-")
  return Number(`${y}${m}${d}${time.replace(":", "")}`)
}

type SortKey = "id" | "subject" | "category" | "plant" | "raisedBy" | "raised" | "lastUpdated" | "priority" | "status"

const priorityRank: Record<string, number> = { Low: 0, Medium: 1, High: 2, Critical: 3 }
/** Open before Closed: an outstanding ticket is the one being looked for */
const statusRank: Record<WorkStatus, number> = { open: 0, reopened: 1, pending: 2, in_progress: 3, assigned: 4, rejected: 5, completed: 6, closed: 7 }

const sortValue: Record<SortKey, (r: TicketRow) => string | number> = {
  id: (r) => r.id,
  subject: (r) => r.subject,
  category: (r) => r.category,
  plant: (r) => r.plant,
  raisedBy: (r) => r.raisedBy,
  raised: (r) => parseDate(r.raised).getTime(),
  lastUpdated: (r) => stamp(r.lastUpdated),
  priority: (r) => priorityRank[r.priority],
  status: (r) => statusRank[r.status],
}

/** Columns shared by the CSV and PDF exports, so both carry what the table shows */
const exportColumns: ExportColumn<TicketRow>[] = [
  { header: "Ticket ID", value: (r) => r.id },
  { header: "Subject", value: (r) => r.subject },
  { header: "Category", value: (r) => r.category },
  { header: "Plant", value: (r) => r.plant },
  { header: "Raised By", value: (r) => r.raisedBy },
  { header: "Raised From", value: (r) => r.source },
  { header: "Raised", value: (r) => r.raised },
  { header: "Last Updated", value: (r) => r.lastUpdated },
  { header: "Priority", value: (r) => r.priority },
  { header: "Status", value: (r) => workStatus[r.status].label },
  { header: "Linked Record", value: (r) => [r.assetId, r.inspectionId, r.maintenanceId].filter(Boolean).join(" ") },
]

/**
 * Support Tickets: everything this enterprise has raised with the OLIVINE
 * helpdesk, and where each one got to.
 *
 * The same ticket EVITA's Report an Issue raises and OCC's console answers -
 * one model across the three products, which is what the client asked for. The
 * difference is the surface. EVITA shows a card per issue, because on a tablet
 * what is being read is a short story and that does not sit across nine
 * columns. EMMS-E is a desk portal and already reads Tasks, Inspections and
 * Reports as tables, so tickets are a table too, with the same toolbar, sorting
 * and export as those screens. The story moves to the details page.
 *
 * A ticket is Open, In Progress or Completed - see `ticketStatuses`.
 * Whether the desk has started on it is the desk's business; what the
 * enterprise can act on is whether the ticket is still outstanding.
 */
export function SupportTicketsPage() {
  const navigate = useNavigate()
  const rows = useTicketRows()
  const [raising, setRaising] = useState(false)
  const [query, setQuery] = useState("")
  const [status, setStatus] = useState<WorkStatus | typeof ANY>(ANY)
  const [category, setCategory] = useState<string>(ANY)
  const [plant, setPlant] = useState(ANY)
  const [range, setRange] = useState<DateRange | undefined>()
  const [sort, setSort] = useState<Sort<SortKey>>(null)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const from = range?.from && startOfDay(range.from)
    const to = startOfDay(range?.to ?? range?.from ?? new Date(0))

    return rows.filter((r) => {
      if (status !== ANY && r.status !== status) return false
      if (category !== ANY && r.category !== category) return false
      if (plant !== ANY && r.plant !== plant) return false
      if (from) {
        const on = startOfDay(parseDate(r.raised))
        if (isBefore(on, from) || isAfter(on, to)) return false
      }
      // Search runs over everything the row shows, including its status wording
      if (!q) return true
      const haystack = [
        r.id,
        r.subject,
        r.category,
        r.plant,
        r.raisedBy,
        r.source,
        r.raised,
        r.priority,
        workStatus[r.status].label,
        r.assetId ?? "",
        r.inspectionId ?? "",
        r.maintenanceId ?? "",
      ]
      return haystack.some((f) => f.toLowerCase().includes(q))
    })
  }, [rows, query, status, category, plant, range])

  const sorted = useMemo(() => {
    /* Newest activity first by default: a ticket just raised or just answered is the one being looked for */
    if (!sort) return [...filtered].sort((a, b) => stamp(b.lastUpdated) - stamp(a.lastUpdated) || b.id.localeCompare(a.id))
    return sortRows(filtered, sort, sortValue)
  }, [filtered, sort])

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize))
  // Narrowing the results can strand the viewer past the last page, so clamp on read
  const current = Math.min(page, pages)
  const start = (current - 1) * pageSize
  const shown = sorted.slice(start, start + pageSize)

  const filtersOn = !!query || status !== ANY || category !== ANY || plant !== ANY || !!range?.from
  const clearFilters = () => {
    setQuery("")
    setStatus(ANY)
    setCategory(ANY)
    setPlant(ANY)
    setRange(undefined)
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="Support Tickets"
        description="Every issue this enterprise has raised with the OLIVINE helpdesk, and what came back."
        breadcrumbs={[{ label: "Support Tickets" }]}
        actions={
          <>
            <Button size="sm" className={control} onClick={() => setRaising(true)}>
              <TriangleAlert className="size-3.5" /> Report an Issue
            </Button>
            <Button variant="outline" size="sm" className={cn(control, "bg-card")} onClick={() => exportCsv("support-tickets", exportColumns, sorted)}>
              <Sheet className="size-3.5" /> Export CSV
            </Button>
            <Button variant="outline" size="sm" className={cn(control, "bg-card")} onClick={() => exportPdf("Support Tickets", exportColumns, sorted)}>
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
              placeholder="Search ticket, subject or reporter..."
              className={cn(control, "w-60 bg-card pl-7")}
            />
          </div>
          <div className="mx-auto flex flex-wrap items-center gap-2">
            <Select value={plant} onValueChange={(v) => { setPlant(v); setPage(1) }}>
              <SelectTrigger size="sm" className={cn(control, "w-40 bg-card")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All Plants</SelectItem>
                {plants.map((p) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={(v) => { setCategory(v); setPage(1) }}>
              <SelectTrigger size="sm" className={cn(control, "w-40 bg-card")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All Categories</SelectItem>
                {ticketCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v as typeof status); setPage(1) }}>
              <SelectTrigger size="sm" className={cn(control, "w-36 bg-card")}><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>All Statuses</SelectItem>
                {ticketStatuses.map((k) => <SelectItem key={k} value={k}>{workStatus[k].label}</SelectItem>)}
              </SelectContent>
            </Select>
            <DateRangeFilter label="Raised" range={range} onApply={(r) => { setRange(r); setPage(1) }} />
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
                <SortHead label="Ticket ID" column="id" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Subject" column="subject" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Category" column="category" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Plant" column="plant" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Raised By" column="raisedBy" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Raised" column="raised" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Last Updated" column="lastUpdated" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Priority" column="priority" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
                <SortHead label="Status" column="status" sort={sort} onSort={(c) => setSort(nextSort(sort, c))} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((r, i) => {
                const linked = [r.assetId, r.inspectionId, r.maintenanceId].filter(Boolean)
                return (
                  <TableRow key={r.id} onClick={() => navigate(`/support-tickets/${r.id}`)} className="cursor-pointer">
                    <TableCell className={cn(td, "tabular-nums text-muted-foreground")}>{start + i + 1}</TableCell>
                    <TableCell className={cn(td, "font-medium whitespace-nowrap")}>{r.id}</TableCell>
                    <TableCell className={cn(td, "max-w-72 min-w-56")}>
                      <span className="block truncate font-medium">{r.subject}</span>
                      {/* The record the ticket is about, so the row says what it concerns */}
                      {linked.length ? (
                        <span className="block truncate text-[0.65rem] tabular-nums text-muted-foreground">{linked.join(" · ")}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className={td}>{r.category}</TableCell>
                    <TableCell className={td}>{r.plant}</TableCell>
                    <TableCell className={cn(td, "whitespace-nowrap")}>
                      {r.raisedBy}
                      <span className="block text-[0.65rem] text-muted-foreground">from {r.source}</span>
                    </TableCell>
                    <TableCell className={cn(td, "tabular-nums whitespace-nowrap")}>{r.raised}</TableCell>
                    <TableCell className={cn(td, "tabular-nums whitespace-nowrap")}>{r.lastUpdated}</TableCell>
                    <TableCell className={td}>
                      <span className={cn("rounded px-1.5 py-0.5 text-[0.65rem] font-semibold", priorityTone[r.priority])}>{r.priority}</span>
                    </TableCell>
                    <TableCell className={td}>
                      <Badge variant={workStatus[r.status].badge} className="rounded px-1.5 py-0 text-[0.65rem]">
                        {workStatus[r.status].label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {sorted.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="py-8 text-center text-xs text-muted-foreground">
                    {rows.length ? "No ticket matches the filters." : "Nothing has been raised yet. Report an Issue opens one with the OLIVINE helpdesk."}
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

      <ReportIssueDialog open={raising} onOpenChange={setRaising} />
    </div>
  )
}
