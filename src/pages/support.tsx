import { useMemo, useState } from "react"
import { Link } from "react-router"
import {
  Building2,
  ChevronRight,
  Clock,
  Factory,
  Headset,
  ListTree,
  Mail,
  Phone,
  Search,
  Ticket,
  TriangleAlert,
  UserRound,
  X,
} from "lucide-react"
import { cn } from "cn"

import { PageHeader } from "@/components/common/page-header"
import { ReportIssueDialog } from "@/components/common/report-issue-dialog"
import { SectionCard } from "@/components/common/section-card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { enterpriseInfo } from "@/data/dashboard"
import { faqCategories, faqEntries, searchFaq } from "@/data/faq"
import { olivineSupport } from "@/data/support"
import { useAuth } from "@/lib/auth/context"
import { control } from "@/lib/data-table"

/**
 * Contact & Help: the answers first, then who to contact, then the ticket.
 *
 * The answers come first because most questions end there. Under them the
 * account the question is being asked from, then the support line, and last the
 * ticket - the thing to do only once the answers have not helped. That order is
 * the client's own: tickets are the escalation path for what the chatbot cannot
 * resolve, not the front door.
 *
 * The FAQ is the client's `Olivine_APP_AI_Chatbot_FAQ_` sheet, unedited - see
 * data/faq.ts, which holds the rows the sheet marks for EMMS-E. The same rows
 * the help bubble answers from, so the two can never give different answers to
 * the same question; this screen is the way to read them all rather than one at
 * a time. Browsed in two steps - the topics, then the questions inside one -
 * because 99 answers in a single list is not a list anyone reads. Searching
 * skips straight to the answers, across every topic at once.
 *
 * Ported from EVITA's Contact screen. EVITA shows an ELPREMAR their reporting
 * line, because their questions about an assignment go to a supervisor and not
 * to OCC; an enterprise administrator has no such line - they **are** the line -
 * so that card shows the account and the enterprise it speaks for instead.
 */
