import { useMemo, useState } from "react"
import { useNavigate } from "react-router"
import { differenceInMonths, format, isValid, parse } from "date-fns"
import { toast } from "sonner"
import { Clock, Info, Search, Send } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/common/page-header"
import { AssetIllustration, ClearButton, HealthGauge } from "@/components/tasks/add-task-parts"
import { assetRegister, departments, findAsset, type AssetRecord } from "@/data/assets"
import { plants } from "@/data/dashboard"
import { assetCategories, crew } from "@/data/operations"
import { addTask, useTaskRows } from "@/data/task-store"
import type { TaskType } from "@/data/tasks"
import { useAuth } from "@/lib/auth/context"
import { healthStatus } from "@/lib/status"

/* ---------- Options ---------- */

const maintenanceKinds = ["Routine Cleaning", "Corrective Maintenance", "Condition Based"] as const
type MaintenanceKind = (typeof maintenanceKinds)[number]

/** How each box on the form files into the Tasks list's Type column */
const kindToType: Record<MaintenanceKind, TaskType> = {
  "Routine Cleaning": "Preventive",
  "Corrective Maintenance": "Corrective",
  "Condition Based": "Condition-Based",
}

const instaFluids = [
  { name: "INSTA 50", hint: "Light contamination" },
  { name: "INSTA 100", hint: "Medium contamination" },
  { name: "INSTA 200", hint: "Heavy contamination" },
] as const

const fireSystems = ["Olivine FPS - Model X1", "Olivine FPS - Model X2", "Aerosol suppression module", "Thermal fuse link with auto cut-off"]
const pdMethods = ["Ultrasonic Cleaning + Insulation Treatment", "Corona shield application", "Insulation re-taping at terminations", "Nano-coating on HT insulators"]
const cleaningMethods = ["Spray & wipe", "Foam application", "Ultrasonic cleaning", "Brush & vacuum"]
const compartments = ["Busbar chamber", "Terminations", "Insulators", "Cable box", "Breaker compartment", "Enclosure"]
const contaminationLevels = ["Light", "Medium", "Heavy"]
const conditions = ["Good", "Fair", "Poor"]
const editableHealth = ["healthy", "attention", "critical"] as const
/** The mockup words the bands Healthy / Alarming / Critical */
const healthLabel: Record<(typeof editableHealth)[number], string> = { healthy: "Healthy", attention: "Alarming", critical: "Critical" }

/** Every step the form can show; the tab bar only offers those listed in `steps` */
type StepKey = "details" | "cleaning" | "post" | "fire" | "pd" | "review"

/*
 * Only Task Details is offered for now. Uncomment a line to bring its tab back;
 * the step's content further down is still in place.
 */
const steps: { n: number; key: StepKey; label: string }[] = [
  { n: 2, key: "details", label: "Task Details" },
  // { n: 3, key: "cleaning", label: "Cleaning with INSTA Fluids" },
  // { n: 4, key: "post", label: "Post-Cleaning Data" },
  // { n: 5, key: "fire", label: "Fire Prevention System" },
  // { n: 6, key: "pd", label: "PD Mitigation" },
  // { n: 7, key: "review", label: "Review & Submit" },
]

/* ---------- Form state ---------- */

type TaskForm = {
  plant: string
  department: string
  subDepartment: string
  category: string
  tagId: string
  /** The asset Load Asset settled on; kept as its tag so a draft can reload it */
  loadedTag: string
  /* Filled by Load Asset, or typed in for an asset that is not in the register */
  assetName: string
  manufacturer: string
  model: string
  serial: string
  health: (typeof editableHealth)[number] | ""
  nextDue: string
  plannedDate: string
  startTime: string
  endTime: string
  performedBy: string
  kinds: MaintenanceKind[]
  mode: "online" | "offline"
  workOrder: string
  fluids: string[]
  quantity: string
  unit: "Liters" | "ml"
  cleaning: { method: string; contamination: string; compartments: string[]; dryingMinutes: string; remarks: string }
  post: { irBefore: string; irAfter: string; hotspotBefore: string; hotspotAfter: string; condition: string; remarks: string }
  fire: { installed: boolean; tested: boolean; date: string; system: string; remarks: string }
  pd: { performed: boolean; method: string; before: string; after: string; remarks: string }
  notes: string
}

const DRAFT_KEY = "emmse.task-draft"

