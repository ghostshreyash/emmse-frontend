import { useNavigate } from "react-router"
import { ChevronDown, LogOut, UserRound } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth/context"

/**
 * The signed-in user, top right of the bar: avatar and name, opening onto their
 * role, My Profile and Log out - as the OCC console carries it.
 */
export function UserMenu() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  if (!user) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-md px-1.5 py-1 text-sm font-medium outline-none hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/40"
        aria-label={`Account menu for ${user.name}`}
      >
        <Avatar className="size-8 ring-2 ring-white/70">
          <AvatarFallback className="bg-primary text-xs font-semibold text-primary-foreground">{user.initials}</AvatarFallback>
        </Avatar>
        <span className="hidden max-w-36 truncate sm:inline">{user.name}</span>
        <ChevronDown className="size-4 opacity-80" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        {/* The role heads the menu, as on the OCC console; OLIVINE assigns it */}
        <DropdownMenuLabel>{user.role}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          <UserRound /> My Profile
        </DropdownMenuItem>
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            signOut()
            navigate("/login?reason=signed-out", { replace: true })
          }}
        >
          <LogOut /> Log out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