export function SupportPage() {
  const { user } = useAuth()
  const [raising, setRaising] = useState(false)
  const [query, setQuery] = useState("")
  const [topic, setTopic] = useState<string | null>(null)

  const searching = query.trim().length > 0

  /** Searching looks across every topic; otherwise the chosen one is the scope */
  const answers = useMemo(() => {
    if (searching) return searchFaq(faqEntries, query)
    if (topic) return faqEntries.filter((entry) => entry.category === topic)
    return []
  }, [searching, query, topic])

  /** How many answers each topic holds, so the list says what is behind it */
  const counts = useMemo(() => {
    const map = new Map<string, number>()
    for (const entry of faqEntries) map.set(entry.category, (map.get(entry.category) ?? 0) + 1)
    return map
  }, [])

  const browsing = !searching && !topic

  const clear = () => {
    setTopic(null)
    setQuery("")
  }

  return (
    <div>
      <PageHeader
        title="Contact & Help"
        description="Find the answer first, reach the OLIVINE helpdesk, or raise a ticket."
        breadcrumbs={[{ label: "Contact & Help" }]}
        actions={
          <>
            <Button size="sm" className={control} onClick={() => setRaising(true)}>
              <TriangleAlert className="size-3.5" /> Report an Issue
            </Button>
            <Button variant="outline" size="sm" className={cn(control, "bg-card")} asChild>
              <Link to="/support-tickets"><Ticket className="size-3.5" /> My Tickets</Link>
            </Button>
          </>
        }
      />

      {/* The answers take the width; who to ask and how to raise it sit beside them */}
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1fr)]">
        {/* ---------- The answers first: most questions end here ---------- */}
        <SectionCard
          title={
            <span className="flex items-baseline gap-2">
              Frequently Asked Questions
              <span className="text-xs font-normal tabular-nums text-muted-foreground">{faqEntries.length} answers</span>
            </span>
          }
          icon={<ListTree className="size-4 text-primary" />}
          hoverable={false}
          actions={
            !browsing ? (
              <Button variant="outline" size="sm" className={cn(control, "bg-card")} onClick={clear}>
                <X className="size-3.5" /> All Topics
              </Button>
            ) : null
          }
        >
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search the answers — e.g. health score, approval, onboarding"
              aria-label="Search the FAQ"
              className={cn(control, "bg-card pl-7")}
            />
          </div>

          {browsing ? (
            <ul className="mt-2 divide-y divide-foreground/10">
              {faqCategories.map((name) => (
                <li key={name}>
                  <button
                    type="button"
                    onClick={() => setTopic(name)}
                    className="flex w-full items-center gap-3 rounded-md px-1 py-2 text-left text-xs transition-colors hover:bg-muted/60"
                  >
                    <span className="min-w-0 flex-1 font-medium">{name}</span>
                    <span className="shrink-0 rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] font-semibold tabular-nums">
                      {counts.get(name) ?? 0}
                    </span>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="mt-2 text-xs text-muted-foreground">
                {searching
                  ? `${answers.length} answer${answers.length === 1 ? "" : "s"} for “${query.trim()}”`
                  : `${topic} · ${answers.length} answer${answers.length === 1 ? "" : "s"}`}
              </p>

              {answers.length ? (
                <Accordion type="single" collapsible className="mt-1">
                  {answers.map((entry) => (
                    <AccordionItem key={entry.id} value={entry.id}>
                      <AccordionTrigger className="py-2.5 text-left text-xs font-semibold hover:no-underline">
                        {entry.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-xs leading-relaxed text-foreground/85">
                        <p>{entry.answer}</p>
                        {/* Which row answered, so a wrong answer can be traced back to the sheet */}
                        <p className="mt-2 text-[0.65rem] text-muted-foreground">
                          <span className="tabular-nums">{entry.id}</span>
                          {searching ? <> · {entry.category}</> : null}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="py-10 text-center text-xs text-muted-foreground">
                  Nothing matches that. Try fewer words, or raise a ticket and the OLIVINE helpdesk will answer it.
                </p>
              )}
            </>
          )}
        </SectionCard>

        <div className="space-y-4">
          {/* ---------- Who is asking, and for whom ---------- */}
          <SectionCard title="Your Account" icon={<UserRound className="size-4 text-primary" />} hoverable={false}>
            <dl className="divide-y divide-foreground/10">
              <Line icon={UserRound} label="Signed in as" value={user?.name ?? "—"} />
              <Line icon={Headset} label="Role" value={user?.role ?? "—"} />
              <Line icon={Building2} label="Enterprise" value={enterpriseInfo.name} />
              <Line icon={Factory} label="Plant" value={user?.plant ?? "—"} />
              <Line
                icon={Mail}
                label="E-mail"
                value={user?.email ? <a href={`mailto:${user.email}`} className="text-primary">{user.email}</a> : "—"}
              />
            </dl>
            <p className="mt-2 text-[0.7rem] text-muted-foreground">
              A ticket raised from this portal carries these details, so the helpdesk knows which enterprise and plant
              it concerns without asking.
            </p>
          </SectionCard>

          {/* ---------- Raising it with OLIVINE ---------- */}
          <SectionCard title="Get Help" icon={<Headset className="size-4 text-primary" />} hoverable={false}>
            <p className="text-xs text-muted-foreground">
              Still stuck after the answers? Call or write — and if it needs tracking, raise a ticket. That is the
              channel to OCC, and it stays open until it is closed.
            </p>
            {/* Placeholder details until OLIVINE publish theirs — see data/support.ts */}
            <dl className="mt-2 divide-y divide-foreground/10 border-y border-foreground/10">
              <Line
                icon={Phone}
                label="Support line"
                value={
                  <a href={`tel:${olivineSupport.phoneDial}`} className="tabular-nums text-primary">
                    {olivineSupport.phone}
                  </a>
                }
              />
              <Line
                icon={Mail}
                label="Support e-mail"
                value={
                  <a href={`mailto:${olivineSupport.email}`} className="text-primary">
                    {olivineSupport.email}
                  </a>
                }
              />
              <Line icon={Clock} label="Hours" value={olivineSupport.hours} />
            </dl>
            <p className="mt-2 text-[0.7rem] text-muted-foreground">{olivineSupport.note}</p>
            {/*
              * The ticket closes the card: the line and the hours above it are the
              * quicker answers, and this is what to do when neither has settled it.
              */}
            <Button className="mt-3 w-full" size="sm" onClick={() => setRaising(true)}>
              <TriangleAlert className="size-3.5" /> Report an Issue
            </Button>
          </SectionCard>
        </div>
      </div>

      <ReportIssueDialog open={raising} onOpenChange={setRaising} />
    </div>
  )
}

/** One label-and-value row, in the account card and the support details */
function Line({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-2.5 py-1.5 text-xs">
      <Icon className="size-3.5 shrink-0 text-muted-foreground" />
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="ml-auto min-w-0 truncate text-right font-semibold">{value}</dd>
    </div>
  )
}
