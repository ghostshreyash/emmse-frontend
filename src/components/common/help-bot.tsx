import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router"
import { Bot, ListTree, MessageCircle, Send, TriangleAlert, X } from "lucide-react"

import { Bubble, BubbleContent } from "@/components/ui/bubble"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Message, MessageContent, MessageFooter, MessageGroup } from "@/components/ui/message"
import { ReportIssueDialog } from "@/components/common/report-issue-dialog"
import type { FaqEntry } from "@/data/faq"
import type { BotReply } from "@/lib/help-bot"

/**
 * The help assistant, docked bottom-right on every screen inside the app shell.
 *
 * It answers out of OLIVINE's own FAQ sheet and nothing else - see lib/help-bot
 * for the matching and data/faq.ts for the rows, which are the sheet's EMMS-E
 * rows only. What it is for is the process questions an enterprise
 * administrator asks: how an asset is onboarded, how a health report is pulled,
 * how preventive maintenance is scheduled, what a pending approval means.
 * Those are what the suggested questions offer.
 *
 * It is deliberately not a modal - the screen behind stays readable, because
 * the answer is usually about the screen being read.
 *
 * The conversation lives in this component, which the shell mounts once, so it
 * survives moving between screens and is lost on sign-out. Nothing is stored.
 *
 * The FAQ it answers from is the largest data module in the app and the
 * launcher is on every screen, so the matcher is fetched on the first opening
 * rather than with the app. The pause before the first reply covers the fetch.
 *
 * Ported from EVITA's `components/evita/help-bot.tsx`, including the dead end:
 * when nothing matches, the sheet's own row for it is offered - which answers
 * "raise a ticket" - and so are the two ways to do that. The client's rule is
 * that tickets are the escalation path for exactly what the chatbot cannot
 * resolve, so this bubble is where a ticket most often starts.
 */

type Turn = {
  id: number
  role: "me" | "bot"
  text: string
  /** The row the answer came from, traced under the bubble so it can be checked */
  source?: FaqEntry
  /** Questions offered under the reply, as something to click rather than type */
  suggestions?: FaqEntry[]
  /** Nothing matched, so the suggestions are the nearest rows and not follow-ups */
  stuck?: boolean
}

const greeting =
  "Hello. I can walk you through how something is done in EMMS-E - the answers are OLIVINE's own, word for word. Pick a question or type your own."

const nothingMatched =
  "I don't have an approved answer for that one. The FAQ is all I read from, and guessing about an electrical asset is not worth the risk."

/** One reply from the matcher, turned into the bubble that shows it */
function turnFor(reply: BotReply, id: number): Turn {
  if (reply.kind === "answer") {
    return { id, role: "bot", text: reply.entry.answer, source: reply.entry, suggestions: reply.related }
  }
  if (reply.kind === "reply") return { id, role: "bot", text: reply.text }
  return { id, role: "bot", text: nothingMatched, suggestions: reply.related, stuck: true }
}

/**
 * The matcher and the sheet behind it, fetched once and then held. Kept outside
 * the component so a second sign-in does not fetch it again.
 */
let matcher: Promise<typeof import("@/lib/help-bot")> | null = null
const loadMatcher = () => (matcher ??= import("@/lib/help-bot"))

/** Long enough that a reply reads as an answer rather than a lookup */
const beat = 420
const pause = () => new Promise<void>((resolve) => window.setTimeout(resolve, beat))

