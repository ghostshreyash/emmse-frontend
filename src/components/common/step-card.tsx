import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"

/** White card holding a form, with its Cancel / Back / submit footer (from occ-frontend) */
export function StepCard({
  title,
  description,
  children,
  onBack,
  onCancel,
  nextLabel,
  nextIcon = <ArrowRight />,
  pending = false,
  formId,
  extraAction,
}: {
  title: string
  description?: string
  children: React.ReactNode
  onBack?: () => void
  onCancel?: () => void
  nextLabel: string
  nextIcon?: React.ReactNode
  /** Disables the footer and shows a spinner while the step is submitting */
  pending?: boolean
  /** id of the <form> the Next button submits */
  formId: string
  /** An extra footer action, shown just before Next */
  extraAction?: React.ReactNode
}) {
  return (
    <section className="rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10 transition-shadow duration-200 ease-out hover:shadow-md">
      <h3 className="mb-2.5 text-sm font-bold text-brand-navy dark:text-foreground">{title}</h3>
      {description ? <p className="-mt-2 mb-2.5 text-xs text-muted-foreground">{description}</p> : null}
      {children}
      <div className="mt-4 flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={pending}>
            Cancel
          </Button>
        ) : null}
        {onBack ? (
          <Button type="button" variant="outline" size="sm" onClick={onBack} disabled={pending}>
            <ArrowLeft /> Back
          </Button>
        ) : null}
        {extraAction}
        <Button type="submit" form={formId} size="sm" className="min-w-28" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="animate-spin" /> Saving…
            </>
          ) : (
            <>
              {nextLabel} {nextIcon}
            </>
          )}
        </Button>
      </div>
    </section>
  )
}

