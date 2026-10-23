/**
 * Lookup lists behind the Add Plant form, taken from occ-frontend (`data/mock.ts`,
 * `data/master-data.ts`, `data/occ-tables.ts`) so the form offers exactly what
 * the OCC one does. Replace with the master-data API once it exists.
 */

export const plantTypes = ["Integrated Steel Plant", "Refinery", "Power Plant", "Cement Plant", "Manufacturing Unit", "Data Centre", "Substation", "Other"]
export const salutations = ["Mr.", "Ms.", "Mrs.", "Dr.", "Er.", "Prof."]
export const subDepartmentFunctions = ["Maintenance", "Operations", "Testing", "Projects"]
export const timeZones = ["(UTC+05:30) India Standard Time", "(UTC+04:00) Gulf Standard Time", "(UTC+03:00) Arabia Standard Time", "(UTC+08:00) Singapore Time", "(UTC+00:00) GMT", "(UTC+01:00) Central European Time"]

export const departmentTypes = [
  "Electrical",
  "Operations",
  "Maintenance",
  "Engineering",
  "Projects",
  "Instrumentation & Control",
  "Production",
  "Utilities",
  "Safety",
  "Facility Management",
  "Reliability",
  "EHS",
  "Other",
] as const

export const plantCapacityUnitCodes = ["MW", "MVA", "kVA", "kW", "MWp", "HP", "MTPA"] as const

/** Who a plant's own login belongs to. An enterprise only issues Plant Manager logins. */
export const plantManagerRoles = ["Plant Manager"] as const

const postalAreas: Record<string, { district: string; city: string; state: string }> = {
  "400001": { district: "Mumbai City", city: "Mumbai", state: "Maharashtra" },
  "400703": { district: "Thane", city: "Navi Mumbai", state: "Maharashtra" },
  "831001": { district: "East Singhbhum", city: "Jamshedpur", state: "Jharkhand" },
  "361001": { district: "Jamnagar", city: "Jamnagar", state: "Gujarat" },
  "402107": { district: "Raigad", city: "Dolvi", state: "Maharashtra" },
  "370421": { district: "Kutch", city: "Mundra", state: "Gujarat" },
  "500081": { district: "Hyderabad", city: "Hyderabad", state: "Telangana" },
  "700001": { district: "Kolkata", city: "Kolkata", state: "West Bengal" },
  "380001": { district: "Ahmedabad", city: "Ahmedabad", state: "Gujarat" },
  "682001": { district: "Ernakulam", city: "Kochi", state: "Kerala" },
  "411001": { district: "Pune", city: "Pune", state: "Maharashtra" },
  "600001": { district: "Chennai", city: "Chennai", state: "Tamil Nadu" },
  /* The enterprise's own plants, so their records resolve like any other */
  "755026": { district: "Jajpur", city: "Jajpur", state: "Odisha" },
  "759121": { district: "Dhenkanal", city: "Dhenkanal", state: "Odisha" },
  "410203": { district: "Raigad", city: "Khopoli", state: "Maharashtra" },
  "201010": { district: "Ghaziabad", city: "Ghaziabad", state: "Uttar Pradesh" },
}

/** Look up a postal code. Returns undefined when it is not a code we know. */
export const areaForPostalCode = (code: string) => postalAreas[code.trim()]

const coordsFor: Record<string, [string, string]> = {
  Jamshedpur: ["22.8046", "86.2029"], Pune: ["18.5204", "73.8567"], Chennai: ["13.0827", "80.2707"],
  Kolkata: ["22.5726", "88.3639"], Nagpur: ["21.1458", "79.0882"], Vijayanagar: ["15.1394", "76.6400"],
  Vadodara: ["22.3072", "73.1812"], Mumbai: ["19.0760", "72.8777"], "Navi Mumbai": ["19.0330", "73.0297"],
  Jamnagar: ["22.4707", "70.0577"], Dolvi: ["18.7000", "73.0000"], Mundra: ["22.8394", "69.7219"],
  Hyderabad: ["17.3850", "78.4867"], Hosur: ["12.7409", "77.8253"], Renukoot: ["24.2000", "83.0333"],
  Jharsuguda: ["21.8558", "84.0062"], Kochi: ["9.9312", "76.2673"], Ahmedabad: ["23.0225", "72.5714"],
  Jajpur: ["20.8500", "86.3300"], Dhenkanal: ["20.6500", "85.6000"], Khopoli: ["18.7890", "73.3450"],
  Ghaziabad: ["28.6692", "77.4538"],
}

/** A city's coordinates, so a postal code can drop the map pin */
export const coordsForCity = (city: string) => {
  const point = coordsFor[city]
  return point ? { lat: point[0], lng: point[1] } : undefined
}
