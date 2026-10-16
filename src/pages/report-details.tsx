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
import { hasReport, reportDocuments, type ReportDocument } from "@/data/report-documents"
import {
  activityTotals,
  assetDustTrend,
  assetMaintenanceTrend,
  assetScoreTrend,
  inspectionsInWindow,
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

/** One line of the reports table: a document, and the activity behind it */
type ReportLine = {
  document: ReportDocument
  source: Source
  /** The Inspection ID or Task ID, and the screen it opens */
  activityId?: string
  activityTo?: string
  activityType?: string
  by?: string
  on?: string
  nextDue?: string
  /** What the report says about this asset, as a pill */
  finding: React.ReactNode
  available: boolean
}

/**
 * One asset's report record: what the register holds about it, the documents
 * against it, what each one says, and how it has moved over six months.
 *
 * The three documents are a table rather than a list, because each carries more
 * than its own name: which activity produced it, what type that activity was,
 * who carried it out, when, and when the next one falls due. Those used to sit
 * in three cards down the side - Read Off Inspection, Cleaning, Inspection
 * Schedule - which meant reading a report in one place and its provenance in
 * another. One row per report says it once, beside the report it belongs to.
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

  const { asset, maintenance, inspection } = row
  const band = healthBandFor(row.healthScore)

  /* Seeded off the asset, so its trends and totals do not move between visits */
  const scoreTrend = assetScoreTrend(row)
  const dustTrend = assetDustTrend(row)
  const maintenanceMonths = assetMaintenanceTrend(row)
  const totals = activityTotals(maintenanceMonths, inspectionsInWindow(row.frequency))

  /**
   * The three documents, each with the activity it came off.
   *
   * Contamination and hygiene are both read off the same inspection, so they
   * carry the same Inspection ID and the same next-due date. That is the point
   * of the column rather than a duplication to tidy away: the two reports are
   * one visit's worth of findings.
   */
  const lines: ReportLine[] = reportDocuments.map((document) => {
    const isClean = document.kind === "cleaning"
    const available = hasReport(document.kind, !!maintenance)

    const finding =
      document.kind === "contamination" ? (
        <span className={cn("rounded px-1.5 py-0.5 text-[0.65rem] font-semibold", contaminationTone[row.contamination])}>
          {row.contamination} · {row.contaminationStatus}
        </span>
      ) : document.kind === "hygiene" ? (
        <Badge variant={findingLook[row.hygieneStatus].badge} className="rounded px-1.5 py-0 text-[0.65rem]">
          {row.hygieneOpen ? `${row.hygieneOpen} of ${row.hygiene.length} open` : "All points clear"}
        </Badge>
      ) : (
        <Badge variant={available ? "success" : "neutral"} className="rounded px-1.5 py-0 text-[0.65rem]">
          {available ? "Cleaned" : "Not cleaned yet"}
        </Badge>
      )

    return isClean
      ? {
          document,
          source: "Maintenance",
          activityId: maintenance?.id,
          activityTo: maintenance && `/tasks/${maintenance.id}`,
          activityType: maintenance?.type,
          by: maintenance?.elpremar,
          on: maintenance?.on,
          nextDue: row.nextCleaningDue || undefined,
          finding,
          available,
        }
      : {
          document,
          source: "Inspection",
          activityId: inspection.id,
          activityTo: `/inspection-activities/${inspection.id}`,
          activityType: inspection.activity,
          by: inspection.elpremar,
          on: inspection.on,
          nextDue: row.nextInspectionDue,
          finding,
          available,
        }
  })

  const shown = lines.filter((line) => source === ANY || line.source === source)

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
                <TableHead className={th}>Reported On</TableHead>
                <TableHead className={th}>Next Due</TableHead>
                <TableHead className={th}>Finding</TableHead>
                <TableHead className={cn(th, "text-right")}>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.map((line) => (
                <TableRow key={line.document.kind}>
                  <TableCell className={cn(td, "min-w-52")}>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex size-7 shrink-0 items-center justify-center rounded-lg",
                          line.available ? "bg-critical-soft text-critical" : "bg-muted text-muted-foreground"
                        )}
                      >
                        <FileText className="size-3.5" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-medium">{line.document.title}</span>
                        <span className="block truncate text-[0.65rem] text-muted-foreground">{line.document.detail}</span>
                      </span>
                    </span>
                  </TableCell>
                  <TableCell className={td}>
                    <Badge
                      variant={line.source === "Inspection" ? "info" : "highlight"}
                      className="rounded px-1.5 py-0 text-[0.65rem]"
                    >
                      {line.source}
                    </Badge>
                  </TableCell>
                  <TableCell className={cn(td, "whitespace-nowrap")}>
                    {line.activityId && line.activityTo ? (
                      <Link to={line.activityTo} className="font-medium tabular-nums text-primary hover:underline">
                        {line.activityId}
                      </Link>
                    ) : (
                      none
                    )}
                  </TableCell>
                  <TableCell className={td}>{line.activityType ?? none}</TableCell>
                  <TableCell className={td}>{line.by ?? none}</TableCell>
                  <TableCell className={cn(td, "tabular-nums whitespace-nowrap")}>{line.on ?? none}</TableCell>
                  <TableCell className={cn(td, "tabular-nums whitespace-nowrap")}>{line.nextDue ?? none}</TableCell>
                  <TableCell className={cn(td, "whitespace-nowrap")}>{line.finding}</TableCell>
                  <TableCell className={cn(td, "text-right whitespace-nowrap")}>
                    {line.available ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Button variant="outline" size="xs" className="bg-card" onClick={() => openReport(line.document)}>
                          <Eye className="size-3" /> View
                        </Button>
                        <Button variant="outline" size="xs" className="bg-card" asChild>
                          <a href={line.document.file} download={line.document.fileName(asset.tagId)}>
                            <Download className="size-3" /> Download
                          </a>
                        </Button>
                      </span>
                    ) : (
                      <span className="text-[0.7rem] text-muted-foreground">Raised once cleaned</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {shown.length === 0 ? (
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
