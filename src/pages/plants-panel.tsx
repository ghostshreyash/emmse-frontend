import { Navigate, useNavigate } from "react-router"
import { ArrowRight, Building2, CalendarDays, Gauge, MapPin, Server, UserRound, UsersRound } from "lucide-react"
import { cn } from "cn"

import { OlivineLogo } from "@/components/layout/olivine-logo"
import { UserMenu } from "@/components/layout/user-menu"
import { plants, type Plant } from "@/data/dashboard"
import { useAuth } from "@/lib/auth/context"
import { healthStatus } from "@/lib/status"

/** A picture per plant, from the equipment photography the app already ships */
const plantPictures: Record<string, string> = {
  JSR: "/brand/assets/substation-transformer.jpg",
  KLN: "/brand/assets/power-transformer.jpg",
  MER: "/brand/assets/ht-panel.jpg",
  KHP: "/brand/assets/lt-panel.jpg",
  SBD: "/brand/assets/mcc-panel.jpg",
}

const segments = ["healthy", "attention", "critical"] as const

/**
 * The Plants screen: where a plant-level user lands straight after sign-in. Every
 * plant of the enterprise is a card; picking one opens the dashboard held to that
 * plant. An enterprise admin never sees this screen - they go straight to the
 * dashboard as before.
 */
export function PlantsPanelPage() {
  const navigate = useNavigate()
  const { user, choosePlant, session } = useAuth()

  // Only a plant-level user has a plant to pick; anyone else belongs on the dashboard
  if (!user?.choosesPlant) return <Navigate to="/" replace />

  const open = (plant: Plant) => {
    choosePlant(plant.id)
    navigate(`/?plant=${plant.id}`)
  }

  return (
    <div className="min-h-svh bg-background">
      {/* ---------- Brand bar ---------- */}
      <header className="flex h-16 items-center gap-4 border-b border-topbar-border bg-topbar px-4 text-topbar-foreground">
        <div className="flex h-12 items-center rounded-md bg-[#f7f4ee] px-2">
          <OlivineLogo className="h-full" />
        </div>
        <div className="min-w-0">
          <h1 className="text-2xl leading-none font-black tracking-tight">
            EMMS<span className="text-sky-300">-E</span>
          </h1>
          <p className="truncate text-xs text-topbar-foreground/80">Electrical Maintenance Management System - Enterprise Edition</p>
        </div>
        <div className="ml-auto">
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-4 md:p-6">
        <div className="mb-5">
          <p className="text-sm text-muted-foreground">Welcome, {user.name.split(" ")[0]}</p>
          <h2 className="text-2xl font-bold text-brand-navy dark:text-foreground">Select a plant</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            These are the {plants.length} plants under your management. Select a plant to open its dashboard.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {plants.map((p) => (
            <PlantCard key={p.id} plant={p} current={session?.plantId === p.id} onOpen={() => open(p)} />
          ))}
        </div>
      </main>
    </div>
  )
}

/** One plant: its picture, what it is, how its assets stand, and who runs it */
function PlantCard({ plant, current, onOpen }: { plant: Plant; current: boolean; onOpen: () => void }) {
  const healthyPct = Math.round((plant.healthy / plant.assets) * 100)
  const facts = [
    { icon: Server, label: "Assets", value: plant.assets.toLocaleString("en-IN") },
    { icon: Gauge, label: "Capacity", value: plant.capacity },
    { icon: Building2, label: "Departments", value: plant.departments },
    { icon: UsersRound, label: "Active Users", value: plant.activeUsers },
  ]

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group/plant flex flex-col overflow-hidden rounded-xl bg-card text-left shadow-sm ring-1 ring-foreground/10 transition-[transform,box-shadow] duration-200",
        "hover:shadow-lg hover:ring-primary/40 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none motion-safe:hover:-translate-y-0.5",
        current && "ring-2 ring-primary"
      )}
    >
      {/* ---------- Picture, with the plant's name over it ---------- */}
      <div className="relative h-32 overflow-hidden bg-muted">
        <img
          src={plant.logo ?? plantPictures[plant.id]}
          alt=""
          className="size-full object-cover transition-transform duration-300 motion-safe:group-hover/plant:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/90 via-brand-navy/40 to-transparent" />
        <div className="absolute top-2 left-2 flex gap-1.5">
          <span className="rounded bg-white/90 px-1.5 py-0.5 text-[0.65rem] font-bold text-primary">{plant.id}</span>
          <span className="rounded bg-white/20 px-1.5 py-0.5 text-[0.65rem] font-medium text-white backdrop-blur-sm">{plant.type}</span>
        </div>
        {current ? (
          <span className="absolute top-2 right-2 rounded bg-primary px-1.5 py-0.5 text-[0.65rem] font-semibold text-primary-foreground">Last opened</span>
        ) : null}
        <div className="absolute inset-x-3 bottom-2 text-white">
          <h3 className="text-lg leading-tight font-bold">{plant.name}</h3>
          <p className="flex items-center gap-1 text-xs text-white/85">
            <MapPin className="size-3" /> {plant.location}
          </p>
        </div>
      </div>

      {/* ---------- Key figures ---------- */}
      <div className="grid grid-cols-4 gap-1 border-b px-3 py-2.5">
        {facts.map(({ icon: Icon, label, value }) => (
          <div key={label} className="min-w-0 text-center">
            <Icon className="mx-auto size-4 text-primary" />
            <div className="mt-0.5 text-sm font-bold text-brand-navy tabular-nums dark:text-foreground">{value}</div>
            <div className="truncate text-[0.6rem] text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      {/* ---------- Asset health ---------- */}
      <div className="px-3 pt-2.5">
        <div className="mb-1 flex items-center justify-between text-xs">
          <span className="font-medium">Asset Health</span>
          <span className="font-semibold text-healthy-soft-foreground tabular-nums">{healthyPct}% healthy</span>
        </div>
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          {segments.map((key) => (
            <span key={key} className={healthStatus[key].dot} style={{ width: `${(plant[key] / plant.assets) * 100}%` }} />
          ))}
        </div>
        <div className="mt-1 flex justify-between text-[0.65rem] text-muted-foreground tabular-nums">
          {segments.map((key) => (
            <span key={key} className="flex items-center gap-1">
              <span className={cn("size-1.5 rounded-full", healthStatus[key].dot)} />
              {healthStatus[key].label} {plant[key]}
            </span>
          ))}
        </div>
      </div>

      {/* ---------- Who runs it, and the way in ---------- */}
      <div className="mt-auto flex items-end justify-between gap-2 px-3 pt-3 pb-3">
        <div className="min-w-0 space-y-0.5 text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5 truncate">
            <UserRound className="size-3.5 shrink-0" /> {plant.head} <span className="text-muted-foreground/70">(Plant Head)</span>
          </p>
          <p className="flex items-center gap-1.5">
            <CalendarDays className="size-3.5 shrink-0" /> Since <span className="tabular-nums">{plant.commissioned}</span>
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground transition-colors group-hover/plant:bg-primary/90">
          Open Dashboard <ArrowRight className="size-3.5 transition-transform motion-safe:group-hover/plant:translate-x-0.5" />
        </span>
      </div>
    </button>
  )
}
