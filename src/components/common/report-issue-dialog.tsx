import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { TriangleAlert } from "lucide-react"
import { toast } from "sonner"

import { FileDropField, SelectField, TextareaField, TextField } from "@/components/form/fields"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"
import { plants } from "@/data/dashboard"
import { priorities } from "@/data/operations"
import { raiseTicket } from "@/data/ticket-store"
import { ticketCategories } from "@/data/tickets"
import { useAuth } from "@/lib/auth/context"
import { required } from "@/lib/validation"

const schema = z.object({
  subject: required("Subject").max(120),
  description: required("Description").max(1000),
  category: z.enum(ticketCategories, "Choose a category"),
  priority: z.enum(priorities, "Choose a priority"),
  plant: required("Plant"),
  /* A screenshot or a nameplate photograph. Nothing is uploaded yet - see below. */
  attachment: z.instanceof(File).optional(),
})
type Values = z.infer<typeof schema>

/**
 * Report an Issue: raises a support ticket with the OLIVINE helpdesk.
 *
 * Same fields as EVITA's Report an Issue and OCC's Raise Support Ticket, so one
 * ticket model covers all three products - which is what the client asked for:
 * every enterprise-to-OCC message is a ticket, "a request or a complaint".
 * What differs here is the surface. EVITA is a tablet in a plant room, so it
 * captures photographs from the camera and fills the category in from whichever
 * job the engineer was on. EMMS-E is a desk portal: the plant is chosen rather
 * than assumed, and an attachment is a file off the machine.
 *
 * Opened from the Support Tickets screen, or from a record with that record's
 * context already filled in, so the desk never has to ask which one.
 *
 * TODO(aws): the attachment is named on the ticket but not stored - it wants S3
 * behind it. The desk sees the file name, which is enough to ask for it.
 */
export function ReportIssueDialog({
  open,
  onOpenChange,
  context,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The record the issue is about, when it is raised from one */
  context?: {
    category?: (typeof ticketCategories)[number]
    plant?: string
    assetId?: string
    inspectionId?: string
    maintenanceId?: string
  }
}) {
  const { user } = useAuth()

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      subject: "",
      description: "",
      category: context?.category ?? "Technical",
      priority: "Medium",
      plant: context?.plant ?? plants[0].name,
      attachment: undefined,
    },
  })

  function onSubmit(values: Values) {
    const now = new Date()
    const pad = (n: number) => String(n).padStart(2, "0")

    const id = raiseTicket(
      {
        plant: values.plant,
        subject: values.subject.trim(),
        category: values.category,
        raised: `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`,
        raisedBy: user?.name ?? "Enterprise Admin",
        source: "EMMSE",
        priority: values.priority,
        assetId: context?.assetId,
        inspectionId: context?.inspectionId,
        maintenanceId: context?.maintenanceId,
      },
      {
        description: values.description.trim(),
        attachments: values.attachment
          ? [
              {
                id: `${values.attachment.name}-1`,
                kind: "photo",
                label: values.attachment.name,
                caption: `Attached by ${user?.name ?? "the reporter"}`,
                meta: `${Math.max(1, Math.round(values.attachment.size / 1024))} KB`,
              },
            ]
          : [],
      }
    )

    toast.success(`Ticket ${id} raised`, {
      description: "The OLIVINE helpdesk will pick it up and keep you posted.",
    })
    form.reset()
    onOpenChange(false)
  }

  const linked = [context?.assetId, context?.inspectionId, context?.maintenanceId].filter(Boolean)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) form.reset()
        onOpenChange(next)
      }}
    >
      <DialogContent className="max-h-[92svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <TriangleAlert className="size-4 text-critical" /> Report an Issue
          </DialogTitle>
          <DialogDescription className="text-xs">
            Raises a ticket with the OLIVINE helpdesk. Anything unsafe on site should be made safe first, then
            reported here.
          </DialogDescription>
        </DialogHeader>

        <form id="report-issue" onSubmit={form.handleSubmit(onSubmit)} noValidate className="grid gap-3 sm:grid-cols-2">
          <TextField
            control={form.control}
            name="subject"
            label="Subject"
            required
            className="sm:col-span-2"
            placeholder="e.g. Health report PDF not downloading"
          />
          <TextareaField
            control={form.control}
            name="description"
            label="What is the problem?"
            required
            rows={4}
            className="sm:col-span-2"
            description="What was expected, what happened instead, and the steps that bring it back."
          />
          <SelectField control={form.control} name="category" label="Category" required options={ticketCategories} />
          <SelectField control={form.control} name="priority" label="Priority" required options={priorities} />
          <SelectField control={form.control} name="plant" label="Plant" required options={plants.map((p) => p.name)} />
          <FileDropField
            control={form.control}
            name="attachment"
            label="Attachment (optional)"
            hint="A screenshot or photograph helps the desk. PNG or JPG, max 2 MB."
            className="sm:col-span-2"
          />

          {linked.length ? (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground sm:col-span-2">
              Linked to {linked.join(" · ")} — the desk sees the record with the ticket.
            </p>
          ) : null}
        </form>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" size="sm" form="report-issue" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? <Spinner /> : null} Raise Ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
