import { ChartNoAxesColumn, CircleCheck, CloudUpload, Leaf, ShieldCheck } from "lucide-react"

import { compliance, dataSync, systemUsage } from "@/data/dashboard"

const panel = "rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10"
const heading = "mb-2 flex items-center gap-1.5 text-sm font-semibold"

function ComplianceSafety() {
  return (
    <section className={`${panel} bg-healthy-soft/60`}>
      <h3 className={heading}>
        <ShieldCheck className="size-4 text-healthy" /> Compliance &amp; Safety
      </h3>
      <div className="flex items-center gap-3">
        <span className="flex size-12 shrink-0 items-center justify-center rounded-full ring-4 ring-healthy/70">
          <ShieldCheck className="size-6 fill-healthy/15 text-healthy" />
        </span>
        <div>
          <div className="text-2xl leading-none font-bold">{compliance.percent}%</div>
          <div className="text-xs text-muted-foreground">Statutory Compliance</div>
          <div className="mt-1 flex items-center gap-1 text-[0.65rem] text-healthy-soft-foreground">
            <CircleCheck className="size-3" /> {compliance.note}
          </div>
        </div>
      </div>
    </section>
  )
}

function DataSyncStatus() {
  return (
    <section className={panel}>
      <h3 className={heading}>
        <CloudUpload className="size-4 text-primary" /> Data Sync Status
      </h3>
      <div className="flex items-center gap-1.5 text-xs font-medium">
        <CircleCheck className="size-4 fill-healthy text-white" /> Synced with Central Server
      </div>
      <dl className="mt-1.5 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 text-[0.7rem]">
        <dt className="text-muted-foreground">Last Synced On</dt>
        <dd className="tabular-nums">: {dataSync.lastSynced}</dd>
        <dt className="text-muted-foreground">Synced By</dt>
        <dd>: {dataSync.syncedBy}</dd>
      </dl>
    </section>
  )
}

function SystemUsage() {
  return (
    <section className={panel}>
      <h3 className={heading}>
        <ChartNoAxesColumn className="size-4 text-primary" /> System Usage
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {[
          { value: systemUsage.activeUsers, label: "Active Users", tone: "text-primary" },
          { value: systemUsage.activeThisWeek, label: "Active This Week", tone: "text-attention" },
        ].map((s) => (
          <div key={s.label} className="flex items-end gap-1.5">
            <ChartNoAxesColumn className={`size-5 ${s.tone}`} />
            <span>
              <span className="block text-xl leading-none font-bold tabular-nums">{s.value}</span>
              <span className="text-[0.65rem] text-muted-foreground">{s.label}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

function SustainabilityBanner() {
  return (
    <section className="relative min-h-24 overflow-hidden rounded-lg shadow-xs ring-1 ring-foreground/10">
      {/* TODO: replace with OLIVINE's own licensed photography */}
      <img src="/brand/emmse-scene.jpg" alt="" className="absolute inset-0 size-full object-cover object-bottom" />
      <div className="absolute inset-0 bg-gradient-to-l from-brand-navy/85 via-brand-navy/50 to-transparent" />
      <p className="relative ml-auto flex h-full max-w-[60%] items-center gap-1.5 p-3 text-right text-sm leading-snug font-semibold text-white">
        Reliable Electrical Assets Powering a Sustainable Tomorrow.
        <Leaf className="size-5 shrink-0 fill-healthy text-healthy" />
      </p>
    </section>
  )
}

/** The bottom row of the dashboard: compliance, sync, usage and the brand banner */
export function StatusStrip() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <ComplianceSafety />
      <DataSyncStatus />
      <SystemUsage />
      <SustainabilityBanner />
    </div>
  )
}
