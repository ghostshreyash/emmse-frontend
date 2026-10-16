import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { ArrowLeft, Download, Eye, FileText, Gauge, HardDrive, ListChecks, Thermometer } from "lucide-react"
import { cn } from "cn"

import { ActivityTotalCards } from "@/components/common/activity-totals"
import { Detail } from "@/components/common/detail-view"
import { DocumentDialog, type OpenDocument } from "@/components/common/document-dialog"
import { PageHeader } from "@/components/common/page-header"
import { SectionCard } from "@/components/common/section-card"
import { AssetDustTrend, AssetScoreTrend, MaintenanceTrend } from "@/components/common/trend-charts"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { healthBandFor } from "@/data/master-data"
import { criticalityTone } from "@/data/operations"
import { reportDocuments, type ReportDocument, type ReportKind } from "@/data/report-documents"
import {
  activityTotals,
  assetDustTrend,
  assetMaintenanceTrend,
  assetReportHistory,
  assetScoreTrend,
  inspectionsInWindow,
  type ReportHistoryEntry,
} from "@/data/report-trends"
import { contaminationTone, findingLook, findReport } from "@/data/reports"
import { control, td, th } from "@/lib/data-table"
import { healthStatus } from "@/lib/status"

const ANY = "all"

/**
 * Which activity a report came off.
 *
 * Every report here traces back to one of two things an ELPREMAR did: the
 * inspection that produced the readings, or the maintenance that produced the
 * before-and-after. That is what the Activity column says and what the filter
 * on the card cuts on.
 */
const sources = ["Inspection", "Maintenance"] as const
type Source = (typeof sources)[number]

/** The three documents by kind, so a history entry can name its own one */
const documentFor = Object.fromEntries(reportDocuments.map((d) => [d.kind, d])) as Record<ReportKind, ReportDocument>

/**
 * One asset's report record: what the register holds about it, every report
 * raised against it, what each one said, and how it has moved over six months.
 *
 * The reports are a table because each row carries more than a document name:
 * which activity produced it, what type that activity was, who carried it out,
 * when, and when the next one falls due. Those used to sit in three cards down
 * the side - Read Off Inspection, Cleaning, Inspection Schedule - which meant
 * reading a report in one place and its provenance in another.
 *
 * And it is the whole history rather than the latest three, newest first: an
 * asset's record is the run of readings, and a single contamination report says
 * nothing about whether the panel is getting better or worse. The current
 * reading is the row marked Latest - that is the one the cards, the charts and
 * the two report panels below are showing.
 */