export function HelpBot() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [raising, setRaising] = useState(false)
  const [turns, setTurns] = useState<Turn[]>([])
  const [draft, setDraft] = useState("")
  const [thinking, setThinking] = useState(false)

  const nextId = useRef(0)
  const scroller = useRef<HTMLDivElement>(null)
  const panel = useRef<HTMLDivElement>(null)

  /* A reply in flight when the shell goes - at sign-out - has nowhere to land */
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])

  /** The newest bubble is the one being read, so it stays in view */
  useEffect(() => {
    const el = scroller.current
    if (el) el.scrollTop = el.scrollHeight
  }, [turns, thinking, open])

  /* Opening moves the reading position into it, so Escape and the field are reachable */
  useEffect(() => {
    if (open) panel.current?.focus()
  }, [open])

  /** Opening it the first time is what fetches the sheet and writes the greeting */
  function openBot() {
    setOpen(true)
    if (turns.length) return

    setThinking(true)
    Promise.all([loadMatcher(), pause()]).then(([{ botStarters }]) => {
      if (!alive.current) return
      setTurns([{ id: nextId.current++, role: "bot", text: greeting, suggestions: botStarters }])
      setThinking(false)
    })
  }

  function ask(question: string) {
    const asked = question.trim()
    if (!asked || thinking) return

    setDraft("")
    setTurns((before) => [...before, { id: nextId.current++, role: "me", text: asked }])
    setThinking(true)

    /*
     * The matching itself is instant, so the beat is what makes a reply read as
     * an answer rather than a lookup. On the first question it is also the
     * fetch, which is why both are waited on together.
     */
    Promise.all([loadMatcher(), pause()]).then(([{ askBot }]) => {
      if (!alive.current) return
      setTurns((before) => [...before, turnFor(askBot(asked), nextId.current++)])
      setThinking(false)
    })
  }

  /** Hand it to the people who can act on it, and get out of the way */
  function handOff(to: "ticket" | "faq") {
    setOpen(false)
    if (to === "ticket") setRaising(true)
    else navigate("/support")
  }

  /*
   * The launcher and the panel are the two faces of the same thing, and the
   * dialog sits beside both: handing off closes the bubble, so a dialog rendered
   * inside the panel would unmount on the way to being opened.
   */
  if (!open) {
    return (
      <>
        <Button
          type="button"
          size="icon-lg"
          aria-label="Open the help assistant"
          onClick={openBot}
          className="fixed right-4 bottom-4 z-40 size-12 rounded-full shadow-lg shadow-primary/30"
        >
          <MessageCircle className="size-5" />
        </Button>
        <ReportIssueDialog open={raising} onOpenChange={setRaising} />
      </>
    )
  }

  return (
    <section
      ref={panel}
      tabIndex={-1}
      role="dialog"
      aria-label="EMMS-E help assistant"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false)
      }}
      className="fixed inset-x-3 bottom-4 z-40 flex max-h-[min(32rem,72svh)] flex-col overflow-hidden rounded-xl bg-card shadow-2xl ring-1 ring-foreground/10 outline-none sm:inset-x-auto sm:right-4 sm:w-[24rem]"
    >
      <header className="flex shrink-0 items-center gap-2.5 border-b px-3 py-2">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Bot className="size-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-semibold text-brand-navy dark:text-foreground">EMMS-E Help</span>
          <span className="block truncate text-[0.65rem] text-muted-foreground">Answers from OLIVINE's approved FAQ</span>
        </span>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Close the help assistant" onClick={() => setOpen(false)}>
          <X />
        </Button>
      </header>

      <div ref={scroller} aria-live="polite" className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3">
        <MessageGroup className="gap-3.5">
          {turns.map((turn, at) => (
            <Message key={turn.id} align={turn.role === "me" ? "end" : "start"}>
              {turn.role === "bot" ? <BotFace /> : null}

              <MessageContent>
                <Bubble
                  variant={turn.role === "me" ? "default" : "muted"}
                  align={turn.role === "me" ? "end" : "start"}
                  className={turn.role === "bot" ? "max-w-full" : undefined}
                >
                  <BubbleContent className="text-xs leading-relaxed">{turn.text}</BubbleContent>
                </Bubble>

                {/* Which row answered, so a wrong answer can be traced back to the sheet */}
                {turn.source ? (
                  <MessageFooter className="gap-1.5 text-[0.65rem]">
                    <span className="tabular-nums">{turn.source.id}</span>
                    <span aria-hidden>·</span>
                    <span className="truncate">{turn.source.category}</span>
                  </MessageFooter>
                ) : null}

                {/* Only the last reply offers follow-ups; older ones would answer a question that moved on */}
                {at === turns.length - 1 && !thinking ? (
                  <Suggestions turn={turn} onAsk={ask} onHandOff={handOff} />
                ) : null}
              </MessageContent>
            </Message>
          ))}

          {thinking ? (
            <Message align="start">
              <BotFace />
              <MessageContent>
                <Bubble variant="muted">
                  <BubbleContent>
                    <span className="sr-only">Looking for an answer</span>
                    <span aria-hidden className="flex items-center gap-1 py-0.5">
                      {[0, 1, 2].map((dot) => (
                        <span
                          key={dot}
                          className="size-1.5 animate-bounce rounded-full bg-foreground/40"
                          style={{ animationDelay: `${dot * 120}ms` }}
                        />
                      ))}
                    </span>
                  </BubbleContent>
                </Bubble>
              </MessageContent>
            </Message>
          ) : null}
        </MessageGroup>
      </div>

      <form
        className="flex shrink-0 items-center gap-2 border-t p-2"
        onSubmit={(event) => {
          event.preventDefault()
          ask(draft)
        }}
      >
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Ask how something is done"
          aria-label="Ask the help assistant"
          autoComplete="off"
          className="h-8 text-xs"
        />
        <Button type="submit" size="icon-sm" aria-label="Send" disabled={!draft.trim() || thinking}>
          <Send />
        </Button>
      </form>
    </section>
  )
}

/**
 * Who is speaking, beside its bubble.
 *
 * Not ui/message's own MessageAvatar: that one lifts itself clear of a message
 * footer, and every answer here has one - the row it came from - which would
 * leave the face floating up the side of the bubble.
 */
function BotFace() {
  return (
    <span aria-hidden className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
      <Bot className="size-3.5" />
    </span>
  )
}

/**
 * What to ask next. Suggested questions are sent as their own exact wording, so
 * the matcher returns that row and never a near miss of it.
 */
function Suggestions({
  turn,
  onAsk,
  onHandOff,
}: {
  turn: Turn
  onAsk: (question: string) => void
  onHandOff: (to: "ticket" | "faq") => void
}) {
  const questions = turn.suggestions ?? []
  if (!questions.length && !turn.stuck) return null

  return (
    <div className="flex flex-col items-start gap-1.5 pt-0.5">
      {questions.length ? (
        <span className="px-1 text-[0.65rem] font-medium text-muted-foreground">
          {turn.stuck ? "Closest I have" : "Also asked"}
        </span>
      ) : null}

      {questions.map((question) => (
        <Button
          key={question.id}
          type="button"
          variant="outline"
          size="xs"
          onClick={() => onAsk(question.question)}
          className="h-auto min-h-7 w-fit max-w-full py-1 text-left leading-snug whitespace-normal"
        >
          {question.question}
        </Button>
      ))}

      {/* The sheet's own answer to a dead end is: raise a ticket. So offer it. */}
      {turn.stuck ? (
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Button type="button" size="xs" onClick={() => onHandOff("ticket")}>
            <TriangleAlert /> Report an Issue
          </Button>
          <Button type="button" variant="outline" size="xs" onClick={() => onHandOff("faq")}>
            <ListTree /> Browse all answers
          </Button>
        </div>
      ) : null}
    </div>
  )
}
