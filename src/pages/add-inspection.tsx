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
import { MultiSelectField, SelectField, TextareaField, TextField } from "@/components/form/fields"
import { plants as enterprisePlants } from "@/data/dashboard"
import { useElpremarBookings } from "@/data/elpremar-bookings"
import { activityTypes, areas, assetCategories, durations, priorities, slotLabel, type Elpremar } from "@/data/operations"
import { control as controlSize } from "@/lib/data-table"
import { required, today } from "@/lib/validation"

/** This enterprise's plants; the enterprise itself is fixed, so it is not asked for */
const plants = enterprisePlants.map((p) => p.name)

const schema = z.object({
  plant: required("Plant"),
  area: required("Location / Area"),
  // The category is required before assigning; the exact activity may still be unknown at intake
  category: required("Asset Category"),
  // Several inspections can be booked in one go, so the activity takes more than one type
  activity: z.array(z.string()).optional(),
  // Two digits, so one activity covers 1-99 assets; blank means it was not counted
  assetCount: z
    .string()
    .optional()
    .refine((v) => !v || /^\d{1,2}$/.test(v), "Enter a number up to 2 digits")
    .refine((v) => !v || Number(v) >= 1, "Enter at least 1 asset"),
  // Booked from today on; yyyy-MM-dd compares correctly as text
  date: required("Scheduled date").refine((v) => v >= today(), "Pick today or a later date"),
  time: required("Start time"),
  duration: z.string().optional(),
  description: required("Task description"),
  priority: required("Priority"),
})
type AssignValues = z.infer<typeof schema>

/** The intake form for a new inspection activity, reached from the Inspections list (ported from OCC) */
export function AddInspectionPage() {
  const form = useForm<AssignValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      plant: plants[0], area: "", category: "", assetCount: "", activity: [],
      date: "", time: "", duration: "4 Hours", description: "", priority: "Medium",
    },
  })
  const { control, watch, setValue } = form

  /** Who the activity is booked to. Nothing is chosen until the dialog commits. */
  const [selected, setSelected] = useState<Elpremar | null>(null)
  const [assigning, setAssigning] = useState(false)

  const plant = watch("plant")
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

  const assign = form.handleSubmit(() => {
    if (!selected) {
      toast.error("Assign an ELPREMAR before adding the activity")
      return
    }
    // TODO: POST /inspection-activities
    toast.success(`Activity assigned to ${selected.name}`)
    form.reset()
    setSelected(null)
  })

  return (
    <div className="space-y-5">
      <PageHeader
        title="Add Inspection Activity"
        breadcrumbs={[{ label: "Inspections", to: "/inspection-activities" }, { label: "Add Inspection Activity" }]}
        actions={
          <>
            <Button variant="outline" size="sm" className={cn(controlSize, "bg-card")} asChild>
              <Link to="/inspection-activities"><ArrowLeft className="size-3.5" /> Back to Inspections</Link>
            </Button>
          </>
        }
      />

      {/* The rail only exists once someone is assigned, so the form has the width until then */}
      <div className={cn("grid gap-5", selected && "xl:grid-cols-[1fr_24rem]")}>
        <SectionCard title="Assign Activity to ELPREMAR" hoverable={false}>
          <p className="-mt-1 mb-4 text-xs text-muted-foreground">Create and assign a new inspection activity for electrical asset assessment at the selected location.</p>
          <form onSubmit={assign} className="grid gap-4 md:grid-cols-6" noValidate>
            <SelectField control={control} name="plant" label="Plant" required options={plants} className="md:col-span-3" />
            <SelectField control={control} name="area" label="Location / Area" required options={areas} className="md:col-span-3" />
            <SelectField control={control} name="category" label="Asset Category" required options={assetCategories} className="md:col-span-2" />
            <TextField
              control={control}
              name="assetCount"
              label="No. of Assets"
              inputMode="numeric"
              maxLength={2}
              placeholder="e.g. 12"
              // Digits only, and never more than two of them, so the cap holds while typing
              onValueChange={(v) => {
                const digits = v.replace(/\D/g, "").slice(0, 2)
                if (digits !== v) setValue("assetCount", digits, { shouldValidate: true })
              }}
              className="md:col-span-2"
            />
            <MultiSelectField control={control} name="activity" label="Activity Type" options={activityTypes} placeholder="Select one or more" className="md:col-span-2" />
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
              <Button type="submit" className="min-w-36"><Send /> Add Activity</Button>
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
                title: activity?.length ? activity.join(", ") : "New Inspection Activity",
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
