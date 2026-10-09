import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Link, useNavigate, useSearchParams } from "react-router"
import { ArrowRight, Building2, Info, Lock, Mail, TriangleAlert } from "lucide-react"

import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { PasswordField, TextField } from "@/components/form/fields"
import { AuthCard, AuthNotice, AuthScreen, AuthSubmit } from "@/components/auth/auth-screen"
import { BrandStory } from "@/components/auth/brand-story"
import { brand } from "@/config/brand"
import { useAuth } from "@/lib/auth/context"
import { signIn } from "@/lib/auth/auth-service"
import { AuthError } from "@/lib/auth/types"
import { portalLoginSchema, type PortalLoginValues } from "./schemas"

/** Why the visitor was sent back here, set by the guard or by signing out. */
const reasons: Record<string, string> = {
  expired: "Your session has expired. Please sign in again.",
  "signed-out": "You have been signed out.",
  reset: "Password updated. Sign in with your new password.",
}

/**
 * Sign in — step 1 of 2.
 *
 * Enterprise Login from the EMMS-E mockup (page 30): the brand story on the
 * substation scene, and the card with the "New Enterprise?" panel beneath the
 * form. Credentials lead to the one-time code step.
 */
export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const { setChallenge } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const next = params.get("next") ?? undefined
  const reason = reasons[params.get("reason") ?? ""]
  const { login } = brand

  const form = useForm<PortalLoginValues>({
    resolver: zodResolver(portalLoginSchema),
    defaultValues: { identifier: "", password: "", remember: false },
  })

  async function onSubmit(values: PortalLoginValues) {
    setError(null)
    try {
      setChallenge(await signIn(values.identifier, values.password, next))
      navigate("/login/verify", { state: { remember: values.remember } })
    } catch (e) {
      setError(e instanceof AuthError ? e.message : "Sign in failed. Please try again.")
    }
  }

  return (
    <AuthScreen story={<BrandStory />}>
      <AuthCard
        title={login.heading}
        description={login.description}
        footer={
          (
            <div className="flex items-start gap-3 rounded-lg bg-info-soft px-4 py-3 text-sm">
              <Building2 className="mt-0.5 size-5 shrink-0 text-primary" />
              <span>
                <span className="block font-semibold text-brand-navy dark:text-foreground">
                  {login.footnote.title}
                </span>
                <span className="text-muted-foreground">{login.footnote.body}</span>
                <Link
                  to={login.footnote.to}
                  className="mt-0.5 block font-medium text-primary underline-offset-4 hover:underline"
                >
                  {login.footnote.linkLabel} →
                </Link>
              </span>
            </div>
          )
        }
      >
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {error ? (
            <AuthNotice icon={<TriangleAlert className="size-4" />}>{error}</AuthNotice>
          ) : reason ? (
            <AuthNotice variant="info" icon={<Info className="size-4" />}>
              {reason}
            </AuthNotice>
          ) : null}

          <div className="space-y-4">
            <TextField
              control={form.control}
              name="identifier"
              label={login.identifierLabel}
              required
              autoComplete="username"
              placeholder={login.identifierPlaceholder}
              startIcon={<Mail />}
              clearable
              inputClassName="h-11"
            />
            <PasswordField
              control={form.control}
              name="password"
              label="Password"
              required
              startIcon={<Lock />}
              placeholder="Enter your password"
            />
          </div>

          <div className="mt-4 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember"
                checked={form.watch("remember")}
                onCheckedChange={(v) => form.setValue("remember", v === true)}
              />
              <Label htmlFor="remember" className="font-normal">
                Remember me
              </Label>
            </div>
            <Link to="/forgot-password" className="text-primary underline-offset-4 hover:underline">
              Forgot password?
            </Link>
          </div>

          <AuthSubmit
            busy={form.formState.isSubmitting}
            className="mt-5 h-12 bg-brand-navy text-brand-navy-foreground hover:bg-brand-navy/90"
          >
            {form.formState.isSubmitting ? <Spinner /> : null}
            {login.submitLabel}
            {form.formState.isSubmitting ? null : <ArrowRight />}
          </AuthSubmit>

          <p className="mt-5 text-center text-xs text-muted-foreground">
            Protected by two-step verification ·{" "}
            <Link to="/account-recovery" className="underline-offset-4 hover:underline">
              Can&apos;t sign in?
            </Link>
          </p>
        </form>
      </AuthCard>

    </AuthScreen>
  )
}
