import { BookOpen, CircleCheck, Factory, OctagonAlert, PieChart, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { DonutChart } from "@/components/common/donut-chart"
import { PageHeader } from "@/components/common/page-header"
import { SectionCard } from "@/components/common/section-card"
import { StatCard } from "@/components/common/stat-card"
import { Announcements } from "@/components/dashboard/announcements"
import { AttentionAssets } from "@/components/dashboard/attention-assets"
import { EnterpriseInfo } from "@/components/dashboard/enterprise-info"
import { MaintenanceTrend } from "@/components/dashboard/maintenance-trend"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { StatusStrip } from "@/components/dashboard/status-strip"
import { assetKpis } from "@/data/dashboard"
import { healthStatus } from "@/lib/status"

/** Each row pairs the main content with a narrower panel on the right, as in the mockup */
const row = "grid gap-3 xl:grid-cols-[minmax(0,1fr)_21rem]"

/**
 * Enterprise Dashboard (EMMS-E mockup, page 31): the admin's own enterprise —
 * asset health, maintenance trend, assets needing attention and system status.
 */
export function DashboardPage() {
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
        description="Welcome to EMMS-E. Monitor, manage and optimize your electrical assets for a safer and more reliable tomorrow."
        breadcrumbs={[{ label: "Dashboard" }]}
        actions={
          <Button variant="outline" size="sm" className="text-primary">
            <BookOpen /> User Guide
          </Button>
        }
      />

      <div className={row}>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total Assets" value={assetKpis.total.value.toLocaleString("en-IN")} change={assetKpis.total.change} icon={Factory} tone="info" />
          <StatCard label={`${healthStatus.healthy.label} Assets`} value={assetKpis.healthy.value} percent={assetKpis.healthy.percent} icon={CircleCheck} tone="healthy" />
          <StatCard label={healthStatus.attention.label} value={assetKpis.attention.value} percent={assetKpis.attention.percent} icon={TriangleAlert} tone="attention" />
          <StatCard label={healthStatus.critical.label} value={assetKpis.critical.value} percent={assetKpis.critical.percent} icon={OctagonAlert} tone="critical" />
        </div>
        <EnterpriseInfo />
      </div>

      <div className={row}>
        <div className="grid gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <SectionCard title="Asset Health Distribution" icon={<PieChart className="size-4 text-primary" />}>
            <div className="flex h-full items-center">
              <DonutChart data={health} centerLabel="Total Assets" size={150} />
            </div>
          </SectionCard>
          <MaintenanceTrend />
        </div>
        <QuickActions />
      </div>

      <div className={row}>
        <AttentionAssets />
        <Announcements />
      </div>

      <StatusStrip />
    </div>
  )
}
