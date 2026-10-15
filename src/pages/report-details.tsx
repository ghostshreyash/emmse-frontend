import { useState } from "react"
import { Link, useNavigate, useParams } from "react-router"
import { ArrowLeft, CalendarClock, ClipboardCheck, Download, Eye, FileText, Gauge, HardDrive, ListChecks, Thermometer, Wrench } from "lucide-react"
import { cn } from "cn"

import { Detail } from "@/components/common/detail-view"
import { DocumentDialog, type OpenDocument } from "@/components/common/document-dialog"
import { PageHeader } from "@/components/common/page-header"
import { SectionCard } from "@/components/common/section-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { healthBandFor } from "@/data/master-data"
import { criticalityTone } from "@/data/operations"
import { hasReport, reportDocuments, type ReportDocument } from "@/data/report-documents"
import { contaminationTone, findingLook, findReport, type ReportRow } from "@/data/reports"
import { control } from "@/lib/data-table"
import { healthStatus } from "@/lib/status"

/**
 * One asset's report record: everything the register holds about the asset, the
 * figures behind each report, and the three documents themselves.
 *
 * The client asked for the asset's full detail on this screen with the report
 * beside it, which is what the layout is: the asset and the documents first,
 * then what each report actually says - the contamination figures that produced
 * the Health Score, and the hygiene checklist, which carries no score of its
 * own and is only ever point-specific.
 *
 * Every document opens in the reader rather than a tab, and carries a Download
 * of its own. Nothing is generated here: the PDFs are OLIVINE's samples until
 * the reporting service exists - see data/report-documents.
 */
export function ReportDetailsPage() {
  const { assetId } = useParams()
  const navigate = useNavigate()
  const [open, setOpen] = useState<OpenDocument | null>(null)
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

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-4">
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
              <Detail label="Health Score">
                <span className="flex items-center gap-1.5">
                  <span aria-hidden className={cn("size-2 shrink-0 rounded-full", healthStatus[band.tone].dot)} />
                  <span className="font-semibold tabular-nums">{row.healthScore}</span>
                  <span className="text-muted-foreground">/ 100 · {band.label}</span>
                </span>
              </Detail>
              <Detail label="Next Maintenance Due"><span className="tabular-nums">{asset.nextDue}</span></Detail>
            </div>
          </SectionCard>

          {/* ---------- The three documents ---------- */}
          <SectionCard
            title="Reports"
            icon={<FileText className="size-4 text-primary" />}
            hoverable={false}
            contentClassName="pb-2"
          >
            <ul className="divide-y divide-foreground/10">
              {reportDocuments.map((report) => (
                <ReportRowItem
                  key={report.kind}
                  report={report}
                  row={row}
                  onOpen={() =>
                    setOpen({
                      title: report.title,
                      file: report.file,
                      detail: `${asset.tagId} · ${report.detail}`,
                      fileName: report.fileName(asset.tagId),
                    })
                  }
                />
              ))}
            </ul>
          </SectionCard>

          {/* ---------- What the Contamination Report says ---------- */}
          <SectionCard title="Contamination Report" icon={<Thermometer className="size-4 text-primary" />} hoverable={false}>
            <p className="mb-3 text-xs text-muted-foreground">
              Scored from dust thickness, dust type and hotspot temperature read off the inspection. This is the
              report that produces the Health Score.
            </p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
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

        {/* ---------- Sidebar: the score, and the work behind it ---------- */}
        <div className="space-y-4">
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

          {/* The flow, named: this report exists because that inspection happened */}
          <SectionCard title="Read Off Inspection" icon={<ClipboardCheck className="size-4 text-primary" />} hoverable={false}>
            <div className="space-y-2.5">
              <Detail label="Inspection ID">
                <Link to={`/inspection-activities/${inspection.id}`} className="font-medium tabular-nums text-primary hover:underline">
                  {inspection.id}
                </Link>
              </Detail>
              <Detail label="Inspection Type">{inspection.activity}</Detail>
              <Detail label="Inspected By">{inspection.elpremar}</Detail>
              <Detail label="Inspected On"><span className="tabular-nums">{inspection.on}</span></Detail>
            </div>
          </SectionCard>

          <SectionCard title="Cleaning" icon={<Wrench className="size-4 text-primary" />} hoverable={false}>
            {maintenance ? (
              <div className="space-y-2.5">
                <Detail label="Task ID">
                  <Link to={`/tasks/${maintenance.id}`} className="font-medium tabular-nums text-primary hover:underline">
                    {maintenance.id}
                  </Link>
                </Detail>
                <Detail label="Maintenance Type">{maintenance.type}</Detail>
                <Detail label="Carried Out By">{maintenance.elpremar}</Detail>
                <Detail label="Last Cleaned"><span className="tabular-nums">{maintenance.on}</span></Detail>
                <Detail label="Next Cleaning Due"><span className="tabular-nums">{row.nextCleaningDue}</span></Detail>
              </div>
            ) : (
              <p className="py-3 text-center text-xs text-muted-foreground">
                This asset has not been cleaned yet, so it holds no cleaning report. One is raised once the
                maintenance its inspection called for has run.
              </p>
            )}
          </SectionCard>

          <SectionCard title="Inspection Schedule" icon={<CalendarClock className="size-4 text-primary" />} hoverable={false}>
            <div className="space-y-2.5">
              <Detail label="Frequency">Every {row.frequency} months</Detail>
              <Detail label="Last Inspection"><span className="tabular-nums">{inspection.on}</span></Detail>
              <Detail label="Next Inspection Due"><span className="tabular-nums">{row.nextInspectionDue}</span></Detail>
            </div>
          </SectionCard>
        </div>
      </div>

      <DocumentDialog document={open} onClose={() => setOpen(null)} />
    </div>
  )
}

