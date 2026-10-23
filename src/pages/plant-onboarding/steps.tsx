import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "cn"
import { Check, Folder, KeyRound, Network, Pencil, Plus, Trash2, UserRound } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { PasswordField, SelectField, TextField } from "@/components/form/fields"
import { DepartmentFields, PlantFields, SubDepartmentFields } from "@/components/form/entity-fields"
import { PasswordStrength } from "@/components/form/password-requirements"
import { StepCard } from "@/components/common/step-card"
import { plantManagerRoles } from "@/data/plant-master-data"
import {
  blankDepartment,
  blankPlant,
  blankSubDepartment,
  departmentSchema,
  plantManagerSchema,
  plantSchema,
  subDepartmentSchema,
  type DepartmentEntry,
  type DepartmentValues,
  type OnboardingData,
  type PlantEntry,
  type PlantManagerValues,
  type PlantValues,
  type SubDepartmentValues,
} from "./schemas"

/** The plant form owns its plant and departments, and submits them on its own terms */
type ListStepProps = {
  data: OnboardingData
  onPlantsChange: (plants: PlantEntry[]) => void
  onSubmit: (plants: PlantEntry[]) => void
  pending?: boolean
}

/**
 *  The rows a list-building step has collected so far. A row can be reopened in
 * the form above it or dropped; the row being edited is tinted, so it is clear
 * the form is amending rather than adding.
 */
function EntryList<T>({
  items,
  columns,
  editingIndex,
  onEdit,
  onRemove,
  empty,
  rowLabel,
}: {
  items: T[]
  columns: { label: string; value: (item: T) => string | undefined; hideBelow?: "sm" | "md" }[]
  editingIndex: number | null
  onEdit: (index: number) => void
  onRemove: (index: number) => void
  empty: string
  rowLabel: (item: T, index: number) => string
}) {
  const hide = { sm: "hidden sm:table-cell", md: "hidden md:table-cell" }
  return (
    <div className="mt-4 overflow-hidden rounded-lg ring-1 ring-border">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/70">
            <TableHead className="w-10">#</TableHead>
            {columns.map((c) => (
              <TableHead key={c.label} className={c.hideBelow ? hide[c.hideBelow] : undefined}>{c.label}</TableHead>
            ))}
            <TableHead className="w-24 text-center">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length + 2} className="py-6 text-center text-muted-foreground">
                {empty}
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, i) => (
              <TableRow key={i} className={editingIndex === i ? "bg-accent" : undefined}>
                <TableCell>{i + 1}</TableCell>
                {columns.map((c) => (
                  <TableCell key={c.label} className={cn("max-w-56 truncate", c.hideBelow && hide[c.hideBelow])}>
                    {c.value(item)}
                  </TableCell>
                ))}
                <TableCell className="text-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-primary"
                    aria-label={`Edit ${rowLabel(item, i)}`}
                    onClick={() => onEdit(i)}
                  >
                    <Pencil />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="text-critical"
                    aria-label={`Remove ${rowLabel(item, i)}`}
                    onClick={() => onRemove(i)}
                  >
                    <Trash2 />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}

/* ---------------- Step 1 ---------------- */

/**
 * The plant's own login. An enterprise adds a Plant Manager here - EMMSE-0
 * operatives are OLIVINE's to assign, so that role is not offered.
 */
