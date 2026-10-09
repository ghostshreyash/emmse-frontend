import { useSyncExternalStore } from "react"

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange)
  window.addEventListener("offline", onChange)
  return () => {
    window.removeEventListener("online", onChange)
    window.removeEventListener("offline", onChange)
  }
}

/** Whether the browser has a network connection, kept live as it changes */
export function useOnline() {
  return useSyncExternalStore(subscribe, () => navigator.onLine, () => true)
}