/**
 * One document on the asset's record: what it is, what it says about this asset,
 * and the two ways to take it - read it here, or keep a copy.
 *
 * A report that does not exist yet keeps its line rather than disappearing, so
 * the record reads as three documents with one outstanding instead of two
 * documents and no explanation.
 */
function ReportRowItem({ report, row, onOpen }: { report: ReportDocument; row: ReportRow; onOpen: () => void }) {
  const available = hasReport(report.kind, !!row.maintenance)

  /** The headline each report carries for this asset, beside its name */
  const headline =
    report.kind === "contamination" ? (
      <span className={cn("rounded px-1.5 py-0.5 text-[0.65rem] font-semibold", contaminationTone[row.contamination])}>
        {row.contamination} · {row.contaminationStatus}
      </span>
    ) : report.kind === "hygiene" ? (
      <Badge variant={findingLook[row.hygieneStatus].badge} className="rounded px-1.5 py-0 text-[0.65rem]">
        {row.hygieneOpen ? `${row.hygieneOpen} of ${row.hygiene.length} open` : "All points clear"}
      </Badge>
    ) : row.maintenance ? (
      <span className="rounded bg-muted px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums">{row.maintenance.on}</span>
    ) : null

  return (
    <li className="flex flex-wrap items-center gap-2 py-2.5">
      <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-lg", available ? "bg-critical-soft text-critical" : "bg-muted text-muted-foreground")}>
        <FileText className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold">{report.title}</span>
          {headline}
        </div>
        <p className="truncate text-[0.7rem] text-muted-foreground">
          {available ? report.detail : "Raised once this asset has been cleaned"}
        </p>
      </div>
      {available ? (
        <div className="flex shrink-0 items-center gap-1.5">
          <Button variant="outline" size="sm" className={cn(control, "bg-card")} onClick={onOpen}>
            <Eye className="size-3.5" /> View Report
          </Button>
          <Button variant="outline" size="sm" className={cn(control, "bg-card")} asChild>
            <a href={report.file} download={report.fileName(row.asset.tagId)}>
              <Download className="size-3.5" /> Download
            </a>
          </Button>
        </div>
      ) : (
        <span className="shrink-0 text-[0.7rem] font-medium text-muted-foreground">Not cleaned yet</span>
      )}
    </li>
  )
}