/** yyyy-MM-dd (what date inputs hold) ⇄ dd-MM-yyyy (what the app shows) */
const toDisplay = (ymd: string) => {
  const d = parse(ymd, "yyyy-MM-dd", new Date())
  return isValid(d) ? format(d, "dd-MM-yyyy") : ""
}
const toInput = (dmy: string) => {
  const d = parse(dmy, "dd-MM-yyyy", new Date())
  return isValid(d) ? format(d, "yyyy-MM-dd") : ""
}

function blankForm(workOrder: string): TaskForm {
  const now = new Date()
  return {
    plant: plants[0].name,
    department: "",
    subDepartment: "",
    category: "",
    tagId: "",
    loadedTag: "",
    assetName: "",
    manufacturer: "",
    model: "",
    serial: "",
    health: "",
    nextDue: "",
    plannedDate: format(now, "yyyy-MM-dd"),
    startTime: format(now, "HH:mm"),
    endTime: "",
    performedBy: "",
    kinds: [],
    mode: "online",
    workOrder,
    fluids: [],
    quantity: "",
    unit: "Liters",
    cleaning: { method: "", contamination: "", compartments: [], dryingMinutes: "", remarks: "" },
    post: { irBefore: "", irAfter: "", hotspotBefore: "", hotspotAfter: "", condition: "", remarks: "" },
    fire: { installed: false, tested: false, date: "", system: "", remarks: "" },
    pd: { performed: false, method: "", before: "", after: "", remarks: "" },
    notes: "",
  }
}

function readDraft(): TaskForm | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? (JSON.parse(raw) as TaskForm) : null
  } catch {
    return null
  }
}

/* ---------- Small layout pieces ---------- */

const control = "h-8 w-full bg-card text-xs md:text-xs"
/** The small white cards that sit inside the blue asset summary */
const miniCard = "rounded-md bg-card/85 shadow-xs ring-1 ring-info/15"

function Field({ label, required, className, children }: { label: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("min-w-0 space-y-1", className)}>
      <div className="text-[0.7rem] font-medium text-muted-foreground">
        {label}
        {required ? <span className="text-critical"> *</span> : null}
      </div>
      {children}
    </div>
  )
}

function Choice({ value, onChange, options, placeholder = "Select", className }: { value: string; onChange: (v: string) => void; options: readonly string[]; placeholder?: string; className?: string }) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger size="sm" className={cn(control, className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => <SelectItem key={o} value={o} className="text-xs">{o}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}

function Tick({ id, checked, onChange, label, hint }: { id: string; checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <div className="flex items-start gap-2">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} className="mt-0.5" />
      <Label htmlFor={id} className="flex flex-col items-start gap-0 text-xs font-normal">
        {label}
        {hint ? <span className="text-[0.65rem] text-muted-foreground">{hint}</span> : null}
      </Label>
    </div>
  )
}