export function PlantManagerDialog({
  open,
  onOpenChange,
  plantName,
  existing,
  onSave,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  plantName: string
  existing?: PlantManagerValues
  onSave: (values: PlantManagerValues) => void
}) {
  const form = useForm<PlantManagerValues>({
    resolver: zodResolver(plantManagerSchema),
    defaultValues: existing ?? { role: plantManagerRoles[0], email: "", password: "" },
  })
  const pwd = form.watch("password")

  const submit = form.handleSubmit((values) => {
    onSave(values)
    onOpenChange(false)
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-1.5 text-base">
            <KeyRound className="size-4 text-primary" /> {existing ? "Edit" : "Add"} Plant Manager
          </DialogTitle>
          <DialogDescription>
            Creates a login for {plantName || "this plant"}. They sign in with this e-mail address.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="grid gap-4" noValidate>
          <SelectField
            control={form.control}
            name="role"
            label="Role"
            required
            options={plantManagerRoles}
          />

          <TextField control={form.control} name="email" label="Email ID" required type="email" autoComplete="email" />
          <div className="space-y-2">
            <PasswordField control={form.control} name="password" label="Password" required />
            <PasswordStrength value={pwd} />
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={submit}><Plus className="size-3.5" /> Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


/**
 * Plant, departments and sub-departments in one step.
 *
 * They are one structure, not three: a department only exists under a plant and
 * a sub-department only under a department, so splitting them across steps made
 * the operator walk forward and back to see what they were attaching to.
 *
 * The plant form is the source of truth for the plant's own fields, and every
 * list action persists `{...plantValues, departments}` together — so a
 * department added before the plant has been "submitted" still has a plant to
 * belong to. The plant's own validation is only enforced on Next.
 *
 * `plantIndex` is which plant in the list the three sections are editing.
 * "Add More Plant" commits the current one and points it at a fresh slot, so an
 * enterprise can be onboarded with several plants in one pass.
 */
export function PlantStructureStep({
  data,
  onPlantsChange,
  onSubmit,
  onCancel,
  pending,
  title,
  submitLabel = "Submit",
}: ListStepProps & { title: string; onCancel?: () => void; submitLabel?: string }) {
  /* One plant per submit, so the sections below always edit the first slot */
  const plantIndex = 0
  const existing = data.plants[plantIndex]
  const plantForm = useForm<PlantValues>({ resolver: zodResolver(plantSchema), defaultValues: existing ?? blankPlant })
  const deptForm = useForm<DepartmentValues>({ resolver: zodResolver(departmentSchema), defaultValues: blankDepartment })
  const subForm = useForm<SubDepartmentValues>({ resolver: zodResolver(subDepartmentSchema), defaultValues: blankSubDepartment })

  const [editingDept, setEditingDept] = useState<number | null>(null)
  const [editingSub, setEditingSub] = useState<number | null>(null)
  const [deptIndex, setDeptIndex] = useState(0)
  const [deptError, setDeptError] = useState("")
  const [subError, setSubError] = useState("")
  const [managerOpen, setManagerOpen] = useState(false)

  const departments = existing?.departments ?? []
  /* A removal in this same step can leave the selection pointing past the end */
  const currentDept = Math.min(deptIndex, Math.max(0, departments.length - 1))
  const dept = departments[currentDept]
  const subs = dept?.subDepartments ?? []
  const manager = existing?.manager

  /* Reading the plant form at write time is what lets the three sections coexist */
  const commit = (departmentList: DepartmentEntry[], values = plantForm.getValues()) => {
    const next = [...data.plants]
    next[plantIndex] = { ...values, departments: departmentList, ...(manager ? { manager } : {}) }
    return next
  }

  /* Saving a manager writes the plant straight away, so the account is not lost
     if the operator moves on without submitting the plant form */
  const saveManager = (values: PlantManagerValues) => {
    const next = [...data.plants]
    next[plantIndex] = { ...plantForm.getValues(), departments, manager: values }
    onPlantsChange(next)
  }

  const writeDepartments = (next: DepartmentEntry[]) => onPlantsChange(commit(next))

  const filled = (v: Record<string, unknown>, keys: string[]) => keys.some((k) => String(v[k] ?? "").trim() !== "")

  /**
   * The departments as they stand, plus anything typed into the two forms but
   * never added with the button.
   *
   * Leaving the plant used to discard those rows, which reads as "I added a
   * department and it vanished" — the operator filled the fields and moved on.
   * Carrying them keeps what was entered.
   */
  const departmentsIncludingTyped = () => {
    let list = departments

    // Sub-department first: it attaches to a department that already exists
    const sv = subForm.getValues()
    if (dept && filled(sv, ["name", "code", "function"])) {
      list = list.map((d, j) =>
        j !== currentDept
          ? d
          : {
              ...d,
              subDepartments:
                editingSub !== null
                  ? d.subDepartments.map((x, k) => (k === editingSub ? sv : x))
                  : [...d.subDepartments, sv],
            }
      )
    }

    const dv = deptForm.getValues()
    if (filled(dv, ["name", "code", "type"])) {
      list =
        editingDept !== null
          ? list.map((d, j) => (j === editingDept ? { ...dv, subDepartments: d.subDepartments } : d))
          : [...list, { ...dv, subDepartments: [] }]
    }

    return list
  }

  const saveDepartment = deptForm.handleSubmit((values) => {
    // Every field is optional, so an entirely blank row would mean nothing
    if (!values.name?.trim() && !values.code?.trim() && !values.type?.trim()) {
      setDeptError("Enter a name, code or type before adding a department.")
      return
    }
    const next = [...departments]
    if (editingDept !== null) next[editingDept] = { ...values, subDepartments: next[editingDept].subDepartments }
    else next.push({ ...values, subDepartments: [] })
    writeDepartments(next)
    setEditingDept(null)
    setDeptError("")
    deptForm.reset(blankDepartment)
  })

  const removeDepartment = (i: number) => {
    writeDepartments(departments.filter((_, n) => n !== i))
    if (editingDept === i) {
      setEditingDept(null)
      deptForm.reset(blankDepartment)
    }
  }

  const writeSubs = (next: SubDepartmentValues[]) =>
    writeDepartments(departments.map((d, j) => (j === currentDept ? { ...d, subDepartments: next } : d)))

  const saveSubDepartment = subForm.handleSubmit((values) => {
    if (!values.name?.trim() && !values.code?.trim() && !values.function?.trim()) {
      setSubError("Enter a name, code or function before adding a sub-department.")
      return
    }
    const next = [...subs]
    if (editingSub !== null) next[editingSub] = values
    else next.push(values)
    writeSubs(next)
    setEditingSub(null)
    setSubError("")
    subForm.reset(blankSubDepartment)
  })

  return (
    <StepCard title={title} formId="step-structure" nextLabel={submitLabel} nextIcon={<Check />} pending={pending} onCancel={onCancel}>
      {/* ---------- 1. Plant ---------- */}
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h4 className="font-semibold">1. Plant Details</h4>
          <p className="text-xs text-muted-foreground">Fields marked with * are mandatory.</p>
        </div>
        <div className="flex items-center gap-2">
          {manager ? (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UserRound className="size-3.5" /> {manager.role}: {manager.email}
            </span>
          ) : null}
          <Button type="button" onClick={() => setManagerOpen(true)}>
            <Plus /> {manager ? "Edit Plant Manager" : "Add Plant Manager"}
          </Button>
        </div>
      </div>
      <form
        id="step-structure"
        onSubmit={plantForm.handleSubmit((values) => onSubmit(commit(departmentsIncludingTyped(), values)))}
        className="grid gap-2.5 md:grid-cols-3"
        noValidate
      >
        <PlantFields form={plantForm} />
      </form>

      {/* ---------- 2. Departments ---------- */}
      <div className="mt-6 mb-3 flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        <div>
          <h4 className="font-semibold">
            2. {editingDept !== null ? `Editing department ${editingDept + 1}` : "Departments"}
          </h4>
          <p className="text-xs text-muted-foreground">
            Optional — add as many departments as this plant has, or continue without any.
          </p>
        </div>
        <div className="flex gap-2">
          {editingDept !== null ? (
            <Button type="button" variant="outline" onClick={() => { setEditingDept(null); deptForm.reset(blankDepartment) }}>
              Cancel edit
            </Button>
          ) : null}
          <Button type="button" onClick={saveDepartment}>
            <Plus /> {editingDept !== null ? "Update Department" : "Add Department"}
          </Button>
        </div>
      </div>

      <div className="grid gap-2.5 md:grid-cols-3">
        <DepartmentFields form={deptForm} />
      </div>

      <EntryList
        items={departments}
        editingIndex={editingDept}
        onEdit={(i) => { setEditingDept(i); deptForm.reset(departments[i]) }}
        onRemove={removeDepartment}
        empty="No departments added under this plant yet."
        rowLabel={(d, i) => d.name || `department ${i + 1}`}
        columns={[
          { label: "Department", value: (d) => d.name },
          { label: "Code", value: (d) => d.code },
          { label: "Type", value: (d) => d.type, hideBelow: "sm" },
          { label: "Head", value: (d) => [d.salutation, d.head].filter(Boolean).join(" "), hideBelow: "md" },
          { label: "Sub-depts", value: (d) => String(d.subDepartments.length) },
        ]}
      />
      {deptError ? <p className="mt-2 text-sm text-critical">{deptError}</p> : null}

      {/* ---------- 3. Sub-departments ---------- */}
      <h4 className="mt-6 border-t pt-4 font-semibold">3. Sub-departments</h4>
      <p className="mb-3 text-xs text-muted-foreground">
        Optional — pick a department, then add one or more sub-departments under it.
      </p>

      <div className="sm:max-w-80">
        <Label htmlFor="sub-dept" className="mb-1.5 block text-xs font-medium">Department</Label>
        <Select
          value={departments.length > 0 ? String(currentDept) : undefined}
          onValueChange={(v) => {
            setDeptIndex(Number(v))
            setEditingSub(null)
            subForm.reset(blankSubDepartment)
          }}
          disabled={departments.length === 0}
        >
          <SelectTrigger id="sub-dept" className="w-full">
            <Network className="size-3.5 text-muted-foreground" />
            <SelectValue placeholder="Add a department above first" />
          </SelectTrigger>
          <SelectContent position="popper" side="bottom" align="start" avoidCollisions={false}>
            {departments.map((d, i) => (
              <SelectItem key={i} value={String(i)}>
                {d.name || `Department ${i + 1}`}
                <span className="ml-2 text-muted-foreground">
                  {d.subDepartments.length} sub-dept{d.subDepartments.length === 1 ? "" : "s"}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {dept ? (
        <>
          <div className="mt-3 mb-3 flex flex-wrap items-center justify-between gap-2">
            <h4 className="font-semibold">
              {editingSub !== null ? `Editing sub-department ${editingSub + 1}` : "New sub-department"} — {dept.name}
            </h4>
            <div className="flex gap-2">
              {editingSub !== null ? (
                <Button type="button" variant="outline" onClick={() => { setEditingSub(null); subForm.reset(blankSubDepartment) }}>
                  Cancel edit
                </Button>
              ) : null}
              <Button type="button" onClick={saveSubDepartment}>
                <Plus /> {editingSub !== null ? "Update Sub-department" : "Add Sub-department"}
              </Button>
            </div>
          </div>

          <div className="grid gap-2.5 md:grid-cols-3">
            <SubDepartmentFields form={subForm} />
          </div>

          <EntryList
            items={subs}
            editingIndex={editingSub}
            onEdit={(i) => { setEditingSub(i); subForm.reset(subs[i]) }}
            onRemove={(i) => {
              writeSubs(subs.filter((_, n) => n !== i))
              if (editingSub === i) {
                setEditingSub(null)
                subForm.reset(blankSubDepartment)
              }
            }}
            empty={`No sub-departments added under ${dept.name || "this department"} yet.`}
            rowLabel={(s, i) => s.name || `sub-department ${i + 1}`}
            columns={[
              { label: "Sub-department Name", value: (s) => s.name },
              { label: "Code", value: (s) => s.code },
              { label: "Function", value: (s) => s.function },
              { label: "Description", value: (s) => s.description, hideBelow: "sm" },
            ]}
          />
          {subError ? <p className="mt-2 text-sm text-critical">{subError}</p> : null}
        </>
      ) : (
        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Folder className="size-4" />
          Add a department above first — a sub-department sits under one.
        </p>
      )}

      {/* Keyed so each open starts from what is currently saved */}
      <PlantManagerDialog
        key={`${plantIndex}-${managerOpen}`}
        open={managerOpen}
        onOpenChange={setManagerOpen}
        plantName={plantForm.getValues("name")}
        existing={manager}
        onSave={saveManager}
      />
    </StepCard>
  )
}
