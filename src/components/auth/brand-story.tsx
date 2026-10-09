import { Leaf } from "lucide-react"
import { cn } from "cn"

import { Rise } from "@/components/auth/auth-screen"
import { brand } from "@/config/brand"

/**
 * The panel beside the form, standing on the substation photograph: the
 * wordmark and its edition rule, the benefit medallions, the caption and the
 * promise bar (EMMS-E mockup, page 30). Ported from occ-frontend's `SceneStory`.
 */
export function BrandStory() {
  return (
    <div className="max-w-2xl text-center text-brand-navy">
      <Rise>
        <h2 className="text-5xl font-black tracking-tight sm:text-6xl">
          {brand.wordmark.lead}
          <span className="text-primary">{brand.wordmark.accent}</span>
          <sup className="ml-1 align-super text-base font-bold">™</sup>
        </h2>
        <p className="mt-2 text-xl font-bold leading-tight">{brand.system}</p>
        <p className="mx-auto mt-1 w-fit border-b-2 border-brand-gold pb-1 text-xl font-bold">{brand.edition}</p>
        <p className="mt-3 text-lg font-medium text-brand-navy/80">{brand.tagline}</p>
      </Rise>

      <ul className="mt-7 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-4">
        {brand.medallions.map(({ icon: Icon, lines, tone }, i) => (
          <li key={lines.join(" ")}>
            <Rise delay={140 + i * 80}>
              <div className="flex flex-col items-center gap-2 px-1">
                <span className="group/med relative flex size-14 items-center justify-center">
                  <span
                    aria-hidden
                    className={cn(
                      "absolute inset-0 rounded-full opacity-45 blur-md transition-opacity duration-300 group-hover/med:opacity-80",
                      tone.replace("text-", "bg-")
                    )}
                  />
                  <span
                    className={cn(
                      "relative flex size-14 items-center justify-center rounded-full bg-gradient-to-br from-white to-slate-100",
                      "shadow-[0_8px_20px_rgba(11,31,68,0.18),inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-white/70",
                      "transition-transform duration-300 group-hover/med:-translate-y-1 group-hover/med:scale-105",
                      tone
                    )}
                  >
                    <Icon className="size-7" strokeWidth={2.2} />
                  </span>
                </span>
                <span className="text-sm leading-tight font-bold">
                  {lines[0]}
                  <br />
                  {lines[1]}
                </span>
              </div>
            </Rise>
          </li>
        ))}
      </ul>

      <Rise delay={460}>
        <p className="mt-8 ml-auto flex w-fit items-start gap-2 rounded-r-lg border-l-[3px] border-brand-gold bg-white/70 py-2 pr-3 pl-3 text-left text-base leading-snug font-semibold backdrop-blur-[2px]">
          <span>
            {brand.caption[0]}
            <br />
            {brand.caption[1]}
          </span>
          <Leaf className="mt-0.5 size-5 shrink-0 text-healthy" />
        </p>
      </Rise>

      <Rise delay={520}>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-7 gap-y-3 rounded-xl bg-brand-navy/92 px-5 py-3 text-brand-navy-foreground shadow-xl ring-1 ring-white/10 backdrop-blur-sm">
          {brand.promises.map(({ icon: Icon, label }, i) => (
            <li key={label} className={cn("flex items-center gap-2 pl-0", i > 0 && "border-l border-white/20 pl-5")}>
              <Icon className="size-5 shrink-0 text-brand-gold" />
              <span className="text-xs leading-tight font-semibold">
                {label.split(" ")[0]}
                <br />
                {label.split(" ").slice(1).join(" ")}
              </span>
            </li>
          ))}
        </ul>
      </Rise>
    </div>
  )
}
