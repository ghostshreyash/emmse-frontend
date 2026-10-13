import { Link } from "react-router"
import { ArrowRight, Building2, CalendarCheck, Factory, Globe, MapPin, Server, type LucideIcon } from "lucide-react"
import { cn } from "cn"

import { enterpriseInfo } from "@/data/dashboard"

const facts: { icon: LucideIcon; label: string; value: string | number }[] = [
  { icon: Factory, label: "Plants", value: enterpriseInfo.plants },
  { icon: Building2, label: "Departments", value: enterpriseInfo.departments },
  { icon: Server, label: "Assets", value: enterpriseInfo.assets.toLocaleString("en-IN") },
]

const { address } = enterpriseInfo
const fullAddress = `${address.line}, ${address.city}, ${address.state} ${address.pincode}, ${address.country}`

/** "Tata Steel Limited" → "TSL" */
const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((word) => word[0])
    .join("")
    .slice(0, 3)
    .toUpperCase()

/** The enterprise's uploaded logo, or a monogram of its initials until it has one */
function EnterpriseLogo({ className }: { className?: string }) {
  return (
    <div className={cn("flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-white shadow-md ring-2 ring-white/30", className)}>
      {enterpriseInfo.logo ? (
        <img src={enterpriseInfo.logo} alt={`${enterpriseInfo.name} logo`} className="size-full object-contain p-1.5" />
      ) : (
        <span aria-hidden="true" className="bg-gradient-to-br from-brand-navy to-primary bg-clip-text text-lg font-black tracking-tight text-transparent">
          {initials(enterpriseInfo.name)}
        </span>
      )}
    </div>
  )
}

/** The admin's own enterprise at a glance, at the top of the dashboard */
export function EnterpriseInfo() {
  return (
    <section className="relative flex h-full flex-col overflow-hidden rounded-xl bg-gradient-to-br from-brand-navy via-brand-navy to-primary p-3 text-white shadow-sm">
      {/* Soft rings in the corner give the panel some depth */}
      <span aria-hidden="true" className="absolute -top-12 -right-10 size-36 rounded-full bg-white/6" />
      <span aria-hidden="true" className="absolute -right-4 -bottom-16 size-28 rounded-full bg-white/5" />

      <div className="relative flex items-center gap-3">
        <EnterpriseLogo className="size-14" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5 text-[0.6rem] font-semibold tracking-wider text-white/60 uppercase">
            Enterprise
            <span className="rounded bg-white/15 px-1.5 py-px tracking-normal text-white normal-case">
              {enterpriseInfo.sector}
            </span>
          </div>
          <h3 className="truncate text-base leading-tight font-bold">{enterpriseInfo.name}</h3>
          <p className="line-clamp-1 text-[0.7rem] text-white/75" title={enterpriseInfo.description}>
            {enterpriseInfo.description}
          </p>
        </div>
        <Link
          to="/settings"
          className="flex shrink-0 items-center gap-1 self-start rounded-full bg-white/10 px-2 py-0.5 text-[0.65rem] font-medium whitespace-nowrap ring-1 ring-white/15 transition-colors hover:bg-white/20"
        >
          View Details <ArrowRight className="size-3" />
        </Link>
      </div>

      <div className="relative mt-2 space-y-0.5 text-[0.7rem] text-white/80">
        <div className="flex items-center gap-1.5" title={fullAddress}>
          <MapPin className="size-3 shrink-0" />
          <span className="truncate">{fullAddress}</span>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5">
          <a
            href={enterpriseInfo.website}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 hover:text-white hover:underline"
          >
            <Globe className="size-3 shrink-0" />
            {enterpriseInfo.website.replace(/^https?:\/\//, "")}
          </a>
          <span className="flex items-center gap-1.5">
            <CalendarCheck className="size-3 shrink-0" />
            Onboarded on <span className="font-semibold text-white tabular-nums">{enterpriseInfo.onboardedOn}</span>
          </span>
        </div>
      </div>

      <dl className="relative mt-auto grid grid-cols-3 gap-2 pt-2.5">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-2 rounded-lg bg-white/10 px-2 py-1.5 ring-1 ring-white/10">
            <Icon className="size-4 shrink-0 text-white/70" />
            <div className="flex min-w-0 flex-col-reverse leading-tight">
              <dt className="truncate text-[0.6rem] text-white/65">{label}</dt>
              <dd className="text-sm font-bold tabular-nums">{value}</dd>
            </div>
          </div>
        ))}
      </dl>
    </section>
  )
}
