import { useMemo, useState } from "react"
import { Link } from "react-router"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { format, isValid, parse } from "date-fns"
import { ArrowLeft, Paperclip, Send, UserRound } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import {
  AssignElpremarDialog, type AssignResult,
} from "@/components/common/assign-elpremar-dialog"
import { ElpremarRail } from "@/components/common/elpremar-booking"
import { PageHeader } from "@/components/common/page-header"
import { SectionCard } from "@/components/common/section-card"
import { AssetIdField } from "@/components/form/asset-id-field"
import { MultiSelectField, SelectField, TextareaField, TextField } from "@/components/form/fields"
import { useAssetRows } from "@/data/asset-store"
import { plants as enterprisePlants } from "@/data/dashboard"
import { useElpremarBookings } from "@/data/elpremar-bookings"
import { activityTypes, areas, durations, priorities, slotLabel, type Elpremar } from "@/data/operations"
import { control as controlSize } from "@/lib/data-table"
import { required, today } from "@/lib/validation"

/** This enterprise's plants; the enterprise itself is fixed, so it is not asked for */
const plants = enterprisePlants.map((p) => p.name)

const schema = z.object({
  plant: required("Plant"),
  area: required("Location / Area"),
  // Picked from the register; its name and category follow from it
  assetTag: required("Asset ID"),
  assetName: required("Asset Name"),
  category: required("Asset Category"),
  // Every inspection type starts ticked; the user drops the ones not needed
  activity: z.array(z.string()).optional(),
  // Booked from today on; yyyy-MM-dd compares correctly as text
  date: required("Scheduled date").refine((v) => v >= today(), "Pick today or a later date"),
  time: required("Start time"),
  duration: z.string().optional(),
  description: required("Task description"),
  priority: required("Priority"),
})
export type AssignValues = z.infer<typeof schema>

/** What changes between the screens that use this form: their wording, and what Submit does */
type IntakeProps = {
  title: string
  /** The list the form is reached from */
  listLabel: string
  listPath: string
  cardTitle: string
  intro: string
  submitLabel: string
  /** Shown in the booking dialog until an activity type is picked */
  untitled: string
  onSubmit: (values: AssignValues, elpremar: Elpremar) => void
}

/** The intake form for a new inspection activity, reached from the Inspections list (ported from OCC) */
export function AddInspectionPage() {
  return (
    <ActivityIntake
      title="Add Inspection Activity"
      listLabel="Inspections"
      listPath="/inspection-activities"
      cardTitle="Assign Activity to ELPREMAR"
      intro="Create and assign a new inspection activity for electrical asset assessment at the selected location."
      submitLabel="Add Activity"
      untitled="New Inspection Activity"
      // TODO: POST /inspection-activities
      onSubmit={(_, elpremar) => toast.success(`Activity assigned to ${elpremar.name}`)}
    />
  )
}

/**
 * The inspection intake form itself: where, what, when and by whom, with the
 * ELPREMAR booked through the availability dialog. Add Inspection and Schedule
 * a Visit both use it, so the two forms stay the same.
 */
