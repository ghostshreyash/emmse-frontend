import { Leaf, Settings, ShieldCheck, TrendingUp, Users, Zap, type LucideIcon } from "lucide-react"

/**
 * Everything the EMMS-E sign-in screens say about the product.
 *
 * In occ-frontend this is the `emmse` entry of a three-brand table
 * (`src/config/brands.ts`) picked by hostname. EMMS-E is its own deployment, so
 * only its entry lives here; keep the wording in step with that file when either
 * changes.
 */
export const brand = {
  /** Wordmark, split so the accent half can be coloured */
  wordmark: { lead: "EMMS", accent: "-E" },
  system: "Electrical Maintenance Management System",
  edition: "Enterprise Edition",
  tagline: "Smart Maintenance. Reliable Assets. Sustainable Tomorrow.",
  /** Benefit medallions across the story panel */
  medallions: [
    { icon: Settings, lines: ["Improve", "Asset Reliability"], tone: "text-primary" },
    { icon: TrendingUp, lines: ["Optimize", "Maintenance Cost"], tone: "text-healthy" },
    { icon: ShieldCheck, lines: ["Ensure", "Safety & Compliance"], tone: "text-brand-gold" },
    { icon: Leaf, lines: ["Enable", "Sustainability"], tone: "text-healthy" },
  ] satisfies { icon: LucideIcon; lines: [string, string]; tone: string }[],
  /** Line set over the scene beside the medallions */
  caption: ["Powering Reliable Operations", "for a Greener Tomorrow."],
  /** Short promises along the foot of the story panel */
  promises: [
    { icon: Zap, label: "Higher Asset Uptime" },
    { icon: Users, label: "Operational Excellence" },
    { icon: Leaf, label: "Cleaner Operations" },
    { icon: ShieldCheck, label: "Safer Workplaces" },
  ] satisfies { icon: LucideIcon; label: string }[],
  /**
   * Photograph behind the sign-in screen.
   * TODO: replace with OLIVINE's own licensed photography on its own CDN.
   */
  photo: "/brand/emmse-scene.jpg",
  /** Contact bar along the foot of the screen */
  contacts: {
    web: "www.olivineglobalsystems.com",
    email: "support@olivineglobalsystems.com",
    phone: "+91 22 4890 1000",
  },
  login: {
    heading: "Enterprise Login",
    description: "Access EMMS-E to manage, maintain and ensure the reliability of your electrical assets.",
    identifierLabel: "Enterprise ID / Registered Email",
    identifierPlaceholder: "Enter your Enterprise ID or Email",
    submitLabel: "Login to EMMS-E",
    footnote: {
      title: "New Enterprise?",
      body: "Contact Olivine Global Systems to onboard your enterprise.",
      linkLabel: "Request Access",
      to: "/register",
    },
  },
} as const
