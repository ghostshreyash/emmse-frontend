/**
 * The enterprise's plants: the ones in the dashboard data plus any added from the
 * Add Plant form this session. Each keeps the full record the plant form edits
 * (`entry`) beside the figures the Plants table shows. Mock only - replace with
 * GET/POST/PATCH /plants.
 */
import { useSyncExternalStore } from "react"
import { format, isValid, parse, parseISO } from "date-fns"

import { plants, type Plant } from "@/data/dashboard"
import { areaForPostalCode, coordsForCity, timeZones } from "@/data/plant-master-data"
import type { DepartmentEntry, PlantEntry, PlantManagerValues } from "@/pages/plant-onboarding/schemas"

/** One row of the Plants table - a plant as the dashboard data describes it, ids widened */
export type PlantSummary = {
  id: string
  name: string
  type: string
  capacity: string
  logo: string | null
  location: string
  head: string
  commissioned: string
  assets: number
  healthy: number
  attention: number
  critical: number
  change: number
  departments: number
  activeUsers: number
  activeThisWeek: number
}

export type PlantRecord = PlantSummary & { entry: PlantEntry }

/* ---------- Seed records for the dashboard's plants ---------- */

/** What the dashboard data does not hold: address, contacts and each plant's own structure */
const seedDetails: Record<
  Plant["id"],
  { address: string; pin: string; city: string; email: string; phone: string; manager?: string; departments: [string, string, string[]][] }
> = {
  JSR: {
    address: "Tata Steel Works, Bistupur",
    pin: "831001",
    city: "Jamshedpur",
    email: "rk.sinha@tatasteel.com",
    phone: "9431012345",
    manager: "jsr.plantmanager@tatasteel.com",
    departments: [
      ["Electrical Maintenance", "Electrical", ["HT Maintenance", "LT Maintenance"]],
      ["Main Substation (11kV)", "Utilities", ["Transformer Bay"]],
      ["Production Floor", "Production", []],
      ["Utility Area", "Utilities", []],
      ["LT Panels - Block A", "Electrical", ["MCC Room"]],
      ["Fire & Safety", "Safety", []],
    ],
  },
  KLN: {
    address: "Kalinganagar Industrial Complex, Duburi",
    pin: "755026",
    city: "Jajpur",
    email: "anita.mohanty@tatasteel.com",
    phone: "9437023456",
    manager: "kln.plantmanager@tatasteel.com",
    departments: [
      ["Electrical Maintenance", "Electrical", ["HT Maintenance"]],
      ["Blast Furnace", "Production", []],
      ["Cold Rolling Mill", "Production", []],
      ["Utilities", "Utilities", ["Water Treatment"]],
    ],
  },
  MER: {
    address: "Narendrapur, Meramandali",
    pin: "759121",
    city: "Dhenkanal",
    email: "suresh.patnaik@tatasteel.com",
    phone: "9437034567",
    manager: "mer.plantmanager@tatasteel.com",
    departments: [
      ["Electrical Maintenance", "Electrical", []],
      ["Steel Melt Shop", "Production", []],
      ["Hot Strip Mill", "Production", []],
      ["Power Plant", "Utilities", []],
    ],
  },
  KHP: {
    address: "Village Sajgaon, Khopoli",
    pin: "410203",
    city: "Khopoli",
    email: "meera.deshpande@tatasteel.com",
    phone: "9822045678",
    departments: [
      ["Electrical Maintenance", "Electrical", ["LT Maintenance"]],
      ["Cold Rolling", "Production", []],
    ],
  },
  SBD: {
    address: "Site IV, Industrial Area, Sahibabad",
    pin: "201010",
    city: "Ghaziabad",
    email: "vikram.chauhan@tatasteel.com",
    phone: "9811056789",
    departments: [
      ["Electrical Maintenance", "Electrical", []],
      ["Tube Mill", "Production", []],
    ],
  },
}

const code = (name: string) =>
  name
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase()

