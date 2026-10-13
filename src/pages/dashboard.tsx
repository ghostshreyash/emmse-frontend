import { useSearchParams } from "react-router"
import { HeartPulse, PieChart, Server, ShieldAlert, TriangleAlert } from "lucide-react"

import { DonutChart } from "@/components/common/donut-chart"
import { PageHeader } from "@/components/common/page-header"
import { SectionCard } from "@/components/common/section-card"
import { StatCard } from "@/components/common/stat-card"
import { Announcements } from "@/components/dashboard/announcements"
import { AttentionAssets } from "@/components/dashboard/attention-assets"
import { EnterpriseInfo } from "@/components/dashboard/enterprise-info"
import { MaintenanceTrend } from "@/components/dashboard/maintenance-trend"
import { PlantInfo } from "@/components/dashboard/plant-info"
import { PlantSelect } from "@/components/dashboard/plant-select"
import { PlantsOverview } from "@/components/dashboard/plants-overview"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { ComplianceSafety, DataSyncStatus, SystemUsage } from "@/components/dashboard/status-panels"
import { getDashboardData, isPlantId, plants, type DashboardScope } from "@/data/dashboard"
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
  const plantParam = params.get("plant")
  const scope: DashboardScope = isPlantId(plantParam) ? plantParam : "all"
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

  return (
    <div className="space-y-3">
      <PageHeader
        title="Enterprise Dashboard"
        description={plant ? plant.name : "All plants"}
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={<PlantSelect value={scope} onChange={setScope} />}
      />

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
          <MaintenanceTrend data={data.maintenanceTrend} />
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
