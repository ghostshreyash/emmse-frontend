import { useState } from "react"
import { useNavigate } from "react-router"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/page-header"
import { enterpriseInfo } from "@/data/dashboard"
import { addPlants } from "@/data/plant-store"
import { PlantStructureStep } from "./steps"
import type { OnboardingData, PlantEntry } from "./schemas"

/**
 * Add Plant: the plant form from OCC's Add Plant (occ-frontend
 * `pages/enterprise-onboarding`), on one page - the plant, its departments and
 * sub-departments, then Submit. The enterprise is the signed-in one, so it is
 * not asked for.
 */
export function AddPlantPage() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [data, setData] = useState<OnboardingData>({ plants: [] })

  const submit = (plants: PlantEntry[]) => {
    setSubmitting(true)
    // TODO: POST /plants with this payload
    const created = addPlants(plants)
    toast.success(created.length === 1 ? `${created[0].name} added` : `${created.length} plants added`)
    navigate("/plants-list")
  }

  return (
    <div className="space-y-3">
      <PageHeader title="Add Plant" breadcrumbs={[{ label: "Plants", to: "/plants-list" }, { label: "Add Plant" }]} />
      <PlantStructureStep
        data={data}
        onPlantsChange={(plants) => setData((d) => ({ ...d, plants }))}
        onSubmit={submit}
        pending={submitting}
        title={`Plant, Departments & Sub-departments — ${enterpriseInfo.name}`}
      />
    </div>
  )
}
