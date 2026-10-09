import { NavLink, useLocation } from "react-router"
import { Leaf } from "lucide-react"
import { cn } from "cn"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { OlivineEmblem, OlivineLogo } from "@/components/layout/olivine-logo"
import { navigation, type NavItem } from "@/config/navigation"
import { useOnline } from "@/hooks/use-online"
import { useAuth } from "@/lib/auth/context"

const under = (current: string, path: string) =>
  path === "/" ? current === "/" : current === path || current.startsWith(`${path}/`)

/** A section stays highlighted on its own screens and on the details screens it covers */
function isActivePath(current: string, item: NavItem) {
  return [item.path, ...(item.covers ?? [])].some((path) => under(current, path))
}

/** The signed-in admin, their enterprise and the connection state, above the menu */
function Profile() {
  const { user } = useAuth()
  const online = useOnline()

  return (
    <div className="flex items-center gap-3 border-b border-sidebar-border px-3 py-3 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
      <Avatar className="size-12 ring-2 ring-white/80 group-data-[collapsible=icon]:size-8">
        <AvatarFallback className="bg-primary text-base font-semibold text-primary-foreground">{user?.initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 text-sm leading-tight group-data-[collapsible=icon]:hidden">
        <div className="truncate font-semibold text-sidebar-foreground">{user?.name}</div>
        <div className="truncate text-sidebar-foreground/80">{user?.role}</div>
        <div className="truncate text-sidebar-foreground/80">{user?.enterprise}</div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs">
          <span className={cn("size-2 rounded-full", online ? "bg-healthy" : "bg-offline")} />
          <span className={online ? "text-healthy" : "text-sidebar-foreground/70"}>{online ? "Online" : "Offline"}</span>
        </div>
      </div>
    </div>
  )
}

export function AppSidebar() {
  const { pathname } = useLocation()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-16 items-center justify-center bg-[#f7f4ee] p-1.5">
        <OlivineLogo className="h-full group-data-[collapsible=icon]:hidden" />
        <OlivineEmblem className="hidden size-8 group-data-[collapsible=icon]:block" />
      </SidebarHeader>

      <Profile />

      <SidebarContent className="py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {navigation.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActivePath(pathname, item)}
                    tooltip={item.title}
                    className="h-9 data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground [&_svg]:size-[18px]"
                  >
                    <NavLink to={item.path}>
                      <item.icon />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Mountain artwork from the mockups, fading into the navy sidebar */}
      <SidebarFooter className="relative overflow-hidden p-0 group-data-[collapsible=icon]:hidden">
        <img src="/brand/sidebar-mountains.jpg" alt="" className="h-36 w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-sidebar via-transparent to-sidebar/80" />
        <div className="absolute inset-x-0 bottom-3 flex flex-col items-center gap-1 text-center text-sm text-white">
          <Leaf className="size-6 fill-healthy text-healthy" />
          <span>Reliable Assets. Safer Operations.</span>
          <span>A Greener Tomorrow.</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
