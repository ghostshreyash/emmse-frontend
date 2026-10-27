import { Link, Navigate, useSearchParams } from "react-router"
import { ArrowLeftRight, HeartPulse, PieChart, Server, ShieldAlert, TriangleAlert } from "lucide-react"

import { DonutChart } from "@/components/common/donut-chart"
import { PageHeader } from "@/components/common/page-header"
import { SectionCard } from "@/components/common/section-card"
import { StatCard } from "@/components/common/stat-card"
import { Announcements } from "@/components/dashboard/announcements"
import { AttentionAssets } from "@/components/dashboard/attention-assets"
import { EnterpriseInfo } from "@/components/dashboard/enterprise-info"
import { MaintenanceTrend } from "@/components/common/trend-charts"
import { PlantInfo } from "@/components/dashboard/plant-info"
import { PlantSelect } from "@/components/dashboard/plant-select"
import { PlantsOverview } from "@/components/dashboard/plants-overview"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ComplianceSafety, DataSyncStatus, SystemUsage } from "@/components/dashboard/status-panels"
import { getDashboardData, isPlantId, plants, type DashboardScope } from "@/data/dashboard"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/context"
import { healthStatus } from "@/lib/status"

/** Each row pairs the main content with a narrower panel on the right, as in the mockup */
const row = "grid gap-3 xl:grid-cols-[minmax(0,1fr)_21rem]"

/**
 * Enterprise Dashboard (EMMS-E mockup, page 31): the admin's own enterprise —
 * asset health, maintenance trend, assets needing attention and system status,
 * for every plant or the one picked in the header (kept in `?plant=` so it survives a reload).
 */
export function DashboardPage() {
  const [params, setParams] = useSearchParams()
  const { user, session } = useAuth()
  // A plant-level user is held to the plant they picked on the Plants screen
  const locked = !!user?.choosesPlant
  const lockedPlant = locked && session?.plantId && isPlantId(session.plantId) ? session.plantId : null
  const plantParam = params.get("plant")
  const scope: DashboardScope = lockedPlant ?? (isPlantId(plantParam) ? plantParam : "all")
  const plant = plants.find((p) => p.id === scope)
  const data = getDashboardData(scope)
  const { assetKpis } = data

  const setScope = (next: DashboardScope) =>
    setParams((p) => {
      if (next === "all") p.delete("plant")
      else p.set("plant", next)
      return p
    }, { replace: true })

  const health = (["healthy", "attention", "critical"] as const).map((key) => ({
    key,
    label: healthStatus[key].label,
    value: assetKpis[key].value,
    color: healthStatus[key].color,
  }))

  // Not picked a plant yet: the Plants screen comes first
  if (locked && !lockedPlant) return <Navigate to="/plants" replace />

  return (
    <div className="space-y-3">
      {/*
        * The title row and plant picker stay put while the rest scrolls under them.
        * Sticks just below the 4rem top bar, and reaches out over the page gutter so
        * cards scrolling past are hidden behind it rather than showing at the edges.
        * z-[15]: above the cards' own layers (the donut and the Phase 2 overlays sit at
        * z-10) and below the top bar (z-20).
        */}
      <div className="sticky top-16 z-[15] -mx-3 -mt-3 border-b border-foreground/10 bg-background px-3 pt-3 md:-mx-4 md:-mt-4 md:px-4 md:pt-4 [&>div]:mb-2">
        <PageHeader
          title="Enterprise Dashboard"
          description={plant ? plant.name : "All plants"}
          breadcrumbs={[{ label: "Dashboard" }]}
          actions={
            <>
              <PlantSelect value={scope} onChange={setScope} locked={locked} />
              {/* The way back to the Plants screen, since the dropdown cannot change plant */}
              {locked ? (
                <Button variant="outline" size="sm" className="bg-card" asChild>
                  <Link to="/plants">
                    <ArrowLeftRight /> Change Plant
                  </Link>
                </Button>
              ) : null}
            </>
          }
        />
      </div>

      {/* Beside the enterprise: every plant at a glance, or the picked plant's own card */}
      <div className="grid gap-3 lg:grid-cols-2">
        <EnterpriseInfo />
        {plant ? <PlantInfo key={plant.id} plant={plant} /> : <PlantsOverview />}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Assets" value={assetKpis.total.value.toLocaleString("en-IN")} change={assetKpis.total.change} icon={Server} tone="highlight" />
        <StatCard label={`${healthStatus.healthy.label} Assets`} value={assetKpis.healthy.value} percent={assetKpis.healthy.percent} icon={HeartPulse} tone="healthy" />
        <StatCard label={healthStatus.attention.label} value={assetKpis.attention.value} percent={assetKpis.attention.percent} icon={TriangleAlert} tone="attention" />
        <StatCard label={healthStatus.critical.label} value={assetKpis.critical.value} percent={assetKpis.critical.percent} icon={ShieldAlert} tone="critical" />
      </div>

      <div className={row}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <SectionCard title="Asset Health Distribution" icon={<PieChart className="size-4 text-primary" />}>
            <div className="flex h-full items-center">
              <DonutChart data={health} centerLabel="Total Assets" size={150} />
            </div>
          </SectionCard>
          <MaintenanceTrend data={data.maintenanceTrend} title="Maintenance Task Trend" />
        </div>
        <QuickActions />
      </div>

      <div className={row}>
        <AttentionAssets assets={data.assetsRequiringAttention} showPlant={scope === "all"} />
        <div className="grid content-start gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <ComplianceSafety compliance={data.compliance} />
          <DataSyncStatus dataSync={data.dataSync} />
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Announcements announcements={data.announcements} />
        <SystemUsage systemUsage={data.systemUsage} />
      </div>
    </div>
  )
}
