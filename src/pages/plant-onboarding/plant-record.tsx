import { useState } from "react"
import { useForm, type FieldValues, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, isValid, parseISO } from "date-fns"
import { toast } from "sonner"
import { Factory, Folder, KeyRound, Network, Plus, X } from "lucide-react"

import { DetailSection, ValueGrid } from "@/components/common/detail-section"
import { SelectableTable } from "@/components/common/selectable-table"
import { DepartmentFields, PlantFields, SubDepartmentFields } from "@/components/form/entity-fields"
import { Button } from "@/components/ui/button"
import { setPlantManager, updatePlant } from "@/data/plant-store"
import { PlantManagerDialog } from "./steps"
import {
  blankDepartment,
  blankSubDepartment,
  departmentSchema,
  plantSchema,
  subDepartmentSchema,
  type DepartmentValues,
  type PlantEntry,
  type PlantValues,
  type SubDepartmentValues,
} from "./schemas"

const formatDate = (iso?: string) => {
  if (!iso) return undefined
  const d = parseISO(iso)
  return isValid(d) ? format(d, "dd-MM-yyyy") : iso
}

/**
 * The panel an "Add" button opens, as on OCC's enterprise page: the same fields
 * as the plant form, and nothing is written until Add is pressed.
 */
function AddPanel({
  title,
  description,
  addLabel,
  onAdd,
  onCancel,
  children,
}: {
  title: string
  description: string
  addLabel: string
  onAdd: () => void
  onCancel: () => void
  children: React.ReactNode
}) {
  return (
    <div className="rounded-md bg-card p-2.5 ring-1 ring-primary/40">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h5 className="text-xs font-semibold">{title}</h5>
          <p className="text-[0.7rem] text-muted-foreground">{description}</p>
        </div>
        <div className="flex gap-1.5">
          <Button type="button" variant="ghost" size="sm" className="h-6 text-[0.7rem]" onClick={onCancel}>
            <X className="size-3" /> Cancel
          </Button>
          <Button type="button" size="sm" className="h-6 text-[0.7rem]" onClick={onAdd}>
            <Plus className="size-3" /> {addLabel}
          </Button>
        </div>
      </div>
      <form onSubmit={(ev) => ev.preventDefault()} className="grid gap-2.5 md:grid-cols-3" noValidate>
        {children}
      </form>
    </div>
  )
}

const sectionAction = "h-6 text-[0.7rem] text-primary hover:bg-primary/10"

/**
 * A plant's record in sections, each edited on its own - the plant, its
 * manager, a department, a sub-department - the way OCC's enterprise page
 * edits an enterprise. Ported from occ-frontend `pages/enterprise-detail.tsx`.
 */
