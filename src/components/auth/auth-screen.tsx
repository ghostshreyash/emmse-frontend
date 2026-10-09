import { Link } from "react-router"
import { ChevronDown, Globe, Leaf, LifeBuoy, Mail, Phone, ShieldCheck } from "lucide-react"
import { cn } from "cn"

import { Button } from "@/components/ui/button"
import { OlivineLogo } from "@/components/layout/olivine-logo"
import { brand } from "@/config/brand"

/** Staggered entrance, so the screen assembles rather than appearing at once. */
export function Rise({
  delay = 0,
  className,
  children,
}: {
  delay?: number
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn("animate-rise", className)} style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  )
}

/**
 * The frame every sign-in screen shares: the substation photograph behind a
 * light wash, the Olivine bar on top, the story panel on the left and the card
 * on the right, and the contact bar along the foot (EMMS-E mockup, page 30).
 *
 * Login, verification, password reset and the request forms all render inside
 * it, so moving between them changes the card and nothing else.
 *
 * Ported from occ-frontend's three-brand `auth-screen.tsx`, keeping only the
 * EMMS-E presentation.
 */
export function AuthScreen({
  story,
  width = "default",
  children,
}: {
  /** Left-hand panel; omitted on the short forms, which centre the card. */
  story?: React.ReactNode
  /** "wide" gives the form-heavy screens room for their two-column fields. */
  width?: "default" | "wide"
  children: React.ReactNode
}) {
  return (
    <div className="group relative flex min-h-svh flex-col overflow-hidden bg-brand-navy text-brand-navy-foreground">
      {/* Scene */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <img src={brand.photo} alt="" className="absolute inset-0 size-full object-cover object-top" />
        <div className="absolute inset-0 bg-gradient-to-r from-white/60 via-white/18 via-48% to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/55 to-transparent" />
      </div>

      <header className="relative flex items-center justify-between gap-3 bg-white/90 px-4 py-2 shadow-sm backdrop-blur-md sm:px-8 lg:px-12">
        <Rise>
          <Link to="/login" aria-label="Olivine Global Systems" className="inline-block">
            <OlivineLogo className="h-12 w-auto sm:h-16" />
          </Link>
        </Rise>
        <Rise delay={80} className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-200 bg-white text-brand-navy hover:bg-slate-50 max-sm:hidden"
            aria-label="Change language"
          >
            <Globe /> English <ChevronDown />
          </Button>
          <Button variant="outline" size="sm" asChild className="border-slate-200 bg-white text-brand-navy backdrop-blur-sm hover:bg-slate-50">
            <a href="#support">
              <LifeBuoy /> Help
            </a>
          </Button>
        </Rise>
      </header>

      <main
        className={cn(
          "relative z-10 mx-auto grid w-full max-w-7xl flex-1 items-center gap-10 px-4 pb-8 sm:px-8",
          story && "lg:grid-cols-[minmax(0,1fr)_minmax(0,27rem)] lg:gap-12 lg:px-10"
        )}
      >
        {story ? <div className="min-w-0 max-lg:hidden">{story}</div> : null}
        <div className={cn("w-full", story ? "lg:justify-self-end" : cn("mx-auto", width === "wide" ? "max-w-2xl" : "max-w-md"))}>
          {children}
        </div>
      </main>

      <footer
        id="support"
        className="relative z-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 bg-brand-navy px-4 py-3 text-xs text-brand-navy-foreground/85 sm:px-8"
      >
        <span className="flex items-center gap-1.5">
          <Globe className="size-3.5 text-brand-gold" /> {brand.contacts.web}
        </span>
        <span className="flex items-center gap-1.5">
          <Mail className="size-3.5 text-brand-gold" /> {brand.contacts.email}
        </span>
        <span className="flex items-center gap-1.5">
          <Phone className="size-3.5 text-brand-gold" /> {brand.contacts.phone}
        </span>
        <span className="flex items-center gap-3">
          <a href="#" className="hover:text-brand-gold">Terms of Use</a>|
          <a href="#" className="hover:text-brand-gold">Privacy Policy</a>|
          <Link to="/account-recovery" className="hover:text-brand-gold">Support</Link>
        </span>
        <span className="flex items-center gap-1.5 italic">
          <Leaf className="size-3.5 text-healthy" /> People. Technology. Reliability. A Greener Future.
        </span>
      </footer>
    </div>
  )
}

/**
 * The card itself. Every auth step uses it, so the box stays put while its
 * contents change — the verification step feels like the next page of the same
 * form rather than a different screen. EMMS-E centres its title under a gold rule.
 */
export function AuthCard({
  title,
  description,
  badge,
  above,
  children,
  footer,
  delay = 120,
}: {
  title: string
  description?: string
  /** Small pill over the title, e.g. the step. */
  badge?: React.ReactNode
  /** Between the header and the form, e.g. the step dots. */
  above?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  delay?: number
}) {
  return (
    <Rise delay={delay}>
      <section className="rounded-2xl border bg-card/95 p-6 text-card-foreground shadow-xl shadow-primary/5 backdrop-blur-sm sm:p-8">
        {badge ? <div className="mb-3 flex justify-center">{badge}</div> : null}
        <h1 className="mx-auto w-fit border-b-2 border-brand-gold pb-2 text-center text-3xl font-bold tracking-tight text-brand-navy dark:text-foreground">
          {title}
        </h1>
        {description ? <p className="mx-auto mt-3 max-w-xs text-center text-sm text-muted-foreground">{description}</p> : null}
        {above ? <div className="mt-5">{above}</div> : null}
        <div className="mt-6">{children}</div>
        {footer ? (
          <div className="mt-6">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <ShieldCheck className="size-5 text-muted-foreground" />
              <span className="h-px flex-1 bg-border" />
            </div>
            {footer}
          </div>
        ) : null}
      </section>
    </Rise>
  )
}

/**
 * Links that sit under the card. The scene behind them is a bright photograph,
 * so they carry their own backing.
 */
export function AuthAside({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex justify-center">
      <div className="rounded-full bg-brand-navy/70 px-4 py-1.5 text-center text-sm text-brand-navy-foreground backdrop-blur-sm">
        {children}
      </div>
    </div>
  )
}

/** Small capsule used for the step indicator above a card title. */
export function AuthBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
      {children}
    </span>
  )
}

/** Error / notice panel. */
export function AuthNotice({
  variant = "error",
  icon,
  children,
}: {
  variant?: "error" | "warning" | "info"
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      role="alert"
      className={cn(
        "mb-4 flex items-start gap-2.5 rounded-lg border px-3 py-2.5 text-sm animate-in fade-in slide-in-from-top-1",
        variant === "error" && "border-critical/30 bg-critical-soft text-critical-soft-foreground",
        variant === "warning" && "border-attention/40 bg-attention-soft text-attention-soft-foreground",
        variant === "info" && "border-info/25 bg-info-soft text-info-soft-foreground"
      )}
    >
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <span className="min-w-0">{children}</span>
    </div>
  )
}

/** Primary action, with a sheen that sweeps across on hover. */
export function AuthSubmit({
  busy,
  disabled,
  children,
  className,
}: {
  busy?: boolean
  disabled?: boolean
  children: React.ReactNode
  className?: string
}) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={busy || disabled}
      className={cn("group/submit relative h-11 w-full overflow-hidden text-base font-semibold", className)}
    >
      <span
        aria-hidden
        className="absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 opacity-0 group-hover/submit:opacity-100 group-hover/submit:animate-sheen"
      />
      {children}
    </Button>
  )
}
