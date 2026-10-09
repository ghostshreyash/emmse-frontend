import { useEffect, useState } from "react"
import { useNavigate } from "react-router"
import { format } from "date-fns"
import { Bell, Leaf, LogOut, MapPin } from "lucide-react"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { useAuth } from "@/lib/auth/context"

function useClock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  return now
}

/** EMMS-E top bar (dashboard mockup, page 31): wordmark, tagline, site, clock, alerts and Logout */
export function Topbar() {
  const now = useClock()
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-4 border-b border-topbar-border bg-topbar px-4 text-topbar-foreground">
      <SidebarTrigger className="text-topbar-foreground hover:bg-white/10 hover:text-topbar-foreground" />

      <div className="min-w-0">
        <h1 className="truncate text-2xl leading-none font-black tracking-tight">
          EMMS<span className="text-sky-300">-E</span>
          <sup className="ml-0.5 align-super text-[0.55rem] font-bold">™</sup>
        </h1>
        <p className="hidden truncate text-[0.7rem] text-topbar-foreground/90 sm:block">
          Electrical Maintenance Management System - Enterprise Edition
        </p>
      </div>

      <div className="ml-auto hidden items-center gap-2 text-xs leading-tight italic text-topbar-muted-foreground xl:flex">
        <Leaf className="size-5 shrink-0 fill-healthy text-healthy" />
        <span>
          People. Technology. Reliability.
          <br />A Greener Future.
        </span>
      </div>

      {/* The site this admin is looking at */}
      <div className="hidden items-center gap-2 border-l border-topbar-border pl-4 text-sm leading-tight md:flex">
        <MapPin className="size-5 shrink-0" />
        <span>
          <span className="block font-semibold">{user?.enterprise}</span>
          <span className="block text-topbar-muted-foreground">{user?.plant}</span>
        </span>
      </div>

      <div className="hidden border-l border-topbar-border pl-4 text-sm leading-tight lg:block">
        <div className="font-semibold">{format(now, "EEE, d MMM yyyy")}</div>
        <div className="text-topbar-muted-foreground">{format(now, "hh:mm a")}</div>
      </div>

      <button type="button" aria-label="Notifications" className="relative rounded-full p-2 hover:bg-white/10 max-md:ml-auto">
        <Bell className="size-5" />
        <span className="absolute top-0.5 right-0.5 flex size-4 items-center justify-center rounded-full bg-critical text-[0.6rem] font-bold text-critical-foreground">
          3
        </span>
      </button>

      <button
        type="button"
        onClick={() => {
          signOut()
          navigate("/login?reason=signed-out", { replace: true })
        }}
        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium hover:bg-white/10"
      >
        <LogOut className="size-5" />
        <span className="hidden sm:inline">Logout</span>
      </button>
    </header>
  )
}
