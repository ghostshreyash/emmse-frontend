import { useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/common/page-header"
import { StepperBar } from "@/components/common/wizard"
import { Button } from "@/components/ui/button"
import { siteFor } from "@/data/asset-data"
import { onboardAsset, updateAsset, useAssetRows, valuesFrom } from "@/data/asset-store"
import type { AssetRecord } from "@/data/assets"
import { plants } from "@/data/dashboard"
import { assetSchema, missingUploads, stepFields, type AssetFormValues } from "@/pages/assets/schemas"
import { missingParameters } from "@/data/asset-parameters"
import { StepDetails } from "@/pages/assets/steps/step-details"
import { StepTechnical } from "@/pages/assets/steps/step-technical"
import { StepUploads } from "@/pages/assets/steps/step-uploads"
import { StepReview } from "@/pages/assets/steps/step-review"
import { AssetIdScreen } from "@/pages/assets/asset-id"
import { useLockedPlant } from "@/lib/auth/use-locked-plant"

const steps = [
  { title: "Asset Details" },
  { title: "Technical Details" },
  { title: "Images & Documents" },
  { title: "Review & Submit" },
]

/**
 * Asset onboarding, slides 16–20 of the EVITA workflow, ported to the enterprise
 * portal as Asset Management's Add New Asset (`/assets/add`).
 *
 * All four steps share one form, so stepping back to change an earlier answer
 * never discards a later one. Submitting registers the asset and hands over to
 * the Asset ID & QR screen, which is the fifth view of the same route rather
 * than a separate page — there is nothing to link to until the asset exists.
 *
 * The same four steps correct an asset already on the register, opened from
 * `/assets/:id/edit` and filled in with what it holds. The Asset ID is not
 * reissued — see `updateAsset` — so a correction ends back on the asset rather
 * than on the Asset ID screen.
 */
export function AssetOnboardingPage() {
  const navigate = useNavigate()
  // Starts at the first plant (an EMMSE-0 user's own plant); step 1 lets an admin pick any of the enterprise's plants
  const lockedPlant = useLockedPlant()
  const site = useMemo(() => siteFor(lockedPlant ?? plants[0].name), [lockedPlant])

  /* Correcting an asset rather than registering one, if the route names one */
  const { id: editing } = useParams()
  const register = useAssetRows()
  const asset = useMemo(() => (editing ? register.find((a) => a.tagId === editing) : undefined), [register, editing])
  const held = useMemo(() => (asset ? valuesFrom(asset) : undefined), [asset])

  const [current, setCurrent] = useState(0)
  /*
   * How far the stepper can jump. Registering an asset walks forward one step
   * at a time, each validated before it is left, so nothing half-filled reaches
   * the review. Correcting one that is already on the register is different:
   * every answer is there, and the engineer came to change one of them - so the
   * whole bar is live from the start.
   */
  const [furthest, setFurthest] = useState(0)
  const [pending, setPending] = useState(false)
  /** Set once the asset is registered; switches the route to the Asset ID screen */
  const [created, setCreated] = useState<AssetRecord>()

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(assetSchema),
    mode: "onTouched",
    defaultValues: held ?? {
      enterprise: site.enterprise,
      plant: site.plant.name,
      department: "",
      subDepartment: "",
      area: "",
      category: "",
      tag: "",
      description: "",
      /* Filled in per asset type on step 2 - see data/asset-parameters.ts */
      parameters: {},
      environment: "",

      // Pre-filled from the plant's own registered location, and editable on site
      latitude: site.plant.latitude,
      longitude: site.plant.longitude,

      images: [],
      documents: [],
    },
  })

  const goTo = (step: number) => {
    setCurrent(step)
    setFurthest((f) => Math.max(f, step))
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const next = async () => {
    const ok = await form.trigger(stepFields[current])
    if (!ok) {
      toast.error("Check the highlighted fields before continuing.")
      return
    }
    if (current === 1) {
      const values = form.getValues()
      const owed = missingParameters(values.category, values.parameters ?? {})
      if (owed.length) {
        toast.error(`Still needed: ${owed.map((p) => p.label).join(", ")}.`)
        return
      }
    }
    if (current === 2) {
      const missing = missingUploads(form.getValues())
      if (!missing.complete) {
        toast.error(
          missing.images === 0
            ? "Add at least one photograph of the asset."
            : "Every photograph and document needs a name."
        )
        return
      }
    }
    goTo(current + 1)
  }

  const submit = form.handleSubmit((values) => {
    setPending(true)
    if (asset) {
      const record = updateAsset(asset.tagId, values)
      setPending(false)
      toast.success(`${asset.tagId} corrected.`)
      navigate(`/assets/${encodeURIComponent(record?.tagId ?? asset.tagId)}`)
      return
    }
    const record = onboardAsset(values)
    setPending(false)
    setCreated(record)
    window.scrollTo({ top: 0, behavior: "smooth" })
    toast.success(`${record.tagId} registered.`)
  })

  // Once the asset exists, the wizard is finished and its result takes the page
  if (created) {
    return (
      <AssetIdScreen
        asset={created}
        onRestart={() => {
          form.reset()
          setCreated(undefined)
          setCurrent(0)
          setFurthest(0)
        }}
        onDone={() => navigate(`/assets/${encodeURIComponent(created.tagId)}`)}
      />
    )
  }

  return (
    <div>
      <PageHeader
        title={asset ? `Correct ${asset.tagId}` : "Asset Onboarding"}
        description={
          asset
            ? "Put right anything that was entered wrongly. The Asset ID stays as it was issued — it is printed on the label and quoted by every inspection taken against this asset."
            : "Register new electrical assets at the assigned location for preventive maintenance and reliability management."
        }
        breadcrumbs={
          asset
            ? [{ label: "Asset Management", to: "/assets" }, { label: asset.tagId, to: `/assets/${encodeURIComponent(asset.tagId)}` }, { label: "Correct" }]
            : [{ label: "Asset Management", to: "/assets" }, { label: "Asset Onboarding" }]
        }
      />

      <StepperBar steps={steps} current={current} furthest={asset ? steps.length - 1 : furthest} onSelect={goTo} />

      {current === 0 ? <StepDetails form={form} issuedId={asset?.tagId} /> : null}
      {current === 1 ? <StepTechnical form={form} /> : null}
      {current === 2 ? <StepUploads form={form} /> : null}
      {current === 3 ? <StepReview form={form} onEdit={goTo} /> : null}

      {/* ---------- Footer, shared by every step ---------- */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        {current === 0 ? (
          <Button variant="outline" onClick={() => navigate("/assets")} disabled={pending}>
            Cancel
          </Button>
        ) : (
          <Button variant="outline" onClick={() => goTo(current - 1)} disabled={pending}>
            <ArrowLeft /> Back
          </Button>
        )}

        {current < steps.length - 1 ? (
          <Button onClick={next} className="min-w-32">
            Next <ArrowRight />
          </Button>
        ) : (
          <Button onClick={submit} className="min-w-56" disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="animate-spin" /> Registering…
              </>
            ) : (
              <>
                Submit Asset for Onboarding <Check />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
