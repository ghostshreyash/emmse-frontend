import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Building2, Factory, IdCard, Lock, Mail, Pencil, Phone, ShieldCheck, UserRound } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { PageHeader } from "@/components/common/page-header"
import { SectionCard } from "@/components/common/section-card"
import { TextField } from "@/components/form/fields"
import { useAuth } from "@/lib/auth/context"
import { phone, required } from "@/lib/validation"

const profileSchema = z.object({
  name: required("Full name"),
  email: z.email("Enter a valid email address"),
  mobile: phone,
})

type ProfileValues = z.infer<typeof profileSchema>

/** One read-only line in a details list */
function Detail({ icon: Icon, label, value, locked }: { icon: typeof Mail; label: string; value: string; locked?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-info-soft text-primary">
        <Icon className="size-3.5" />
      </span>
      <div className="min-w-0">
        <dt className="flex items-center gap-1 text-[0.7rem] text-muted-foreground">
          {label}
          {locked ? <Lock className="size-3" aria-label="Not editable" /> : null}
        </dt>
        <dd className="truncate text-sm font-medium">{value}</dd>
      </div>
    </div>
  )
}

/**
 * The signed-in user's own profile. Name, email and mobile can be edited; the role
 * is assigned by OLIVINE when the account is created, so it is shown but locked,
 * as are the enterprise and plant the account belongs to.
 */
export function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [editing, setEditing] = useState(false)

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
    values: { name: user?.name ?? "", email: user?.email ?? "", mobile: user?.mobile ?? "" },
  })

  if (!user) return null

  function onSubmit(values: ProfileValues) {
    updateUser(values)
    setEditing(false)
    toast.success("Profile updated")
  }

  function cancel() {
    form.reset()
    setEditing(false)
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="My Profile"
        description="Your account details in EMMS-E"
        breadcrumbs={[{ label: "My Profile" }]}
        actions={
          editing ? null : (
            <Button size="sm" onClick={() => setEditing(true)}>
              <Pencil /> Edit Profile
            </Button>
          )
        }
      />

      <div className="grid items-start gap-3 lg:grid-cols-[18rem_minmax(0,1fr)]">
        {/* Who you are, at a glance */}
        <section className="overflow-hidden rounded-xl bg-card shadow-sm ring-1 ring-foreground/10">
          <div className="h-20 bg-gradient-to-br from-brand-navy via-brand-navy to-primary" />
          <div className="-mt-10 flex flex-col items-center px-4 pb-4 text-center">
            <Avatar className="size-20 ring-4 ring-card">
              <AvatarFallback className="bg-primary text-2xl font-semibold text-primary-foreground">{user.initials}</AvatarFallback>
            </Avatar>
            <h3 className="mt-2 text-base font-bold text-brand-navy dark:text-foreground">{user.name}</h3>
            <Badge variant="highlight" className="mt-1 gap-1">
              <ShieldCheck className="size-3" /> {user.role}
            </Badge>
            <p className="mt-1.5 text-xs text-muted-foreground">{user.enterprise}</p>
            <dl className="mt-3 w-full space-y-2 border-t pt-3 text-left">
              <Detail icon={Mail} label="Email" value={user.email} />
              <Detail icon={Phone} label="Mobile" value={user.mobile} />
            </dl>
          </div>
        </section>

        <div className="space-y-3">
          <SectionCard title="Personal Details" icon={<UserRound className="size-4 text-primary" />} hoverable={false}>
            {editing ? (
              <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField control={form.control} name="name" label="Full Name" required autoComplete="name" />
                  <Field>
                    <FieldLabel htmlFor="role" className="gap-1">
                      Role <Lock className="size-3 text-muted-foreground" />
                    </FieldLabel>
                    <Input id="role" value={user.role} disabled readOnly />
                    <FieldDescription>Assigned by OLIVINE; it cannot be changed here.</FieldDescription>
                  </Field>
                  <TextField control={form.control} name="email" label="Email" type="email" required autoComplete="email" />
                  <TextField control={form.control} name="mobile" label="Mobile Number" type="tel" required autoComplete="tel" />
                </div>
                <div className="flex justify-end gap-2 border-t pt-3">
                  <Button type="button" variant="outline" size="sm" onClick={cancel}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm">
                    Save Changes
                  </Button>
                </div>
              </form>
            ) : (
              <dl className="grid gap-4 sm:grid-cols-2">
                <Detail icon={UserRound} label="Full Name" value={user.name} />
                <Detail icon={ShieldCheck} label="Role" value={user.role} locked />
                <Detail icon={Mail} label="Email" value={user.email} />
                <Detail icon={Phone} label="Mobile Number" value={user.mobile} />
              </dl>
            )}
          </SectionCard>

          <SectionCard title="Organisation" icon={<Building2 className="size-4 text-primary" />} hoverable={false}>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Detail icon={IdCard} label="User ID" value={user.id} locked />
              <Detail icon={Building2} label="Enterprise" value={user.enterprise} locked />
              <Detail icon={IdCard} label="Enterprise ID" value={user.enterpriseId} locked />
              <Detail icon={Factory} label="Plant" value={user.plant} locked />
            </dl>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
