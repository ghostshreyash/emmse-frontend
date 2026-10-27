import { plants } from "@/data/dashboard"
import { useAuth } from "@/lib/auth/context"

/**
 * The plant a plant-level (EMMSE-0) user picked after sign-in, by name. Every
 * plant dropdown and plant filter is preselected to it and held there; for any
 * other login this is undefined and the dropdowns work as before.
 */
export function useLockedPlant(): string | undefined {
  const { user, session } = useAuth()
  if (!user?.choosesPlant) return undefined
  return plants.find((p) => p.id === session?.plantId)?.name
}