export function ReportDetailsPage() {
  const { assetId } = useParams()
  const navigate = useNavigate()
  const [open, setOpen] = useState<OpenDocument | null>(null)
  const [source, setSource] = useState<Source | typeof ANY>(ANY)
  const row = findReport(assetId)

  if (!row) {
    return (
      <div>
        <PageHeader
          title="Asset Report"
          breadcrumbs={[{ label: "Reports & Analytics", to: "/reports" }, { label: assetId ?? "Unknown" }]}
        />
        <SectionCard title="Not found" hoverable={false}>
          <p className="py-6 text-center text-xs text-muted-foreground">
            No report for asset <span className="font-medium text-foreground">{assetId}</span>.{" "}
            <Link to="/reports" className="text-primary hover:underline">Back to the list</Link>
          </p>
        </SectionCard>
      </div>
    )
  }

  const { asset, maintenance } = row
  const band = healthBandFor(row.healthScore)

  /* Seeded off the asset, so its trends and totals do not move between visits */
  const scoreTrend = assetScoreTrend(row)
  const dustTrend = assetDustTrend(row)
  const maintenanceMonths = assetMaintenanceTrend(row)
  const totals = activityTotals(maintenanceMonths, inspectionsInWindow(row.frequency))

  /*
   * Every report this asset has, newest first - two off each inspection and one
   * off each clean - rather than only its latest three. The entries marked
   * `latest` are the ones the figures elsewhere on this screen belong to.
   */
  const history = assetReportHistory(row)

  const shown = history.filter((entry) => source === ANY || entry.source === source)

  /*
   * An asset with no clean yet holds no cleaning report, so the history has no
   * row for one. Keep a line saying so rather than letting the document go
   * missing without explanation - the record reads as three kinds of report
   * with one outstanding.
   */
  const awaitingClean = !maintenance && (source === ANY || source === "Maintenance")

  const openReport = (document: ReportDocument) =>
    setOpen({
      title: document.title,
      file: document.file,
      detail: `${asset.tagId} · ${document.detail}`,
      fileName: document.fileName(asset.tagId),
    })

  /** Nothing recorded against this column for this report */
  const none = <span className="text-muted-foreground/60">—</span>

  return (
    <div>
      <PageHeader
        title={asset.name}
        description={`${asset.tagId} · ${asset.plant}`}
        breadcrumbs={[{ label: "Reports & Analytics", to: "/reports" }, { label: asset.tagId }]}
        actions={
          <Button variant="outline" size="sm" className={control} onClick={() => navigate("/reports")}>
            <ArrowLeft className="size-3.5" /> Back to list
          </Button>
        }
      />

      {/* What has been carried out on this asset over the window the charts cover */}
      <ActivityTotalCards totals={totals} />

      <div className="mb-4 grid gap-4 lg:grid-cols-[1fr_18rem]">
        {/* ---------- Everything the register holds ---------- */}
        <SectionCard title="Asset Details" icon={<HardDrive className="size-4 text-primary" />} hoverable={false}>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
            <Detail label="Asset ID"><span className="font-medium tabular-nums">{asset.tagId}</span></Detail>
            <Detail label="Asset Name"><span className="font-medium">{asset.name}</span></Detail>
            <Detail label="Asset Category">{asset.category}</Detail>
            <Detail label="Plant">{asset.plant}</Detail>
            <Detail label="Department">{asset.department}</Detail>
            <Detail label="Sub-Department">{asset.subDepartment}</Detail>
            <Detail label="Manufacturer">{asset.manufacturer}</Detail>
            <Detail label="Model">{asset.model}</Detail>
            <Detail label="Serial Number"><span className="tabular-nums">{asset.serial}</span></Detail>
            <Detail label="Asset Criticality">
              <span className={cn("rounded px-1.5 py-0.5 text-[0.65rem] font-semibold", criticalityTone[asset.criticality])}>
                {asset.criticality}
              </span>
            </Detail>
            <Detail label="Commissioned On"><span className="tabular-nums">{asset.commissionedOn}</span></Detail>
            {/* The cycle the Next Due column in the reports table follows from */}
            <Detail label="Inspection Frequency">Every {row.frequency} months</Detail>
          </div>
        </SectionCard>

        <SectionCard title="Health Score" icon={<Gauge className="size-4 text-primary" />} hoverable={false}>
          <div className={cn("flex items-center justify-between gap-3 rounded-lg px-3 py-2.5", healthStatus[band.tone].tile)}>
            <span className="text-sm font-semibold">{band.label}</span>
            <span className="text-2xl leading-none font-bold tabular-nums">{row.healthScore}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Out of 100, from the Contamination Report. Refreshed from the daily extraction of the inspection
            reports, so it moves when a new inspection is submitted.
          </p>
        </SectionCard>
      </div>

      {/* ---------- The documents, and the activity behind each ---------- */}
      <SectionCard
        title="Reports"
        icon={<FileText className="size-4 text-primary" />}
        hoverable={false}
        className="mb-4"
        contentClassName="px-2 pb-2"
        actions={
          <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
            <SelectTrigger size="sm" aria-label="Filter by activity" className={cn(control, "w-36 bg-card")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>All Activities</SelectItem>
              {sources.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        }
      >
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/60 hover:bg-muted/60">
                <TableHead className={th}>Report</TableHead>
                <TableHead className={th}>Activity</TableHead>
                <TableHead className={th}>Activity ID</TableHead>
                <TableHead className={th}>Type</TableHead>
                <TableHead className={th}>Carried Out By</TableHead>
                <TableHead className={th}>Reported On ↓</TableHead>
                <TableHead className={th}>Next Due</TableHead>
                <TableHead className={th}>Finding</TableHead>
                <TableHead className={cn(th, "text-right")}>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((entry) => {
                const document = documentFor[entry.kind]
                return (
                  <TableRow key={entry.id}>
                    <TableCell className={cn(td, "min-w-52")}>
                      <span className="flex items-center gap-2">
                        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-critical-soft text-critical">
                          <FileText className="size-3.5" />
                        </span>
                        <span className="min-w-0">
                          <span className="flex items-center gap-1.5">
                            <span className="font-medium">{document.title}</span>
                            {/* The reading the rest of the screen is showing came off this one */}
                            {entry.latest ? (
                              <Badge variant="success" className="rounded px-1 py-0 text-[0.6rem]">Latest</Badge>
                            ) : null}
                          </span>
                          <span className="block truncate text-[0.65rem] text-muted-foreground">{document.detail}</span>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className={td}>
                      <Badge
                        variant={entry.source === "Inspection" ? "info" : "highlight"}
                        className="rounded px-1.5 py-0 text-[0.65rem]"
                      >
                        {entry.source}
                      </Badge>
                    </TableCell>
                    <TableCell className={cn(td, "whitespace-nowrap")}>
                      <Link to={entry.activityTo} className="font-medium tabular-nums text-primary hover:underline">
                        {entry.activityId}
                      </Link>
                    </TableCell>
                    <TableCell className={td}>{entry.activityType}</TableCell>
                    <TableCell className={td}>{entry.by}</TableCell>
                    <TableCell className={cn(td, "tabular-nums whitespace-nowrap")}>{entry.on}</TableCell>
                    <TableCell className={cn(td, "tabular-nums whitespace-nowrap")}>{entry.nextDue}</TableCell>
                    <TableCell className={cn(td, "whitespace-nowrap")}><Finding entry={entry} /></TableCell>
                    <TableCell className={cn(td, "text-right whitespace-nowrap")}>
                      <span className="inline-flex items-center gap-1.5">
                        <Button variant="outline" size="xs" className="bg-card" onClick={() => openReport(document)}>
                          <Eye className="size-3" /> View
                        </Button>
                        <Button variant="outline" size="xs" className="bg-card" asChild>
                          <a href={document.file} download={document.fileName(asset.tagId)}>
                            <Download className="size-3" /> Download
                          </a>
                        </Button>
                      </span>
                    </TableCell>
                  </TableRow>
                )
              })}

              {/* The document this asset has not earned yet */}
              {awaitingClean ? (
                <TableRow>
                  <TableCell className={cn(td, "min-w-52")}>
                    <span className="flex items-center gap-2">
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                        <FileText className="size-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium">{documentFor.cleaning.title}</span>
                        <span className="block truncate text-[0.65rem] text-muted-foreground">
                          Raised once this asset has been cleaned
                        </span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className={td}>
                    <Badge variant="neutral" className="rounded px-1.5 py-0 text-[0.65rem]">Maintenance</Badge>
                  </TableCell>
                  <TableCell className={td} colSpan={5}>{none}</TableCell>
                  <TableCell className={cn(td, "whitespace-nowrap")}>
                    <Badge variant="neutral" className="rounded px-1.5 py-0 text-[0.65rem]">Not cleaned yet</Badge>
                  </TableCell>
                  <TableCell className={cn(td, "text-right whitespace-nowrap")}>
                    <span className="text-[0.7rem] text-muted-foreground">Raised once cleaned</span>
                  </TableCell>
                </TableRow>
              ) : null}

              {!shown.length && !awaitingClean ? (
                <TableRow>
                  <TableCell colSpan={9} className="py-8 text-center text-xs text-muted-foreground">
                    No report on this asset came off a {source.toLowerCase()}.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      {/*
       * ---------- The same three trends, for this asset alone ----------
       *
       * The estate charts on the Reports screen count assets across bands; one
       * asset has a reading rather than a distribution, so the first two are its
       * own score and its own dust. The maintenance chart is the same one,
       * counting only this asset's jobs - mostly empty months, which is the
       * honest picture of how often a panel is touched.
       */}
      <div className="mb-4 grid gap-3 xl:grid-cols-3">
        <AssetScoreTrend data={scoreTrend} />
        <AssetDustTrend data={dustTrend} />
        <MaintenanceTrend data={maintenanceMonths} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ---------- What the Contamination Report says ---------- */}
        <SectionCard title="Contamination Report" icon={<Thermometer className="size-4 text-primary" />} hoverable={false}>
          <p className="mb-3 text-xs text-muted-foreground">
            Scored from dust thickness, dust type and hotspot temperature read off the inspection. This is the
            report that produces the Health Score.
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            <Detail label="Contamination Level">
              <span className={cn("rounded px-1.5 py-0.5 text-[0.65rem] font-semibold", contaminationTone[row.contamination])}>
                {row.contamination}
              </span>
            </Detail>
            <Detail label="Status">
              <Badge variant={findingLook[row.contaminationStatus].badge} className="rounded px-1.5 py-0 text-[0.65rem]">
                {row.contaminationStatus}
              </Badge>
            </Detail>
            <Detail label="Dust Thickness"><span className="tabular-nums">{row.dustThickness} mm</span></Detail>
            <Detail label="Hotspot Temperature"><span className="tabular-nums">{row.hotspot} °C</span></Detail>
          </div>
        </SectionCard>

        {/* ---------- What the Hygiene Report says ---------- */}
        <SectionCard title="Hygiene Report" icon={<ListChecks className="size-4 text-primary" />} hoverable={false}>
          <p className="mb-2 text-xs text-muted-foreground">
            Point-specific and independent of the score: the physical condition of the panel, one line per
            Phase-1 parameter. {row.hygieneOpen
              ? `${row.hygieneOpen} of ${row.hygiene.length} points need something doing.`
              : "Every point is clear."}
          </p>
          <ul className="divide-y divide-foreground/10 text-xs">
            {row.hygiene.map((point) => (
              <li key={point.check} className="flex items-center justify-between gap-3 py-1.5">
                <span className="flex min-w-0 items-center gap-2">
                  <span aria-hidden className={cn("size-2 shrink-0 rounded-full", findingLook[point.finding].dot)} />
                  <span className="truncate">{point.check}</span>
                </span>
                <Badge variant={findingLook[point.finding].badge} className="shrink-0 rounded px-1.5 py-0 text-[0.65rem]">
                  {point.finding}
                </Badge>
              </li>
            ))}
          </ul>
        </SectionCard>
      </div>

      <DocumentDialog document={open} onClose={() => setOpen(null)} />
    </div>
  )
}

/**
 * What one report said about the asset, in the wording its own kind uses: the
 * contamination report scores, the hygiene report counts points, and a cleaning
 * report either happened or has not yet.
 */
function Finding({ entry }: { entry: ReportHistoryEntry }) {
  if (entry.kind === "contamination" && entry.status && entry.level) {
    return (
      <span className="flex items-center gap-1.5">
        <span className={cn("rounded px-1.5 py-0.5 text-[0.65rem] font-semibold", contaminationTone[entry.level])}>
          {entry.level}
        </span>
        <span className="text-[0.7rem] text-muted-foreground">
          {entry.status} · <span className="tabular-nums">{entry.score}</span>
        </span>
      </span>
    )
  }
  if (entry.kind === "hygiene") {
    const open = entry.hygieneOpen ?? 0
    return (
      <Badge
        variant={open > 2 ? "critical" : open ? "attention" : "healthy"}
        className="rounded px-1.5 py-0 text-[0.65rem]"
      >
        {open ? `${open} of 8 open` : "All points clear"}
      </Badge>
    )
  }
  return <Badge variant="success" className="rounded px-1.5 py-0 text-[0.65rem]">Cleaned</Badge>
}
