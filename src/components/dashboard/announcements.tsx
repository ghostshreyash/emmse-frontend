import { ChevronRight, Megaphone } from "lucide-react"

import { SectionCard } from "@/components/common/section-card"
import { announcements } from "@/data/dashboard"

export function Announcements() {
  return (
    <SectionCard title="Announcements" icon={<Megaphone className="size-4 text-primary" />} viewAllTo="/support">
      <ul className="space-y-2.5">
        {announcements.map((a) => (
          <li key={a.title} className="flex gap-1.5 text-xs">
            <ChevronRight className="mt-0.5 size-3.5 shrink-0 text-primary" />
            <span>
              <span className="block">{a.title}</span>
              <span className="text-[0.65rem] text-muted-foreground">{a.date}</span>
            </span>
          </li>
        ))}
      </ul>
    </SectionCard>
  )
}
