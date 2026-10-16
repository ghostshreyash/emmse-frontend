import { useSyncExternalStore } from "react"

import { assetProfileFor, buildAssetId, type AssetProfile } from "@/data/asset-data"
import { assetRegister, type AssetRecord } from "@/data/assets"
import { parametersFor, unitFor } from "@/data/asset-parameters"
import { nextCleaningDue } from "@/data/maintenance-schedule"
import type { AssetCriticality } from "@/data/master-data"
import type { AssetFormValues } from "@/pages/assets/schemas"

/**
 * One copy of the asset register, shared by Asset Management, Asset Onboarding,
 * the asset detail screen and Add Maintenance Task, so an asset registered here
 * shows up everywhere at once. Stands in for the query cache until these rows come
 * from the API. Ported from EVITA's asset-store.ts.
 *
 * An asset onboarded here keeps the profile that was actually typed, rather than
 * the seeded one the register generates — `profiles` holds those, and the files
 * uploaded with it sit beside them in `captures` for the session.
 */

let rows: AssetRecord[] = assetRegister
/** Profiles for assets onboarded or corrected in this session, keyed by Asset ID */
let profiles: Record<string, AssetProfile> = {}
/** The files picked during onboarding, so the detail screen can show them back */
let captures: Record<string, { images: Record<string, File | undefined>; documents: Record<string, File | undefined> }> = {}

const listeners = new Set<() => void>()
const emit = () => listeners.forEach((listener) => listener())
const subscribe = (listener: () => void) => {
  listeners.add(listener)
  return () => void listeners.delete(listener)
}

export const useAssetRows = () => useSyncExternalStore(subscribe, () => rows)

/** Look an asset up by Asset ID, case-insensitively, including ones added this session */
export const findAsset = (tagId?: string) =>
  tagId ? rows.find((r) => r.tagId.toLowerCase() === tagId.trim().toLowerCase()) : undefined

/**
 * The profile behind one asset: what was typed if it was onboarded here, and the
 * seeded reconstruction otherwise. Both shapes are identical.
 */
export const profileOf = (asset: AssetRecord) => profiles[asset.tagId] ?? assetProfileFor(asset)

/** The photographs and documents uploaded for one asset, if it was onboarded here */
export const capturesOf = (tagId: string) => captures[tagId]

/** `dd-MM-yyyy` for today — the stamp an onboarding records */
function today() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, "0")
  return `${p(d.getDate())}-${p(d.getMonth() + 1)}-${d.getFullYear()}`
}

/**
 * Everything the wizard collected, in the shape the detail screens read. Built
 * before the asset exists so the review step renders exactly what will be stored.
 */
export function profileFrom(values: AssetFormValues, dates: { onboarded: string }): AssetProfile {
  const answers = values.parameters ?? {}
  return {
    details: {
      enterprise: values.enterprise,
      plant: values.plant,
      area: values.area,
      department: values.department ?? "",
      subDepartment: values.subDepartment ?? "",
      category: values.category,
      tag: values.tag,
      description: values.description ?? "",
      latitude: values.latitude ?? "",
      longitude: values.longitude ?? "",
      environment: values.environment,
    },
    parameters: parametersFor(values.category)
      .filter((spec) => answers[spec.key]?.trim())
      .map((spec) => ({ label: spec.label, value: answers[spec.key].trim(), unit: unitFor(spec, answers) })),
    documents: (values.documents ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      file: d.file?.name ?? d.name,
      uploaded: dates.onboarded,
    })),
    images: (values.images ?? []).map((i) => ({ id: i.id, name: i.name })),
  }
}

/** The register fields that come straight from the wizard */
function fieldsFrom(values: AssetFormValues) {
  const answers = values.parameters ?? {}
  return {
    name: values.description?.trim() || values.tag,
    category: values.category,
    plant: values.plant,
    department: values.department ?? "",
    subDepartment: values.subDepartment ?? "",
    area: values.area,
    manufacturer: answers.manufacturer ?? "",
    model: answers.modelType ?? "",
  }
}

/**
 * Register a new asset from what the wizard collected. The Asset ID is built here
 * rather than typed, so two assets can never be handed the same one. Returns the
 * finished record, which is what the Asset ID & QR screen is built from.
 */
export function onboardAsset(values: AssetFormValues): AssetRecord {
  const tagId = buildAssetId({ plantName: values.plant, category: values.category, existing: rows })
  const onboarded = today()

  const record: AssetRecord = {
    tagId,
    ...fieldsFrom(values),
    serial: "",
    // Criticality is the one parameter every asset type carries
    criticality: (values.parameters?.criticality ?? "Medium") as AssetCriticality,
    // Never inspected, so there is no score to show yet - not a placeholder one
    health: null,
    healthScore: null,
    lastInspection: "",
    // The first cleaning falls due one interval after onboarding
    nextDue: nextCleaningDue(onboarded, values.category, values.environment),
    commissionedOn: onboarded,
    onboarded,
  }

  profiles = { ...profiles, [tagId]: profileFrom(values, { onboarded }) }
  captures = { ...captures, [tagId]: capturesFrom(values) }
  rows = [record, ...rows]
  emit()
  return record
}

/** The picked files, keyed by upload, for the detail screen to show back */
const capturesFrom = (values: AssetFormValues) => ({
  images: Object.fromEntries((values.images ?? []).map((i) => [i.id, i.file])),
  documents: Object.fromEntries((values.documents ?? []).map((d) => [d.id, d.file])),
})

/**
 * What the wizard would have collected for an asset already on the register, so
 * it can be reopened and corrected.
 */
export function valuesFrom(asset: AssetRecord): AssetFormValues {
  const profile = profileOf(asset)
  const held = captures[asset.tagId]
  const parameters: Record<string, string> = {}
  for (const spec of parametersFor(profile.details.category)) {
    const answer = profile.parameters.find((p) => p.label === spec.label)
    if (answer) parameters[spec.key] = answer.value
  }
  return {
    ...profile.details,
    parameters,
    images: profile.images.map((i) => ({ id: i.id, name: i.name, file: held?.images[i.id] })),
    documents: profile.documents.map((d) => ({ id: d.id, name: d.name, file: held?.documents[d.id] })),
  }
}

/**
 * Correct an asset already on the register. The Asset ID is not reissued - it is
 * printed on the label and quoted by every inspection taken against the asset - and
 * the onboarding date stays, since it records when the asset joined the register.
 */
export function updateAsset(tagId: string, values: AssetFormValues): AssetRecord | undefined {
  const existing = rows.find((r) => r.tagId === tagId)
  if (!existing) return undefined

  const record: AssetRecord = {
    ...existing,
    ...fieldsFrom(values),
    manufacturer: values.parameters?.manufacturer ?? existing.manufacturer,
    model: values.parameters?.modelType ?? existing.model,
    criticality: (values.parameters?.criticality ?? existing.criticality) as AssetCriticality,
  }

  profiles = { ...profiles, [tagId]: profileFrom(values, { onboarded: existing.onboarded }) }
  captures = { ...captures, [tagId]: capturesFrom(values) }
  rows = rows.map((r) => (r.tagId === tagId ? record : r))
  emit()
  return record
}