export function PlantRecordSections({ plantId, entry }: { plantId: string; entry: PlantEntry }) {
  /* Only one section edits at a time, so half-finished edits can't be scattered across the page */
  const [editing, setEditing] = useState<string | null>(null)
  const [adding, setAdding] = useState<"department" | "subs" | null>(null)
  const [managerOpen, setManagerOpen] = useState(false)
  const [deptIndex, setDeptIndex] = useState(0)
  const [subIndex, setSubIndex] = useState(0)

  const departments = entry.departments
  /* A removal elsewhere can leave the selection pointing past the end */
  const currentDept = Math.min(deptIndex, Math.max(0, departments.length - 1))
  const dept = departments[currentDept]
  const subs = dept?.subDepartments ?? []
  const currentSub = Math.min(subIndex, Math.max(0, subs.length - 1))
  const sub = subs[currentSub]

  const plantForm = useForm<PlantValues>({ resolver: zodResolver(plantSchema), values: entry })
  const departmentForm = useForm<DepartmentValues>({ resolver: zodResolver(departmentSchema), values: dept })
  const subForm = useForm<SubDepartmentValues>({ resolver: zodResolver(subDepartmentSchema), values: sub })
  const newDepartmentForm = useForm<DepartmentValues>({ resolver: zodResolver(departmentSchema), defaultValues: blankDepartment })
  const newSubForm = useForm<SubDepartmentValues>({ resolver: zodResolver(subDepartmentSchema), defaultValues: blankSubDepartment })

  // TODO: PATCH /plants/:id once the API exists
  const write = (next: PlantEntry, message: string) => {
    updatePlant(plantId, next)
    toast.success(message)
  }

  /** Validates one section's form, then writes it back and closes the section */
  const save =
    <T extends FieldValues>(form: UseFormReturn<T>, apply: (values: T) => PlantEntry, message: (values: T) => string) =>
    () =>
      void form.handleSubmit((values) => {
        write(apply(values), message(values))
        setEditing(null)
      })()

  const withDepartments = (map: (list: PlantEntry["departments"]) => PlantEntry["departments"]) => ({
    ...entry,
    departments: map(departments),
  })

  const cancelAdd = () => {
    setAdding(null)
    newDepartmentForm.reset(blankDepartment)
    newSubForm.reset(blankSubDepartment)
  }

  const addDepartment = newDepartmentForm.handleSubmit((values) => {
    // Every field is optional, so an entirely blank row would mean nothing
    if (!values.name?.trim()) {
      newDepartmentForm.setError("name", { message: "Enter a department name" })
      return
    }
    write(withDepartments((list) => [...list, { ...values, subDepartments: [] }]), `${values.name} added`)
    setDeptIndex(departments.length)
    setSubIndex(0)
    cancelAdd()
  })

  const addSubDepartment = newSubForm.handleSubmit((values) => {
    if (!dept) return
    if (!values.name?.trim()) {
      newSubForm.setError("name", { message: "Enter a sub-department name" })
      return
    }
    write(
      withDepartments((list) => list.map((d, i) => (i === currentDept ? { ...d, subDepartments: [...d.subDepartments, values] } : d))),
      `${values.name} added under ${dept.name}`
    )
    setSubIndex(subs.length)
    cancelAdd()
  })

  const busy = editing !== null || adding !== null

  return (
    <div className="space-y-2.5">
      {/* ---------- Plant ---------- */}
      <DetailSection
        icon={Factory}
        title="Plant"
        step={1}
        complete
        summary={[entry.name, entry.type].filter(Boolean).join(" · ")}
        sectionKey="plant"
        editing={editing}
        onEditingChange={setEditing}
        onSave={save(plantForm, (values) => ({ ...entry, ...values }), (values) => `${values.name} updated`)}
        view={
          <ValueGrid
            rows={[
              { label: "Plant Name", value: entry.name },
              { label: "Plant Type", value: entry.type },
              { label: "Plant Code", value: entry.code },
              { label: "Plant Head", value: [entry.salutation, entry.head].filter(Boolean).join(" ") },
              { label: "Email", value: entry.email },
              { label: "Phone Number", value: [entry.phoneCode, entry.phone].filter(Boolean).join(" ") },
              { label: "Capacity", value: [entry.capacity, entry.capacityUnit].filter(Boolean).join(" ") },
              { label: "Commissioning Date", value: formatDate(entry.commissioningDate) },
              { label: "Time Zone", value: entry.timeZone },
              { label: "Postal Code", value: entry.pin },
              { label: "City", value: entry.city },
              { label: "Latitude", value: entry.latitude },
              { label: "Longitude", value: entry.longitude },
              { label: "Address", value: entry.address, wide: true },
              { label: "Notes", value: entry.notes, wide: true },
            ]}
          />
        }
        edit={
          <form onSubmit={(ev) => ev.preventDefault()} className="grid gap-2.5 md:grid-cols-3" noValidate>
            <PlantFields form={plantForm} />
          </form>
        }
      />

      {/* ---------- Plant Manager ---------- */}
      <DetailSection
        icon={KeyRound}
        title="Plant Manager"
        step={2}
        complete={!!entry.manager}
        optional
        summary={entry.manager ? `${entry.manager.role} · ${entry.manager.email}` : undefined}
        sectionKey="manager"
        editing={editing}
        onEditingChange={setEditing}
        action={
          <Button type="button" variant="ghost" size="sm" className={sectionAction} disabled={busy} onClick={() => setManagerOpen(true)}>
            <Plus className="size-3" /> {entry.manager ? "Edit Plant Manager" : "Add Plant Manager"}
          </Button>
        }
        view={
          entry.manager ? (
            <ValueGrid
              rows={[
                { label: "Role", value: entry.manager.role },
                { label: "Email ID", value: entry.manager.email },
                // Never echo a password back
                { label: "Password", value: entry.manager.password ? "••••••••" : undefined },
              ]}
            />
          ) : (
            <p className="text-xs text-muted-foreground">No Plant Manager yet - this plant has no login of its own.</p>
          )
        }
      />

      {/* ---------- Departments ---------- */}
      <DetailSection
        icon={Network}
        title={`Departments — ${entry.name}`}
        step={3}
        complete={departments.length > 0}
        optional
        summary={dept ? `${dept.name} selected` : undefined}
        sectionKey="department"
        editing={editing}
        onEditingChange={setEditing}
        onSave={save(
          departmentForm,
          (values) => withDepartments((list) => list.map((d, i) => (i === currentDept ? { ...d, ...values } : d))),
          (values) => `${values.name || "Department"} updated`
        )}
        action={
          adding === "department" ? null : (
            <Button type="button" variant="ghost" size="sm" className={sectionAction} disabled={busy} onClick={() => setAdding("department")}>
              <Plus className="size-3" /> Add Department
            </Button>
          )
        }
        view={
          <div className="space-y-2.5">
            {adding === "department" ? (
              <AddPanel
                title={`Add a department to ${entry.name}`}
                description="A plant can have as many departments as it needs."
                addLabel="Add Department"
                onAdd={addDepartment}
                onCancel={cancelAdd}
              >
                <DepartmentFields form={newDepartmentForm} />
              </AddPanel>
            ) : null}

            <SelectableTable
              rows={departments.map((d, i) => ({ ...d, id: String(i) }))}
              selectedId={String(currentDept)}
              onSelect={(id) => {
                setDeptIndex(Number(id))
                setSubIndex(0)
              }}
              empty="No departments under this plant"
              columns={[
                { key: "name", label: "Department", render: (r) => <span className="font-medium">{r.name}</span> },
                { key: "code", label: "Code", render: (r) => <span className="tabular-nums">{r.code}</span> },
                { key: "type", label: "Type", hideBelow: "md", render: (r) => r.type },
                { key: "head", label: "Head", hideBelow: "md", render: (r) => [r.salutation, r.head].filter(Boolean).join(" ") || "-" },
                { key: "email", label: "Email", hideBelow: "lg", render: (r) => r.email || "-" },
                { key: "subs", label: "Sub-depts", align: "right", render: (r) => <span className="tabular-nums">{r.subDepartments.length}</span> },
              ]}
            />

            {dept ? (
              <div className="rounded-md bg-muted/30 p-2.5">
                <p className="mb-2 text-[0.62rem] tracking-wide text-muted-foreground uppercase">Selected department</p>
                <ValueGrid
                  rows={[
                    { label: "Department Name", value: dept.name },
                    { label: "Department Code", value: dept.code },
                    { label: "Department Type", value: dept.type },
                    { label: "Parent Department", value: dept.parent },
                    { label: "Head of Department", value: [dept.salutation, dept.head].filter(Boolean).join(" ") },
                    { label: "Email", value: dept.email },
                    { label: "Phone Number", value: dept.phone ? [dept.phoneCode, dept.phone].join(" ") : undefined },
                    { label: "Description", value: dept.description },
                  ]}
                />
              </div>
            ) : null}
          </div>
        }
        edit={
          dept ? (
            <form onSubmit={(ev) => ev.preventDefault()} className="grid gap-2.5 md:grid-cols-3" noValidate>
              <p className="text-[0.7rem] text-muted-foreground md:col-span-3">
                Editing <strong>{dept.name}</strong> under <strong>{entry.name}</strong>
              </p>
              <DepartmentFields form={departmentForm} />
            </form>
          ) : undefined
        }
      />

      {/* ---------- Sub-departments of the selected department ---------- */}
      <DetailSection
        icon={Folder}
        title={`Sub-departments — ${dept?.name ?? "no department selected"}`}
        step={4}
        complete={subs.length > 0}
        optional
        summary={sub ? `${sub.name} selected` : undefined}
        sectionKey="subs"
        editing={editing}
        onEditingChange={setEditing}
        onSave={save(
          subForm,
          (values) =>
            withDepartments((list) =>
              list.map((d, i) =>
                i !== currentDept ? d : { ...d, subDepartments: d.subDepartments.map((s, k) => (k === currentSub ? { ...s, ...values } : s)) }
              )
            ),
          (values) => `${values.name || "Sub-department"} updated`
        )}
        action={
          adding === "subs" || !dept ? null : (
            <Button type="button" variant="ghost" size="sm" className={sectionAction} disabled={busy} onClick={() => setAdding("subs")}>
              <Plus className="size-3" /> Add Sub-department
            </Button>
          )
        }
        view={
          <div className="space-y-2.5">
            {adding === "subs" && dept ? (
              <AddPanel
                title={`Add a sub-department to ${dept.name}`}
                description="Sub-departments give granular asset and maintenance tracking."
                addLabel="Add Sub-department"
                onAdd={addSubDepartment}
                onCancel={cancelAdd}
              >
                <SubDepartmentFields form={newSubForm} />
              </AddPanel>
            ) : null}

            {dept ? (
              <SelectableTable
                rows={subs.map((s, i) => ({ ...s, id: String(i) }))}
                selectedId={String(currentSub)}
                onSelect={(id) => setSubIndex(Number(id))}
                empty="No sub-departments under this department."
                columns={[
                  { key: "name", label: "Name", render: (r) => <span className="font-medium">{r.name}</span> },
                  { key: "code", label: "Code", render: (r) => <span className="tabular-nums">{r.code}</span> },
                  { key: "function", label: "Function", render: (r) => r.function },
                  { key: "description", label: "Description", hideBelow: "sm", render: (r) => r.description },
                ]}
              />
            ) : (
              <p className="text-xs text-muted-foreground">Select a department to see its sub-departments.</p>
            )}
          </div>
        }
        edit={
          sub ? (
            <form onSubmit={(ev) => ev.preventDefault()} className="grid gap-2.5 md:grid-cols-3" noValidate>
              <p className="text-[0.7rem] text-muted-foreground md:col-span-3">
                Editing <strong>{sub.name}</strong> under <strong>{dept?.name}</strong>
              </p>
              <SubDepartmentFields form={subForm} />
            </form>
          ) : undefined
        }
      />

      {/* Keyed so each open starts from what is currently saved */}
      <PlantManagerDialog
        key={String(managerOpen)}
        open={managerOpen}
        onOpenChange={setManagerOpen}
        plantName={entry.name}
        existing={entry.manager}
        onSave={(manager) => {
          setPlantManager(plantId, manager)
          toast.success(`Plant Manager ${entry.manager ? "updated" : "added"}`)
        }}
      />
    </div>
  )
}
