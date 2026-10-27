/**
 * The three documents an asset's record produces, as OLIVINE issue them.
 *
 * The PDFs in `public/reports` are the client's own samples (14-10-2026),
 * carried across from EVITA, and stand in for the generated article until the
 * reporting service exists. Every asset opens the same sample, which is the
 * point of a sample - the layout is what is being agreed, not the figures.
 *
 * TODO(api): swap `file` for the URL the reporting service returns for this
 * asset's own report. Nothing else here should need to change.
 */
export type ReportKind = "contamination" | "hygiene" | "cleaning"

export type ReportDocument = {
  kind: ReportKind
  title: string
  /** What the report is for, in a line */
  detail: string
  file: string
  /** How the file is named when it is downloaded, with the asset id in it */
  fileName: (assetId: string) => string
}

export const reportDocuments: ReportDocument[] = [
  {
    kind: "contamination",
    title: "Contamination Report",
    detail: "Dust, carbon and corrosion read off the inspection, scored",
    file: "/reports/contamination-report-sample.pdf",
    fileName: (assetId) => `contamination-report-${assetId}.pdf`,
  },
  {
    kind: "hygiene",
    title: "Hygiene Report",
    detail: "The physical condition of the panel, point by point",
    file: "/reports/hygiene-report-sample.pdf",
    fileName: (assetId) => `hygiene-report-${assetId}.pdf`,
  },
  {
    kind: "cleaning",
    title: "Cleaning Report",
    detail: "The panel as found against the panel after cleaning",
    file: "/reports/cleaning-report-sample.pdf",
    fileName: (assetId) => `cleaning-report-${assetId}.pdf`,
  },
]

/**
 * Whether an asset holds a given report yet.
 *
 * A cleaning report is the before and after of a clean, so it exists only once
 * the maintenance that produced it has run. The other two come off the
 * inspection, which every row on the Reports screen has by definition.
 */
export const hasReport = (kind: ReportKind, cleaned: boolean) => kind !== "cleaning" || cleaned
