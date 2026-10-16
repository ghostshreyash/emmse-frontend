import { useMemo } from "react"
import { Link, useNavigate, useParams } from "react-router"
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  CircleDashed,
  ClipboardCheck,
  FileText,
  History,
  Images,
  Pencil,
  QrCode,
  Settings,
  TriangleAlert,
  Wrench,
} from "lucide-react"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { AssetPhoto } from "@/components/common/asset-photo"
import { DetailList, DetailPanel } from "@/components/common/detail-list"
import { assetDetailRows, assetTechnicalRows } from "@/components/assets/asset-sections"
import { AssetQrPanel, QrLabelPreview } from "@/components/assets/asset-qr"
import { StartInspection } from "@/components/assets/start-inspection"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { parseDmy } from "@/data/asset-data"
import type { AssetRecord } from "@/data/assets"
import { capturesOf, findAsset, profileOf, useAssetRows } from "@/data/asset-store"
import { useInspectionDetails, useInspectionRows } from "@/data/inspection-store"
import { slotLabel } from "@/data/operations"
import { useTaskDetails, useTaskRows } from "@/data/task-store"
import { td, th } from "@/lib/data-table"
import { healthStatus, inspectionStatus, maintenanceStatus, workStatus, type WorkStatus } from "@/lib/status"

/**
 * One asset, in full.
 *
 * Ported from EVITA's asset detail screen: the identity and its QR code at the top,
 * then every value onboarding captured, the photographs, and the documents behind
 * them. EVITA leaves out the inspection and maintenance blocks because it does not
 * hold those records yet; the enterprise portal does, so this screen adds the
 * asset's Inspection History and its Cleaning / Maintenance History.
 */
export function AssetDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  // Subscribing keeps this screen live for an asset registered or corrected in this session
  useAssetRows()
  const asset = findAsset(id)

  if (!asset) return <NotFound id={id} />

  return <AssetDetail asset={asset} onBack={() => navigate("/assets")} />
}

