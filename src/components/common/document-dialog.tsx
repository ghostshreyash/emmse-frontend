import { useState } from "react"
import { Download, ExternalLink, FileText, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { Spinner } from "@/components/ui/spinner"

export type OpenDocument = {
  title: string
  /** URL of the PDF */
  file: string
  /** What the document is, in a line */
  detail?: string
  /** What the file is called when it is saved */
  fileName?: string
}

/**
 * A report read where it was opened from.
 *
 * Opening a report in a tab of its own loses the row the reader was working
 * down, and on this screen that row is the asset they were comparing - so the
 * reader keeps the page behind it and closes back onto the same row. Open and
 * Download are on its bar for anyone who does want the file elsewhere.
 *
 * The page itself is drawn by the browser's own PDF viewer in a frame, so
 * scrolling, zoom, page numbers and search are the ones the reader already
 * knows and EMMS-E carries no PDF renderer of its own. A frame is how a desktop
 * browser shows a PDF; where one will not render inline, Open is the way out,
 * which is why it is on the bar rather than behind the frame.
 *
 * Ported from EVITA's `components/evita/document-dialog.tsx`. EVITA opens it
 * through its app-wide panel store; EMMS-E has no such store, so the screen
 * that opens a document owns the state and passes it in.
 */
export function DocumentDialog({ document, onClose }: { document: OpenDocument | null; onClose: () => void }) {
  /*
   * Which file has drawn, rather than whether one has.
   *
   * The frame fires `load` for a failed render too, so this only clears the
   * spinner. Holding the file name rather than a boolean means it corrects
   * itself when a different report is opened: a flag set true by the first
   * document stayed true for the second, which skipped the spinner and, worse,
   * hid the "nothing showing" note for a frame that had not drawn at all. That
   * shows up as soon as reports are opened one after another from the table.
   */
  const [drawnFile, setDrawnFile] = useState<string | null>(null)

  if (!document) return null

  const drawn = drawnFile === document.file

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        /*
         * Tall rather than wide. A PDF page is portrait, so width past about
         * three quarters of the height is margin the viewer pads out either side
         * of the page. Marked important, as the other wide dialogs here are:
         * DialogContent's own `max-w-[calc(100%-2rem)]` is an arbitrary value
         * `cn` cannot merge away, and it is written after this one.
         */
        className="grid h-[94svh] w-[calc(100%-1rem)] max-w-[68rem]! grid-rows-[auto_1fr] gap-0 overflow-hidden p-0 sm:w-[calc(100%-2rem)]"
      >
        {/* The bar: what is open on the left, what can be done with it on the right */}
        <header className="flex min-w-0 items-center gap-2 border-b bg-card px-3 py-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-critical-soft text-critical">
            <FileText className="size-4" />
          </span>
          <span className="min-w-0 flex-1">
            <DialogTitle className="truncate text-sm leading-tight">{document.title}</DialogTitle>
            <DialogDescription className="truncate text-xs">{document.detail ?? "PDF document"}</DialogDescription>
          </span>

          <Button variant="outline" size="sm" className="shrink-0 max-sm:hidden" asChild>
            <a href={document.file} target="_blank" rel="noopener noreferrer">
              <ExternalLink /> Open
            </a>
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Open in a new tab" className="shrink-0 sm:hidden" asChild>
            <a href={document.file} target="_blank" rel="noopener noreferrer">
              <ExternalLink />
            </a>
          </Button>
          <Button variant="outline" size="sm" className="shrink-0" asChild>
            <a href={document.file} download={document.fileName}>
              <Download /> Download
            </a>
          </Button>
          <Button size="sm" className="shrink-0" onClick={onClose}>
            Close
          </Button>
        </header>

        <div className="relative min-h-0 bg-muted">
          {!drawn ? (
            <p className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Spinner /> Opening {document.title}…
            </p>
          ) : null}

          {/*
           * `view=FitH` fits the page across the frame, which is how a report is
           * read; the side panel is off, as the frame cannot spare the column.
           */}
          <iframe
            key={document.file}
            src={`${document.file}#view=FitH&navpanes=0`}
            title={document.title}
            onLoad={() => setDrawnFile(document.file)}
            className="size-full border-0"
          />

          {drawn ? null : (
            <p className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-attention-soft px-3 py-2 text-xs text-attention-soft-foreground">
              <TriangleAlert className="size-3.5 shrink-0" />
              Nothing showing? Use Open to read it in a tab.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