export function ActivityIntake({ title, listLabel, listPath, cardTitle, intro, submitLabel, untitled, onSubmit }: IntakeProps) {
  const form = useForm<AssignValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      plant: plants[0], area: "", assetTag: "", assetName: "", category: "", activity: [...activityTypes],
      date: "", time: "", duration: "4 Hours", description: "", priority: "Medium",
    },
  })
  const { control, watch, setValue } = form

  /** Who the activity is booked to. Nothing is chosen until the dialog commits. */
  const [selected, setSelected] = useState<Elpremar | null>(null)
  const [assigning, setAssigning] = useState(false)

  const plant = watch("plant")
  // The register's assets at the chosen plant, for the Asset ID search
  const assetRows = useAssetRows()
  const plantAssets = useMemo(() => assetRows.filter((a) => a.plant === plant), [assetRows, plant])

  /** A different plant has different assets, so an asset picked at the old one is cleared */
  const clearAsset = () => {
    setValue("assetTag", "")
    setValue("assetName", "")
    setValue("category", "")
  }
  const activity = watch("activity")

  // The scheduled date drives the calendar highlight; the dialog writes it on assign
  const scheduled = watch("date")
  const bookedDay = useMemo(() => {
    if (!scheduled) return undefined
    const d = parse(scheduled, "yyyy-MM-dd", new Date())
    return isValid(d) ? d : undefined
  }, [scheduled])

  // Everything already on someone's books, so the dialog can spot a clash
  const bookings = useElpremarBookings()

  /** The dialog settles the person, the day and the interval, so the form takes all three */
  const saveAssignment = ({ elpremar, date, slot }: AssignResult) => {
    setSelected(elpremar)
    setValue("date", format(date, "yyyy-MM-dd"), { shouldValidate: true })
    setValue("time", `${String(slot).padStart(2, "0")}:00`, { shouldValidate: true })
    setAssigning(false)
    toast.success(`${elpremar.name} assigned`, {
      description: `${format(date, "d MMM yyyy")}, ${slotLabel(slot)}`,
    })
  }

  const assign = form.handleSubmit((values) => {
    if (!selected) {
      toast.error("Assign an ELPREMAR before submitting")
      return
    }
    onSubmit(values, selected)
    form.reset()
    setSelected(null)
  })

  return (
    <div className="space-y-5">
      <PageHeader
        title={title}
        breadcrumbs={[{ label: listLabel, to: listPath }, { label: title }]}
        actions={
          <>
            <Button variant="outline" size="sm" className={cn(controlSize, "bg-card")} asChild>
              <Link to={listPath}><ArrowLeft className="size-3.5" /> Back to {listLabel}</Link>
            </Button>
          </>
        }
      />

      {/* The rail only exists once someone is assigned, so the form has the width until then */}
      <div className={cn("grid gap-5", selected && "xl:grid-cols-[1fr_24rem]")}>
        <SectionCard title={cardTitle} hoverable={false}>
          <p className="-mt-1 mb-4 text-xs text-muted-foreground">{intro}</p>
          <form onSubmit={assign} className="grid gap-4 md:grid-cols-6" noValidate>
            <SelectField control={control} name="plant" label="Plant" required options={plants} onValueChange={clearAsset} className="md:col-span-3" />
            <SelectField control={control} name="area" label="Location / Area" required options={areas} className="md:col-span-3" />
            <AssetIdField
              control={control}
              name="assetTag"
              label="Asset ID"
              required
              options={plantAssets}
              empty={`No asset at ${plant} matches.`}
              // The name and category come with the asset, so they are filled rather than typed
              onPick={(asset) => {
                setValue("assetName", asset.name, { shouldValidate: true })
                setValue("category", asset.category, { shouldValidate: true })
              }}
              className="md:col-span-2"
            />
            <TextField control={control} name="assetName" label="Asset Name" required readOnly placeholder="Filled from the Asset ID" inputClassName="bg-muted/60" className="md:col-span-2" />
            <TextField control={control} name="category" label="Asset Category" required readOnly placeholder="Filled from the Asset ID" inputClassName="bg-muted/60" className="md:col-span-2" />
            <MultiSelectField control={control} name="activity" label="Activity Type" options={activityTypes} placeholder="Select one or more" className="md:col-span-6" />
            <TextField control={control} name="date" label="Scheduled Date" required type="date" min={today()} className="md:col-span-2" />
            <TextField control={control} name="time" label="Start Time" required type="time" className="md:col-span-2" />
            <SelectField control={control} name="duration" label="Estimated Duration" options={durations} className="md:col-span-2" />

            <div className="md:col-span-6">
              <div className="mb-2 text-sm font-medium">ELPREMAR <span className="text-destructive">*</span></div>
              <div className="flex flex-wrap items-center gap-3">
                <Button type="button" variant={selected ? "outline" : "default"} onClick={() => setAssigning(true)}>
                  <UserRound /> {selected ? "Change ELPREMAR" : "Assign ELPREMAR"}
                </Button>
                {selected ? (
                  <span className="text-xs">
                    <span className="font-semibold text-primary">{selected.name}</span>
                    <span className="text-muted-foreground"> · {selected.id} · {selected.department} Dept. | {selected.plant}</span>
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No ELPREMAR assigned yet — the scheduled date and time come from the booking.
                  </span>
                )}
              </div>
            </div>

            <TextareaField control={control} name="description" label="Task Description" required rows={2} className="md:col-span-6" />
            <SelectField control={control} name="priority" label="Priority" required options={priorities} className="md:col-span-2" />
            <div className="md:col-span-4">
              <div className="mb-2 text-sm font-medium">Attachments</div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md bg-info-soft px-3 py-2 text-sm font-medium text-primary hover:bg-accent">
                <Paperclip className="size-4" /> Upload Files
                <input type="file" multiple accept=".pdf,image/png,image/jpeg" className="sr-only" />
              </label>
              <span className="ml-3 text-xs text-muted-foreground">PDF, JPG, PNG (Max 5 MB)</span>
            </div>
            <div className="flex justify-between gap-3 md:col-span-6">
              <Button type="button" variant="outline" className="min-w-24" onClick={() => form.reset()}>Clear</Button>
              <Button type="submit" className="min-w-36"><Send /> {submitLabel}</Button>
            </div>
          </form>
        </SectionCard>

        {/* The rail only has something to say once an ELPREMAR is on the activity */}
        {selected ? (
          <div className="space-y-5">
            <ElpremarRail selected={selected} bookedDay={bookedDay} />
          </div>
        ) : null}
      </div>

      <AssignElpremarDialog
        key={assigning ? "assigning" : "idle"}
        target={
          assigning
            ? {
                id: "NEW",
                title: activity?.length ? activity.join(", ") : untitled,
                subtitle: `${watch("area") || "Location not set"} · ${plant}`,
                plant,
                // A new activity has nobody on it and no approval step of its own
                approvable: false,
              }
            : null
        }
        bookings={bookings}
        onOpenChange={(open) => !open && setAssigning(false)}
        onAssign={saveAssignment}
      />
    </div>
  )
}
