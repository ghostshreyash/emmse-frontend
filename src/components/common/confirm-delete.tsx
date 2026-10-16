import { Trash2 } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

/** The small red bin beside an Open row's status badge */
export function DeleteRowButton({ id, onClick }: { id: string; onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="icon-xs"
      className="text-critical hover:bg-critical-soft hover:text-critical"
      aria-label={`Delete ${id}`}
      title="Delete"
      onClick={onClick}
    >
      <Trash2 />
    </Button>
  )
}

/**
 * Asks before an Open task or inspection is deleted. Shared by the Maintenance
 * Tasks and Inspections lists, so both say the same thing.
 */
export function ConfirmDelete({
  id,
  summary,
  onCancel,
  onConfirm,
}: {
  /** The record waiting on confirmation; the dialog is shut while this is empty */
  id?: string
  /** One line saying what it is, so the right row is deleted */
  summary?: string
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog open={!!id} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {id}?</AlertDialogTitle>
          <AlertDialogDescription>
            {summary ? `${summary}. ` : ""}It has not started, so nothing is lost but the booking. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            <Trash2 /> Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