function AssetDetail({ asset, onBack }: { asset: AssetRecord; onBack: () => void }) {
  const profile = useMemo(() => profileOf(asset), [asset])
  const captures = capturesOf(asset.tagId)
  const look = asset.health ? healthStatus[asset.health] : null

  return (
    <div>
      <PageHeader
        title={asset.name}
        /* The score belongs with the name: it is the first thing asked about an asset */
        badge={
          look && asset.healthScore !== null ? (
            <span className={cn("flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold", look.tile)}>
              <span aria-hidden className={cn("size-2 rounded-full", look.dot)} />
              {look.label} · <span className="tabular-nums">{asset.healthScore}/100</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-sm font-medium text-muted-foreground">
              <CircleDashed className="size-4" /> Not inspected yet
            </span>
          )
        }
        description={`${asset.category} · ${asset.area}`}
        breadcrumbs={[{ label: "Asset Management", to: "/assets" }, { label: asset.tagId }]}
        actions={
          <>
            {/* Anything entered wrongly at onboarding is put right here */}
            <Button variant="outline" size="sm" asChild>
              <Link to={`/assets/${encodeURIComponent(asset.tagId)}/edit`}>
                <Pencil /> Edit
              </Link>
            </Button>
            <Button variant="outline" size="sm" onClick={onBack}>
              <ArrowLeft /> Back to Asset Management
            </Button>
          </>
        }
      />

      {/*
        * Three columns: what the asset is and the label for its door; the code on
        * that door; what it is rated for and what to do next. Its history, the
        * photographs and the documents run the full width underneath.
        */}
      <div className="grid items-start gap-3 lg:grid-cols-2 xl:grid-cols-3">
        {/* ---------- What it is, and the label for its door ---------- */}
        <div className="space-y-3">
          <DetailPanel icon={Building2} title="Asset Information">
            <DetailList rows={assetDetailRows(profile)} />
          </DetailPanel>

          <DetailPanel title="QR Code Label Preview">
            <QrLabelPreview asset={asset} />
          </DetailPanel>
        </div>

        {/* ---------- The code on the panel door ---------- */}
        <div className="space-y-3">
          <DetailPanel icon={QrCode} title="Asset ID & QR Code">
            <AssetQrPanel asset={asset} />
          </DetailPanel>

          {/* When the asset joined the register, and where its schedule stands */}
          <DetailPanel icon={CalendarDays} title="Onboarding">
            <DetailList
              rows={[
                { label: "Onboarded On", value: asset.onboarded, always: true },
                { label: "Last Inspection", value: asset.lastInspection || "Not inspected yet", always: true },
                { label: "Next Due", value: asset.nextDue, always: true },
              ]}
            />
          </DetailPanel>
        </div>

        {/* ---------- What it is rated for, and what to do next ---------- */}
        <div className="space-y-3">
          <DetailPanel icon={Settings} title="Technical Details">
            <DetailList rows={assetTechnicalRows(profile)} />
          </DetailPanel>

          <DetailPanel icon={ClipboardCheck} title="Next steps">
            <StartInspection asset={asset} />
          </DetailPanel>
        </div>

        {/* ---------- What has been done to it ---------- */}
        <InspectionHistory asset={asset} />
        <MaintenanceHistory asset={asset} />

        {/* ---------- What it was photographed as ---------- */}
        <DetailPanel
          icon={Images}
          title={`Asset Images (${profile.images.length})`}
          className="lg:col-span-2 xl:col-span-3"
        >
          {profile.images.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {profile.images.map((image) => (
                <figure key={image.id}>
                  <div className="h-36 overflow-hidden rounded-lg ring-1 ring-foreground/10">
                    <AssetPhoto file={captures?.images[image.id]} label={image.name} caption={image.name} />
                  </div>
                  <figcaption className="mt-1 line-clamp-2 text-center text-xs leading-tight">{image.name}</figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="py-3 text-center text-sm text-muted-foreground">No photographs held for this asset.</p>
          )}
        </DetailPanel>

        {/* ---------- The paperwork behind the ratings ---------- */}
        <DetailPanel
          icon={FileText}
          title={`Documents (${profile.documents.length})`}
          contentClassName="px-1"
          className="lg:col-span-2 xl:col-span-3"
        >
          {profile.documents.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className={th}>Name</TableHead>
                    <TableHead className={th}>File Name</TableHead>
                    <TableHead className={th}>Uploaded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profile.documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className={cn(td, "font-medium")}>{doc.name}</TableCell>
                      <TableCell className={cn(td, "text-muted-foreground")}>{doc.file}</TableCell>
                      <TableCell className={cn(td, "whitespace-nowrap tabular-nums")}>{doc.uploaded}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="py-3 text-center text-sm text-muted-foreground">No documents held for this asset.</p>
          )}
        </DetailPanel>
      </div>
    </div>
  )
}

/* ---------- History ---------- */

/** Newest first, by the dd-MM-yyyy date each record is booked for */
const newestFirst = <T,>(rows: T[], dateOf: (r: T) => string) =>
  [...rows].sort((a, b) => parseDmy(dateOf(b)).getTime() - parseDmy(dateOf(a)).getTime())

const inspectionLook = (s: WorkStatus) => inspectionStatus[s] ?? workStatus[s]
const maintenanceLook = (s: WorkStatus) => maintenanceStatus[s] ?? workStatus[s]

const resultTone = { Healthy: "healthy", Attention: "attention", Critical: "critical" } as const

/** Every inspection booked against this asset, with what each one found */
function InspectionHistory({ asset }: { asset: AssetRecord }) {
  const rows = useInspectionRows()
  const details = useInspectionDetails()
  const mine = useMemo(
    () => newestFirst(rows.filter((r) => r.assetTag === asset.tagId), (r) => r.due),
    [rows, asset.tagId]
  )
  const done = mine.filter((r) => r.status === "completed").length

  return (
    <DetailPanel
      icon={History}
      title={`Inspection History (${mine.length})`}
      action={mine.length ? <span className="text-xs text-muted-foreground tabular-nums">{done} completed</span> : null}
      contentClassName="px-1"
      className="lg:col-span-2 xl:col-span-3"
    >
      {mine.length ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={th}>Inspection</TableHead>
                <TableHead className={th}>Activity</TableHead>
                <TableHead className={th}>Date</TableHead>
                <TableHead className={th}>ELPREMAR</TableHead>
                <TableHead className={th}>Status</TableHead>
                <TableHead className={th}>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.map((r) => {
                const status = inspectionLook(r.status)
                const result = details[r.id]?.result
                return (
                  <TableRow key={r.id}>
                    <TableCell className={cn(td, "whitespace-nowrap")}>
                      <Link to={`/inspection-activities/${r.id}`} className="font-medium text-primary tabular-nums hover:underline">
                        {r.id}
                      </Link>
                    </TableCell>
                    <TableCell className={td}>{r.activity}</TableCell>
                    <TableCell className={cn(td, "whitespace-nowrap tabular-nums")}>
                      {r.due}
                      <span className="block text-[0.65rem] text-muted-foreground">{slotLabel(r.slot)}</span>
                    </TableCell>
                    <TableCell className={td}>{r.elpremar}</TableCell>
                    <TableCell className={td}>
                      <Badge variant={status.badge} className="rounded px-1.5 py-0 text-[0.65rem]">{status.label}</Badge>
                    </TableCell>
                    <TableCell className={td}>
                      {result ? (
                        <span className="flex items-center gap-1.5">
                          <span className="font-semibold tabular-nums">{result.healthScore}</span>
                          <Badge variant={resultTone[result.classification]} className="rounded px-1.5 py-0 text-[0.65rem]">
                            {result.classification}
                          </Badge>
                        </span>
                      ) : (
                        <span className="text-muted-foreground">Not yet</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="px-2 py-3 text-center text-sm text-muted-foreground">No inspections recorded against this asset yet.</p>
      )}
    </DetailPanel>
  )
}

/** Every cleaning or maintenance task done on this asset, with the INSTA fluid used */
function MaintenanceHistory({ asset }: { asset: AssetRecord }) {
  const rows = useTaskRows()
  const details = useTaskDetails()
  const mine = useMemo(
    () => newestFirst(rows.filter((r) => r.assetTag === asset.tagId), (r) => r.scheduled),
    [rows, asset.tagId]
  )
  const done = mine.filter((r) => r.status === "completed").length

  return (
    <DetailPanel
      icon={Wrench}
      title={`Cleaning / Maintenance History (${mine.length})`}
      action={mine.length ? <span className="text-xs text-muted-foreground tabular-nums">{done} completed</span> : null}
      contentClassName="px-1"
      className="lg:col-span-2 xl:col-span-3"
    >
      {mine.length ? (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={th}>Task</TableHead>
                <TableHead className={th}>Type</TableHead>
                <TableHead className={th}>Date</TableHead>
                <TableHead className={th}>ELPREMAR</TableHead>
                <TableHead className={th}>INSTA Fluid</TableHead>
                <TableHead className={th}>Status</TableHead>
                <TableHead className={th}>Inspection</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mine.map((r) => {
                const status = maintenanceLook(r.status)
                const products = details[r.id]?.products.map((p) => p.name).join(", ")
                return (
                  <TableRow key={r.id}>
                    <TableCell className={cn(td, "whitespace-nowrap")}>
                      <Link to={`/tasks/${r.id}`} className="font-medium text-primary tabular-nums hover:underline">
                        {r.id}
                      </Link>
                    </TableCell>
                    <TableCell className={td}>{r.type}</TableCell>
                    <TableCell className={cn(td, "whitespace-nowrap tabular-nums")}>
                      {r.scheduled}
                      <span className="block text-[0.65rem] text-muted-foreground">{slotLabel(r.slot)}</span>
                    </TableCell>
                    <TableCell className={td}>{r.elpremar}</TableCell>
                    <TableCell className={td}>{products || <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell className={td}>
                      <Badge variant={status.badge} className="rounded px-1.5 py-0 text-[0.65rem]">{status.label}</Badge>
                    </TableCell>
                    <TableCell className={cn(td, "whitespace-nowrap")}>
                      {r.inspectionId ? (
                        <Link to={`/inspection-activities/${r.inspectionId}`} className="text-primary tabular-nums hover:underline">
                          {r.inspectionId}
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      ) : (
        <p className="px-2 py-3 text-center text-sm text-muted-foreground">No cleaning or maintenance recorded against this asset yet.</p>
      )}
    </DetailPanel>
  )
}

function NotFound({ id }: { id?: string }) {
  return (
    <div>
      <PageHeader title="Asset not found" breadcrumbs={[{ label: "Asset Management", to: "/assets" }, { label: id ?? "Unknown" }]} />
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl bg-card py-20 text-center shadow-xs ring-1 ring-foreground/10">
        <TriangleAlert className="size-8 text-attention" />
        <p className="max-w-md text-sm text-muted-foreground">
          No asset is registered under <span className="font-semibold">{id}</span>.
        </p>
        <Button asChild>
          <Link to="/assets">Back to Asset Management</Link>
        </Button>
      </div>
    </div>
  )
}