function Panel({ title, className, children, action }: { title: string; className?: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className={cn("rounded-lg bg-card p-3 ring-1 ring-foreground/10", className)}>
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-brand-navy dark:text-foreground">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

/* ---------- Page ---------- */

/**
 * Add Task: record a maintenance activity end to end — pick the asset, log the
 * cleaning with INSTA fluids, the post-cleaning readings and any fire prevention
 * or PD mitigation work, then submit it for approval. Built to the "Maintenance
 * Activities" mockup, named Tasks to match this app.
 */
export function AddTaskPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const taskCount = useTaskRows().length

  // A draft saved before a field existed still opens, with that field blank
  const [form, setForm] = useState<TaskForm>(() => ({ ...blankForm(`WO-${format(new Date(), "yyyy")}-${1100 + taskCount}`), ...readDraft() }))
  const [step, setStep] = useState<StepKey>("details")

  const asset: AssetRecord | undefined = form.loadedTag ? findAsset(form.loadedTag) : undefined

  const set = <K extends keyof TaskForm>(key: K, value: TaskForm[K]) => setForm((f) => ({ ...f, [key]: value }))
  const patch = <K extends "cleaning" | "post" | "fire" | "pd">(key: K, value: Partial<TaskForm[K]>) =>
    setForm((f) => ({ ...f, [key]: { ...f[key], ...value } }))
  const toggle = (list: string[], item: string, on: boolean) => (on ? [...new Set([...list, item])] : list.filter((x) => x !== item))

  // Asset IDs that fit the filters above, offered as suggestions while typing
  const suggestions = useMemo(
    () =>
      assetRegister.filter(
        (a) =>
          a.plant === form.plant &&
          (!form.department || a.department === form.department) &&
          (!form.subDepartment || a.subDepartment === form.subDepartment) &&
          (!form.category || a.category === form.category)
      ),
    [form.plant, form.department, form.subDepartment, form.category]
  )

  function loadAsset(tagId = form.tagId) {
    const found = findAsset(tagId)
    if (!found) {
      toast.error(tagId.trim() ? `No asset with ID ${tagId.trim()}` : "Enter an Asset ID / Tag ID to load")
      return
    }
    setForm((f) => ({
      ...f,
      tagId: found.tagId,
      loadedTag: found.tagId,
      plant: found.plant,
      department: found.department,
      subDepartment: found.subDepartment,
      category: found.category,
      assetName: found.name,
      manufacturer: found.manufacturer,
      model: found.model,
      serial: found.serial,
      health: found.health,
      nextDue: toInput(found.nextDue),
    }))
    toast.success(`${found.name} loaded`, { description: `${found.tagId} · ${found.plant}` })
  }

  /** What still stands between the form and a submission, in the order it appears */
  const missing = [
    !form.assetName.trim() && "Asset name (load an asset or type it in)",
    !form.plannedDate && "Planned date",
    !form.startTime && "Start time",
    !form.performedBy && "Performed by (ELPREMAR)",
    !form.kinds.length && "Maintenance type",
    !form.fluids.length && "INSTA fluid used",
    !form.quantity && "Quantity used",
  ].filter(Boolean) as string[]

  /* ---------- Actions ---------- */

  // function saveDraft() {
  //   try {
  //     localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
  //     toast.success("Draft saved", { description: "It reopens here the next time you add a task." })
  //   } catch {
  //     toast.error("Could not save the draft in this browser")
  //   }
  // }

  function submit() {
    if (missing.length) {
      toast.error("Complete the required details first", { description: missing.join(" · ") })
      // Restore with the Review & Submit tab: setStep("review")
      return
    }
    const scheduled = toDisplay(form.plannedDate)
    const hour = Number(form.startTime.slice(0, 2))
    const unit = form.unit === "Liters" ? "L" : "ml"
    const share = Number(form.quantity) / form.fluids.length

    const id = addTask(
      {
        asset: form.assetName.trim(),
        plant: form.plant,
        type: kindToType[form.kinds[0]],
        elpremar: form.performedBy,
        scheduled,
        // Booked intervals run 09:00-18:00, so an out-of-hours start files at the nearest one
        slot: Math.min(17, Math.max(9, hour)),
        status: "open",
      },
      {
        description: form.notes || `${form.kinds.join(", ")} on ${form.assetName.trim()} using ${form.fluids.join(", ")}.`,
        createdBy: user?.name ?? "Enterprise Admin",
        area: [form.department, form.subDepartment].filter(Boolean).join(" · ") || "Not recorded",
        assetTag: form.tagId.trim() || "Not tagged",
        assetCategory: form.category || "Not recorded",
        assetCriticality: form.health === "critical" ? "High" : form.health === "attention" ? "Medium" : "Low",
        commissionedOn: asset?.commissionedOn ?? "Not recorded",
        execution: {
          performedBy: form.performedBy,
          mode: form.mode === "online" ? "Online / In-Service" : "Offline / Out-of-Service",
          startedAt: `${scheduled} ${form.startTime}`,
          endedAt: form.endTime ? `${scheduled} ${form.endTime}` : undefined,
          notes: form.cleaning.remarks || form.post.remarks || form.notes || "Recorded from the Add Task screen.",
        },
        products: form.fluids.map((name) => ({ name, quantity: Number(share.toFixed(1)), unit })),
        firePrevention: form.fire.installed ? { system: form.fire.system || "Not specified", remarks: form.fire.remarks || "Installed." } : undefined,
        pdMitigation: form.pd.performed ? { method: form.pd.method || "Not specified", remarks: form.pd.remarks || "Performed." } : undefined,
        evidence: [],
        review: undefined,
      }
    )

    try {
      localStorage.removeItem(DRAFT_KEY)
    } catch {
      // Nothing to clear in a browser without storage
    }
    toast.success(`Task ${id} submitted for approval`, { description: `${form.assetName.trim()} · ${form.plant}` })
    navigate(`/tasks/${id}`)
  }

  const stepIndex = steps.findIndex((s) => s.key === step)
  const back = () => (stepIndex > 0 ? setStep(steps[stepIndex - 1].key) : navigate("/tasks"))

  const assetAge = asset
    ? (differenceInMonths(new Date(), parse(asset.commissionedOn, "dd-MM-yyyy", new Date())) / 12).toFixed(1)
    : undefined

  /* ---------- Render ---------- */

  return (
    <div className="space-y-3">
      <PageHeader
        title="Task"
        description=""
        breadcrumbs={[{ label: "Tasks", to: "/tasks" }, { label: "Add Task" }]}
        actions={
          <>
            {/* <Button variant="outline" size="sm" className="bg-card text-primary" onClick={() => toast.info("The SOP / Work Instruction document will open here once it is uploaded.")}>
              <BookOpen /> SOP / Work Instruction
            </Button>
            <Button variant="outline" size="sm" className="bg-card text-primary" onClick={() => toast.info("The Maintenance Guide will open here once it is uploaded.")}>
              <BookOpen /> Maintenance Guide
            </Button> */}
          </>
        }
      />

      {/* ---------- 1. Select Asset ---------- */}
      <section className="rounded-lg bg-card p-3 shadow-xs ring-1 ring-foreground/10">
        <h2 className="mb-2.5 flex items-center gap-2 text-base font-semibold text-brand-navy dark:text-foreground">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">1</span>
          Select Asset
        </h2>

        <div className="grid gap-x-3 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-5">
          <Field label="Plant">
            <Choice value={form.plant} onChange={(v) => setForm((f) => ({ ...f, plant: v, tagId: "", loadedTag: "" }))} options={plants.map((p) => p.name)} />
          </Field>
          <Field label="Department">
            {/* A new department has its own sub-departments, so the old pick is cleared */}
            <Choice value={form.department} onChange={(v) => setForm((f) => ({ ...f, department: v, subDepartment: "" }))} options={Object.keys(departments)} />
          </Field>
          <Field label="Sub-department">
            <Choice
              value={form.subDepartment}
              onChange={(v) => set("subDepartment", v)}
              options={departments[form.department] ?? []}
              placeholder={form.department ? "Select" : "Pick a department first"}
            />
          </Field>
          <Field label="Asset Category">
            <Choice value={form.category} onChange={(v) => set("category", v)} options={assetCategories} />
          </Field>
          <Field label="Asset ID / Tag ID">
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <Input
                  value={form.tagId}
                  onChange={(e) => set("tagId", e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === "Enter" && loadAsset()}
                  list="asset-tags"
                  placeholder="Enter or pick an ID"
                  className={cn(control, "pr-7 tabular-nums")}
                />
                {form.tagId ? <ClearButton label="Clear Asset ID" onClick={() => set("tagId", "")} /> : null}
                <datalist id="asset-tags">
                  {suggestions.map((a) => <option key={a.tagId} value={a.tagId}>{a.name}</option>)}
                </datalist>
              </div>
              <Button size="icon-sm" className="size-8" aria-label="Find asset" onClick={() => loadAsset()}>
                <Search />
              </Button>
            </div>
          </Field>
        </div>

        <div className="mt-2.5 grid items-end gap-x-3 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-7">
          <Field label="Asset Name">
            <Input value={form.assetName} onChange={(e) => set("assetName", e.target.value)} placeholder="—" className={control} />
          </Field>
          <Field label="Manufacturer">
            <Input value={form.manufacturer} onChange={(e) => set("manufacturer", e.target.value)} placeholder="—" className={control} />
          </Field>
          <Field label="Model">
            <Input value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="—" className={control} />
          </Field>
          <Field label="Serial Number">
            <Input value={form.serial} onChange={(e) => set("serial", e.target.value)} placeholder="—" className={cn(control, "tabular-nums")} />
          </Field>
          <Field label="Health Status">
            <Select value={form.health || undefined} onValueChange={(v) => set("health", v as TaskForm["health"])}>
              <SelectTrigger size="sm" className={cn(control, form.health && healthStatus[form.health].tile)}>
                <SelectValue placeholder="—" />
              </SelectTrigger>
              <SelectContent>
                {editableHealth.map((h) => (
                  <SelectItem key={h} value={h} className="text-xs">{healthLabel[h]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Next Due Date">
            <Input type="date" value={form.nextDue} onChange={(e) => set("nextDue", e.target.value)} className={control} />
          </Field>
          <Button className="h-9" onClick={() => loadAsset()}>Load Asset</Button>
        </div>
      </section>

      <div className="space-y-3">
        <div className="min-w-0 space-y-3">
          {/* ---------- The loaded asset at a glance ---------- */}
          <section className="rounded-lg bg-info-soft p-2 ring-1 ring-info/20 dark:bg-info-soft/60">
            {asset ? (
              // Each fact in its own small card inside the blue panel
              <div className="flex flex-wrap items-stretch gap-2 text-brand-navy dark:text-foreground">
                <AssetIllustration category={asset.category} className="min-h-20 w-32 shrink-0 self-stretch ring-info/20" />
                <dl className="flex min-w-0 flex-1 flex-wrap gap-2">
                  {[
                    ["Asset Tag ID", asset.tagId],
                    ["Category", asset.category],
                    ["Department", asset.department],
                    ["Sub-department", asset.subDepartment],
                  ].map(([label, value], i) => (
                    <div key={label} className={cn(miniCard, "min-w-28 flex-1 px-3 py-2")}>
                      <dt className="text-xs font-medium">{label}</dt>
                      <dd className={cn("mt-1 text-sm", i === 0 ? "font-bold" : "text-brand-navy/90 dark:text-foreground/90")}>{value}</dd>
                    </div>
                  ))}
                </dl>
                <div className={cn(miniCard, "flex flex-col items-center justify-center bg-card px-6 py-1.5")}>
                  <span className="text-sm font-medium text-primary">Current Health Score</span>
                  <HealthGauge score={asset.healthScore} health={form.health || asset.health} />
                </div>
                <dl className={cn(miniCard, "grid content-center grid-cols-[auto_auto] gap-x-6 gap-y-1 px-4 py-2 text-sm")}>
                  <dt>Last Inspection</dt>
                  <dd className="tabular-nums">{asset.lastInspection}</dd>
                  <dt>Commissioning Date</dt>
                  <dd className="tabular-nums">{asset.commissionedOn}</dd>
                  <dt>Asset Age</dt>
                  <dd className="tabular-nums">{assetAge} Years</dd>
                </dl>
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-muted-foreground">
                Select an asset above and press <span className="font-semibold text-foreground">Load Asset</span> to see its details here.
              </p>
            )}
          </section>

          {/* ---------- Steps 2-7 ---------- */}
          <div>
            <div className="flex overflow-x-auto [scrollbar-width:none]" role="tablist">
              {steps.map((s) => {
                const active = s.key === step
                return (
                  <button
                    key={s.key}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStep(s.key)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 rounded-t-lg border border-b-0 px-2.5 py-2 text-[0.7rem] font-medium whitespace-nowrap transition-colors",
                      active ? "border-foreground/10 border-t-2 border-t-primary bg-card text-brand-navy dark:text-foreground" : "border-transparent bg-muted/60 text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full text-[0.65rem] font-bold",
                        active ? "bg-primary text-primary-foreground" : "bg-foreground/10 text-muted-foreground"
                      )}
                    >
                      {s.n}
                    </span>
                    {s.label}
                  </button>
                )
              })}
            </div>

            <div className="rounded-b-lg rounded-tr-lg bg-card p-3 ring-1 ring-foreground/10">
              {step === "details" ? (
                <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_15rem]">
                  <Panel title="Maintenance Activity Information">
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <Field label="Planned Date" required>
                        <Input type="date" value={form.plannedDate} onChange={(e) => set("plannedDate", e.target.value)} className={control} />
                      </Field>
                      <Field label="Start Time (Real Time)" required>
                        <TimeInput value={form.startTime} onChange={(v) => set("startTime", v)} />
                      </Field>
                      <Field label="End Time (Real Time)">
                        <TimeInput value={form.endTime} onChange={(v) => set("endTime", v)} />
                      </Field>
                      <Field label="Performed By" required>
                        <Choice value={form.performedBy} onChange={(v) => set("performedBy", v)} options={crew} placeholder="Select ELPREMAR" />
                      </Field>
                    </div>
                    <div className="mt-3 grid gap-3 sm:grid-cols-3">
                      <Field label="Maintenance Type" required>
                        <div className="space-y-1.5 pt-0.5">
                          {maintenanceKinds.map((k) => (
                            <Tick key={k} id={`kind-${k}`} label={k} checked={form.kinds.includes(k)} onChange={(on) => set("kinds", toggle(form.kinds, k, on) as MaintenanceKind[])} />
                          ))}
                        </div>
                      </Field>
                      <Field label="Mode of Operation">
                        <RadioGroup value={form.mode} onValueChange={(v) => set("mode", v as TaskForm["mode"])} className="gap-1.5 pt-0.5">
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="online" id="mode-online" />
                            <Label htmlFor="mode-online" className="text-xs font-normal">Online (In-Service)</Label>
                          </div>
                          <div className="flex items-center gap-2">
                            <RadioGroupItem value="offline" id="mode-offline" />
                            <Label htmlFor="mode-offline" className="text-xs font-normal">Offline (Out of Service)</Label>
                          </div>
                        </RadioGroup>
                      </Field>
                      <Field label="Work Order / Task ID">
                        <Input value={form.workOrder} onChange={(e) => set("workOrder", e.target.value)} className={cn(control, "tabular-nums")} />
                      </Field>
                    </div>
                  </Panel>

                  <Panel
                    title="INSTA Fluids Used"
                    action={<span title="Pick the fluid for the contamination level found: INSTA 50 light, INSTA 100 medium, INSTA 200 heavy."><Info className="size-4 text-primary" /></span>}
                  >
                    <div className="space-y-2">
                      {instaFluids.map((f) => (
                        <Tick key={f.name} id={`fluid-${f.name}`} label={f.name} hint={f.hint} checked={form.fluids.includes(f.name)} onChange={(on) => set("fluids", toggle(form.fluids, f.name, on))} />
                      ))}
                    </div>
                    <div className="mt-3 flex items-center gap-2 border-t pt-3">
                      <span className="text-[0.7rem] font-medium whitespace-nowrap text-muted-foreground">Quantity Used</span>
                      <Input
                        value={form.quantity}
                        onChange={(e) => set("quantity", e.target.value.replace(/[^\d.]/g, ""))}
                        inputMode="decimal"
                        className={cn(control, "w-14 tabular-nums")}
                      />
                      <Choice value={form.unit} onChange={(v) => set("unit", v as TaskForm["unit"])} options={["Liters", "ml"]} className="w-20" />
                    </div>
                  </Panel>
                </div>
              ) : null}

              {step === "cleaning" ? (
                <div className="grid gap-3 lg:grid-cols-2">
                  <Panel title="Cleaning Details">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Contamination Found">
                        <Choice value={form.cleaning.contamination} onChange={(v) => patch("cleaning", { contamination: v })} options={contaminationLevels} />
                      </Field>
                      <Field label="Cleaning Method">
                        <Choice value={form.cleaning.method} onChange={(v) => patch("cleaning", { method: v })} options={cleaningMethods} />
                      </Field>
                      <Field label="Drying Time (minutes)">
                        <Input value={form.cleaning.dryingMinutes} onChange={(e) => patch("cleaning", { dryingMinutes: e.target.value.replace(/\D/g, "") })} inputMode="numeric" className={control} />
                      </Field>
                      <Field label="INSTA Fluids Used">
                        <p className="pt-1.5 text-xs">
                          {form.fluids.length ? `${form.fluids.join(", ")}${form.quantity ? ` · ${form.quantity} ${form.unit}` : ""}` : <span className="text-muted-foreground">Pick them on Maintenance Details</span>}
                        </p>
                      </Field>
                    </div>
                    {form.cleaning.contamination ? (
                      <p className="mt-3 rounded-md bg-info-soft/60 px-2.5 py-1.5 text-[0.7rem] text-info-soft-foreground">
                        Recommended for {form.cleaning.contamination.toLowerCase()} contamination:{" "}
                        <span className="font-semibold">{instaFluids[contaminationLevels.indexOf(form.cleaning.contamination)].name}</span>
                      </p>
                    ) : null}
                  </Panel>
                  <Panel title="Compartments Cleaned">
                    <div className="grid grid-cols-2 gap-2">
                      {compartments.map((c) => (
                        <Tick key={c} id={`comp-${c}`} label={c} checked={form.cleaning.compartments.includes(c)} onChange={(on) => patch("cleaning", { compartments: toggle(form.cleaning.compartments, c, on) })} />
                      ))}
                    </div>
                    <Field label="Cleaning Remarks" className="mt-3">
                      <Textarea value={form.cleaning.remarks} onChange={(e) => patch("cleaning", { remarks: e.target.value })} rows={2} className="bg-card text-xs md:text-xs" />
                    </Field>
                  </Panel>
                </div>
              ) : null}

              {step === "post" ? (
                <Panel title="Post-Cleaning Readings">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Insulation Resistance – Before (MΩ)">
                      <Input value={form.post.irBefore} onChange={(e) => patch("post", { irBefore: e.target.value.replace(/[^\d.]/g, "") })} inputMode="decimal" className={control} />
                    </Field>
                    <Field label="Insulation Resistance – After (MΩ)">
                      <Input value={form.post.irAfter} onChange={(e) => patch("post", { irAfter: e.target.value.replace(/[^\d.]/g, "") })} inputMode="decimal" className={control} />
                    </Field>
                    <Field label="Hotspot Temperature – Before (°C)">
                      <Input value={form.post.hotspotBefore} onChange={(e) => patch("post", { hotspotBefore: e.target.value.replace(/[^\d.]/g, "") })} inputMode="decimal" className={control} />
                    </Field>
                    <Field label="Hotspot Temperature – After (°C)">
                      <Input value={form.post.hotspotAfter} onChange={(e) => patch("post", { hotspotAfter: e.target.value.replace(/[^\d.]/g, "") })} inputMode="decimal" className={control} />
                    </Field>
                    <Field label="Visual Condition After Cleaning">
                      <Choice value={form.post.condition} onChange={(v) => patch("post", { condition: v })} options={conditions} />
                    </Field>
                    <Field label="Remarks" className="sm:col-span-2 lg:col-span-3">
                      <Input value={form.post.remarks} onChange={(e) => patch("post", { remarks: e.target.value })} className={control} />
                    </Field>
                  </div>
                  <Improvement before={form.post.irBefore} after={form.post.irAfter} label="Insulation resistance" unit="MΩ" higherIsBetter />
                  <Improvement before={form.post.hotspotBefore} after={form.post.hotspotAfter} label="Hotspot temperature" unit="°C" />
                </Panel>
              ) : null}

              {step === "fire" ? (
                <Panel title="Fire Prevention System Installation">
                  <div className="mb-3 flex flex-wrap gap-5">
                    <Tick id="fire-installed" label="Installed" checked={form.fire.installed} onChange={(on) => patch("fire", { installed: on })} />
                    <Tick id="fire-tested" label="Function test passed" checked={form.fire.tested} onChange={(on) => patch("fire", { tested: on })} />
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <Field label="Installation Date">
                      <Input type="date" value={form.fire.date} onChange={(e) => patch("fire", { date: e.target.value })} disabled={!form.fire.installed} className={control} />
                    </Field>
                    <Field label="System Type">
                      <Choice value={form.fire.system} onChange={(v) => patch("fire", { system: v })} options={fireSystems} />
                    </Field>
                    <Field label="Remarks">
                      <Input value={form.fire.remarks} onChange={(e) => patch("fire", { remarks: e.target.value })} className={control} />
                    </Field>
                  </div>
                </Panel>
              ) : null}

              {step === "pd" ? (
                <Panel title="Partial Discharge (PD) Mitigation">
                  <Tick id="pd-performed" label="PD Mitigation Activity Performed" checked={form.pd.performed} onChange={(on) => patch("pd", { performed: on })} />
                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Field label="Method Used" className="sm:col-span-2">
                      <Choice value={form.pd.method} onChange={(v) => patch("pd", { method: v })} options={pdMethods} />
                    </Field>
                    <Field label="PD Level – Before (pC)">
                      <Input value={form.pd.before} onChange={(e) => patch("pd", { before: e.target.value.replace(/[^\d.]/g, "") })} inputMode="decimal" className={control} />
                    </Field>
                    <Field label="PD Level – After (pC)">
                      <Input value={form.pd.after} onChange={(e) => patch("pd", { after: e.target.value.replace(/[^\d.]/g, "") })} inputMode="decimal" className={control} />
                    </Field>
                    <Field label="Remarks" className="sm:col-span-2 lg:col-span-4">
                      <Input value={form.pd.remarks} onChange={(e) => patch("pd", { remarks: e.target.value })} className={control} />
                    </Field>
                  </div>
                  <Improvement before={form.pd.before} after={form.pd.after} label="PD level" unit="pC" />
                </Panel>
              ) : null}

              {step === "review" ? (
                <Review form={form} asset={asset} missing={missing} onEdit={setStep} />
              ) : null}
            </div>
          </div>

          {/* ---------- Notes, below the first step as on the mockup ---------- */}
          {step === "details" ? (
            <Panel title="Notes" className="shadow-xs">
              <Textarea
                value={form.notes}
                onChange={(e) => set("notes", e.target.value.slice(0, 500))}
                placeholder="Enter additional notes (if any)..."
                rows={3}
                className="bg-card text-xs md:text-xs"
              />
              <div className="mt-1 text-right text-[0.65rem] text-muted-foreground tabular-nums">{form.notes.length}/500</div>
            </Panel>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" size="sm" className="bg-card" onClick={back}>Back</Button>
          {/* <Button variant="outline" size="sm" className="bg-card" onClick={saveDraft}><Save /> Save as Draft</Button> */}
          <Button size="sm" onClick={submit}><Send /> Submit</Button>
        </div>
      </div>
    </div>
  )
}

/* ---------- Pieces used by the steps ---------- */

/** A time input with a "now" button, since these are captured in real time */
function TimeInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1">
      <Input type="time" value={value} onChange={(e) => onChange(e.target.value)} className={cn(control, "tabular-nums")} />
      <Button type="button" variant="outline" size="icon-sm" className="size-8 shrink-0 bg-card" title="Use the current time" aria-label="Use the current time" onClick={() => onChange(format(new Date(), "HH:mm"))}>
        <Clock />
      </Button>
    </div>
  )
}

/** "Before → After" read-out once both readings are in */
function Improvement({ before, after, label, unit, higherIsBetter }: { before: string; after: string; label: string; unit: string; higherIsBetter?: boolean }) {
  const b = Number(before)
  const a = Number(after)
  if (!before || !after || Number.isNaN(a) || Number.isNaN(b)) return null
  const better = higherIsBetter ? a > b : a < b
  return (
    <p className={cn("mt-2 text-[0.7rem]", better ? "text-healthy-soft-foreground" : "text-attention-soft-foreground")}>
      {label}: {b} → {a} {unit} ({better ? "improved" : "no improvement"})
    </p>
  )
}

/** Everything entered, grouped by step, with what is still missing */
function Review({
  form,
  asset,
  missing,
  onEdit,
}: {
  form: TaskForm
  asset?: AssetRecord
  missing: string[]
  onEdit: (step: StepKey) => void
}) {
  const sections: { title: string; step: StepKey; rows: [string, string][] }[] = [
    {
      title: "Asset",
      step: "details",
      rows: [
        ["Asset", form.assetName ? `${form.assetName}${form.tagId ? ` (${form.tagId})` : ""}${asset ? "" : " · not in register"}` : "—"],
        ["Manufacturer / Model", [form.manufacturer, form.model].filter(Boolean).join(" · ") || "—"],
        ["Serial Number", form.serial || "—"],
        ["Plant / Department", [form.plant, form.department, form.subDepartment].filter(Boolean).join(" · ")],
        ["Health Status", form.health ? healthLabel[form.health] : "—"],
      ],
    },
    {
      title: "Maintenance Details",
      step: "details",
      rows: [
        ["Planned", `${toDisplay(form.plannedDate) || "—"} ${form.startTime}${form.endTime ? ` – ${form.endTime}` : ""}`],
        ["Performed By", form.performedBy || "—"],
        ["Maintenance Type", form.kinds.join(", ") || "—"],
        ["Mode", form.mode === "online" ? "Online (In-Service)" : "Offline (Out of Service)"],
        ["Work Order", form.workOrder],
        ["INSTA Fluids", form.fluids.length ? `${form.fluids.join(", ")} · ${form.quantity || "?"} ${form.unit}` : "—"],
      ],
    },
    {
      title: "Cleaning & Readings",
      step: "cleaning",
      rows: [
        ["Contamination / Method", [form.cleaning.contamination, form.cleaning.method].filter(Boolean).join(" · ") || "—"],
        ["Compartments", form.cleaning.compartments.join(", ") || "—"],
        ["IR Before → After", form.post.irBefore || form.post.irAfter ? `${form.post.irBefore || "?"} → ${form.post.irAfter || "?"} MΩ` : "—"],
        ["Hotspot Before → After", form.post.hotspotBefore || form.post.hotspotAfter ? `${form.post.hotspotBefore || "?"} → ${form.post.hotspotAfter || "?"} °C` : "—"],
      ],
    },
    {
      title: "Additional Activities",
      step: "fire",
      rows: [
        ["Fire Prevention", form.fire.installed ? `${form.fire.system || "Installed"}${form.fire.date ? ` · ${toDisplay(form.fire.date)}` : ""}` : "Not performed"],
        ["PD Mitigation", form.pd.performed ? form.pd.method || "Performed" : "Not performed"],
        ["Notes", form.notes || "—"],
      ],
    },
  ]

  return (
    <div className="space-y-3">
      {missing.length ? (
        <div className="rounded-md bg-attention-soft px-3 py-2 text-xs text-attention-soft-foreground">
          <span className="font-semibold">Still needed before you can submit:</span> {missing.join(" · ")}
        </div>
      ) : (
        <div className="rounded-md bg-healthy-soft px-3 py-2 text-xs text-healthy-soft-foreground">
          Everything required is in. Submit for approval when you are ready.
        </div>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {sections.map((s) => (
          <Panel
            key={s.title}
            title={s.title}
            action={<Button variant="link" size="xs" onClick={() => onEdit(s.step)}>Edit</Button>}
          >
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              {s.rows.map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="min-w-0 break-words">{v}</dd>
                </div>
              ))}
            </dl>
          </Panel>
        ))}
      </div>
    </div>
  )
}