function seedEntry(p: Plant): PlantEntry {
  const d = seedDetails[p.id]
  const [capacity, capacityUnit] = p.capacity.split(" ")
  const point = coordsForCity(d.city)
  const commissioned = parse(p.commissioned, "dd-MM-yyyy", new Date())
  const departments: DepartmentEntry[] = d.departments.map(([name, type, subs]) => ({
    name,
    code: `${p.id}-${code(name)}`,
    type,
    parent: "",
    // No head on record yet, so no title either - a bare "Mr." would read as a name
    salutation: "",
    head: "",
    email: "",
    phoneCode: "+91",
    phone: "",
    location: "",
    description: "",
    subDepartments: subs.map((s) => ({ name: s, code: `${p.id}-${code(s)}`, function: "Maintenance", description: "" })),
  }))
  return {
    name: p.name,
    type: p.type,
    code: p.id,
    address: d.address,
    city: d.city,
    pin: d.pin,
    latitude: point?.lat ?? "",
    longitude: point?.lng ?? "",
    salutation: ["Anita Mohanty", "Meera Deshpande"].includes(p.head) ? "Ms." : "Mr.",
    head: p.head,
    email: d.email,
    phoneCode: "+91",
    phone: d.phone,
    capacity,
    capacityUnit,
    commissioningDate: isValid(commissioned) ? format(commissioned, "yyyy-MM-dd") : "",
    timeZone: timeZones[0],
    notes: "",
    departments,
    ...(d.manager ? { manager: { role: "Plant Manager", email: d.manager, password: "Welcome@123" } } : {}),
  }
}

/* ---------- Store ---------- */

let rows: PlantRecord[] = plants.map((p) => ({ ...p, entry: seedEntry(p) }))
const listeners = new Set<() => void>()
const subscribe = (fn: () => void) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}
const emit = () => listeners.forEach((fn) => fn())

export const usePlantRows = () => useSyncExternalStore(subscribe, () => rows)

/** The table's own columns, worked out from what the plant form holds */
function summaryOf(entry: PlantEntry) {
  const area = areaForPostalCode(entry.pin)
  const city = entry.city || area?.city || ""
  const commissioned = entry.commissioningDate ? parseISO(entry.commissioningDate) : null
  return {
    name: entry.name.trim(),
    type: entry.type || "-",
    capacity: [entry.capacity, entry.capacityUnit].filter(Boolean).join(" ") || "-",
    location: [city, area?.state].filter(Boolean).join(", ") || entry.address,
    head: entry.head.trim(),
    commissioned: commissioned && isValid(commissioned) ? format(commissioned, "dd-MM-yyyy") : "-",
    departments: entry.departments.length,
  }
}

/** A short code from the plant code, or failing that the plant's initials, never one already taken */
function freeId(entry: PlantEntry) {
  const base = entry.code?.trim().toUpperCase() || code(entry.name).slice(0, 3) || "PLT"
  let id = base
  for (let n = 2; rows.some((r) => r.id === id); n++) id = `${base}${n}`
  return id
}

/** Adds what the Add Plant form captured. A new plant has no assets or users yet. */
export function addPlants(entries: PlantEntry[]) {
  const created = entries.map((entry): PlantRecord => {
    const plant: PlantRecord = {
      id: freeId(entry),
      ...summaryOf(entry),
      logo: entry.logo ? URL.createObjectURL(entry.logo) : null,
      assets: 0,
      healthy: 0,
      attention: 0,
      critical: 0,
      change: 0,
      activeUsers: entry.manager ? 1 : 0,
      activeThisWeek: 0,
      entry,
    }
    // Pushed one at a time so two plants added together still get distinct ids
    rows = [...rows, plant]
    return plant
  })
  emit()
  return created
}

/** Saves an edit from the plant's details screen. Asset figures are not the form's to change. */
export function updatePlant(id: string, entry: PlantEntry) {
  rows = rows.map((r) =>
    r.id !== id ? r : { ...r, ...summaryOf(entry), logo: entry.logo ? URL.createObjectURL(entry.logo) : r.logo, entry }
  )
  emit()
}

/** Issues (or replaces) the plant's Plant Manager login */
export function setPlantManager(id: string, manager: PlantManagerValues) {
  rows = rows.map((r) => (r.id !== id ? r : { ...r, entry: { ...r.entry, manager } }))
  emit()
}
