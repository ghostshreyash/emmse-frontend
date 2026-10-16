import { useState } from "react"
import { format, isValid, parse } from "date-fns"
import { Check } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { crew, daySlots, priorities, slotLabel, type Priority } from "@/data/operations"
import type { TaskDetail } from "@/data/task-detail"
import { taskTypes, type TaskRow, type TaskType } from "@/data/tasks"

export type TaskEdit = {
  row: Pick<TaskRow, "type" | "scheduled" | "slot" | "elpremar">
  detail: Pick<TaskDetail, "priority" | "description">
}

/**
 * Edit an Open maintenance task: what kind of work it is, when and by whom it is
 * booked, its priority and its description. Asset and plant stay as raised - a
 * different asset is a different task.
 */
export function EditTaskDialog({
  task,
  detail,
  open,
  onOpenChange,
  onSave,
}: {
  task: TaskRow
  detail: TaskDetail
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (edit: TaskEdit) => void
}) {
  const [type, setType] = useState<TaskType>(task.type)
  // A date input holds yyyy-MM-dd; the book holds dd-MM-yyyy
  const [date, setDate] = useState(() => format(parse(task.scheduled, "dd-MM-yyyy", new Date()), "yyyy-MM-dd"))
  const [slot, setSlot] = useState(task.slot)
  const [elpremar, setElpremar] = useState(task.elpremar)
  const [priority, setPriority] = useState<Priority>(detail.priority)
  const [description, setDescription] = useState(detail.description)

  const day = parse(date, "yyyy-MM-dd", new Date())
  const ready = isValid(day) && description.trim().length > 0

  const save = () =>
    onSave({
      row: { type, scheduled: format(day, "dd-MM-yyyy"), slot, elpremar },
      detail: { priority, description: description.trim() },
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl!">
        <DialogHeader>
          <DialogTitle>Edit {task.id}</DialogTitle>
          <DialogDescription>
            {task.asset} · {task.plant}. It has not started yet, so its booking and details can still change.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Row label="Task Type" htmlFor="edit-type">
            <Select value={type} onValueChange={(v) => setType(v as TaskType)}>
              <SelectTrigger id="edit-type" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {taskTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </Row>
          <Row label="Priority" htmlFor="edit-priority">
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger id="edit-priority" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {priorities.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </Row>
          <Row label="Scheduled Date" htmlFor="edit-date">
            <Input id="edit-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </Row>
          <Row label="Time" htmlFor="edit-slot">
            <Select value={String(slot)} onValueChange={(v) => setSlot(Number(v))}>
              <SelectTrigger id="edit-slot" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {daySlots.map((h) => <SelectItem key={h} value={String(h)}>{slotLabel(h)}</SelectItem>)}
              </SelectContent>
            </Select>
          </Row>
          <Row label="Assigned ELPREMAR" htmlFor="edit-elpremar" className="sm:col-span-2">
            <Select value={elpremar} onValueChange={setElpremar}>
              <SelectTrigger id="edit-elpremar" className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {crew.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </Row>
          <Row label="Task Description" htmlFor="edit-description" className="sm:col-span-2">
            <Textarea
              id="edit-description"
              rows={3}
              maxLength={500}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              aria-invalid={!description.trim()}
            />
          </Row>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={!ready}>
            <Check /> Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Row({ label, htmlFor, className, children }: { label: string; htmlFor: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={className ? `space-y-1 ${className}` : "space-y-1"}>
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}
