import { useState } from "react"
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form"
import { Calendar as CalendarIcon, Check, ChevronDown, Eye, EyeOff, UploadCloud, X} from "lucide-react"
import { format, isValid, parseISO } from "date-fns"
import { cn } from "cn"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { dialCodes } from "@/data/master-data"

type BaseProps<T extends FieldValues> = {
  control: Control<T>
  name: FieldPath<T>
  label: string
  required?: boolean
  description?: string
  className?: string
  startIcon?: React.ReactNode
  inputClassName?: string
  clearable?: boolean
}

function FieldTitle({ label, required, htmlFor }: { label: string; required?: boolean; htmlFor: string }) {
  return (
    <FieldLabel htmlFor={htmlFor} className="gap-1">
      {label}
      {required ? <span className="text-critical">*</span> : null}
    </FieldLabel>
  )
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  description,
  className,
  startIcon,
  inputClassName,
  clearable,
  onValueChange,
  ...inputProps
}: BaseProps<T> &
  Omit<React.ComponentProps<typeof Input>, "name"> & {
    /** Runs after the value changes - used to fill dependent fields */
    onValueChange?: (value: string) => void
  }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldTitle label={label} required={required} htmlFor={name} />
          <div className="relative">
            {startIcon ? <span className="pointer-events-none absolute top-1/2 left-2.5 z-10 -translate-y-1/2 text-muted-foreground [&>svg]:size-4">{startIcon}</span> : null}
            <Input
              id={name}
              aria-invalid={fieldState.invalid}
              className={cn(startIcon && "pl-9", clearable && "pr-9", inputClassName)}
              {...inputProps}
              {...field}
              value={field.value ?? ""}
              onChange={(e) => {
                field.onChange(e)
                onValueChange?.(e.target.value)
              }}
            />
            {clearable && field.value ? (
              <button
                type="button"
                aria-label={`Clear ${label}`}
                onClick={() => field.onChange("")}
                className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function PasswordField<T extends FieldValues>(props: BaseProps<T> & { placeholder?: string }) {
  const [visible, setVisible] = useState(false)
  const { control, name, label, required, description, className, placeholder, startIcon, inputClassName } = props
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldTitle label={label} required={required} htmlFor={name} />
          <div className="relative">
            {startIcon ? <span className="pointer-events-none absolute top-1/2 left-2.5 z-10 -translate-y-1/2 text-muted-foreground [&>svg]:size-4">{startIcon}</span> : null}
            <Input
              id={name}
              type={visible ? "text" : "password"}
              placeholder={placeholder}
              aria-invalid={fieldState.invalid}
              className={cn("pr-10", startIcon && "pl-9", inputClassName)}
              {...field}
              value={field.value ?? ""}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? "Hide password" : "Show password"}
            >
              {visible ? <EyeOff /> : <Eye />}
            </Button>
          </div>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  className,
  maxLength = 500,
  rows = 4,
  placeholder,
}: BaseProps<T> & { maxLength?: number; rows?: number; placeholder?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldTitle label={label} required={required} htmlFor={name} />
          <Textarea
            id={name}
            rows={rows}
            maxLength={maxLength}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
            {...field}
            value={field.value ?? ""}
          />
          <div className="text-right text-xs text-muted-foreground">
            {(field.value ?? "").length}/{maxLength}
          </div>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  className,
  description,
  options,
  placeholder = "Select",
  disabled,
  onValueChange,
}: BaseProps<T> & {
  /** Plain values, or value/label pairs when what is stored differs from what is shown */
  options: readonly (string | { value: string; label: string })[]
  placeholder?: string
  disabled?: boolean
  /** Runs after the value changes - used to clear a dependent field */
  onValueChange?: (value: string) => void
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldTitle label={label} required={required} htmlFor={name} />
          <Select
            value={field.value ?? ""}
            disabled={disabled}
            onValueChange={(v) => {
              field.onChange(v)
              onValueChange?.(v)
            }}
          >
            <SelectTrigger id={name} aria-invalid={fieldState.invalid} className="w-full" onBlur={field.onBlur}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((o) => {
                const { value, label } = typeof o === "string" ? { value: o, label: o } : o
                return (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                )
              })}
            </SelectContent>
          </Select>
          {description ? <FieldDescription>{description}</FieldDescription> : null}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

/**
 * A dropdown that takes several options at once. The field holds an array; picked
 * options show as a comma list on the trigger, and each one can be ticked off again.
 */
export function MultiSelectField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  className,
  description,
  options,
  placeholder = "Select",
}: BaseProps<T> & { options: readonly string[]; placeholder?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const picked: string[] = field.value ?? []
        const toggle = (o: string) => field.onChange(picked.includes(o) ? picked.filter((p) => p !== o) : [...picked, o])
        return (
          <Field data-invalid={fieldState.invalid} className={className}>
            <FieldTitle label={label} required={required} htmlFor={name} />
            <Popover onOpenChange={(open) => !open && field.onBlur()}>
              {/* A div rather than a button, so each chip can carry its own remove button */}
              <PopoverTrigger asChild>
                <div
                  id={name}
                  role="combobox"
                  tabIndex={0}
                  aria-invalid={fieldState.invalid}
                  aria-label={label}
                  className="flex min-h-9 w-full cursor-pointer items-center justify-between gap-1.5 rounded-md border border-input bg-transparent px-2 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
                >
                  {picked.length ? (
                    <span className="flex min-w-0 flex-wrap gap-1">
                      {picked.map((o) => (
                        <span
                          key={o}
                          className="inline-flex items-center gap-1 rounded-md bg-primary/10 py-0.5 pr-0.5 pl-2 text-xs font-medium text-primary ring-1 ring-primary/20"
                        >
                          {o}
                          <button
                            type="button"
                            aria-label={`Remove ${o}`}
                            // Remove without opening the list underneath
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                              e.stopPropagation()
                              toggle(o)
                            }}
                            className="rounded p-0.5 hover:bg-primary/15"
                          >
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="truncate px-0.5 text-muted-foreground">{placeholder}</span>
                  )}
                  <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                </div>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-56 p-1">
                <ul role="listbox" aria-multiselectable="true" aria-label={label}>
                  {options.map((o) => {
                    const on = picked.includes(o)
                    return (
                      <li key={o}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={on}
                          onClick={() => toggle(o)}
                          className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                        >
                          <span
                            className={cn(
                              "flex size-4 shrink-0 items-center justify-center rounded border",
                              on ? "border-primary bg-primary text-primary-foreground" : "border-input"
                            )}
                          >
                            {on ? <Check className="size-3" /> : null}
                          </span>
                          {o}
                        </button>
                      </li>
                    )
                  })}
                </ul>
              </PopoverContent>
            </Popover>
            {description ? <FieldDescription>{description}</FieldDescription> : null}
            <FieldError errors={[fieldState.error]} />
          </Field>
        )
      }}
    />
  )
}

/**
 * Phone number with a dialling-code select in front. The code and the number are
 * separate form fields, so the number stays clean for validation and storage.
 */
export function PhoneField<T extends FieldValues>({
  control,
  codeName,
  name,
  label,
  required,
  className,
  placeholder = "98765 43210",
}: BaseProps<T> & { codeName: FieldPath<T>; placeholder?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} className={className}>
          <FieldTitle label={label} required={required} htmlFor={name} />
          <div className="flex gap-1.5">
            <Controller
              control={control}
              name={codeName}
              render={({ field: codeField }) => (
                <Select value={codeField.value ?? ""} onValueChange={codeField.onChange}>
                  <SelectTrigger aria-label="Country dialling code" className="w-20 shrink-0">
                    <SelectValue placeholder="+91" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom" align="start" avoidCollisions={false}>
                    {dialCodes.map((d) => (
                      <SelectItem key={d.code} value={d.code}>
                        <span className="tabular-nums">{d.code}</span>
                        <span className="text-muted-foreground">{d.country}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Input
              {...field}
              id={name}
              type="tel"
              inputMode="tel"
              value={field.value ?? ""}
              placeholder={placeholder}
              aria-invalid={fieldState.invalid}
            />
          </div>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

/**
 * Calendar-backed date picker. Stores an ISO date string (yyyy-MM-dd) in form
 * state so it serialises cleanly, while showing a readable date to the user.
 */
export function DateField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  className,
  placeholder = "Select date",
  fromYear = new Date().getFullYear() - 60,
  toYear = new Date().getFullYear(),
}: BaseProps<T> & { placeholder?: string; fromYear?: number; toYear?: number }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected = field.value ? parseISO(String(field.value)) : undefined
        const valid = selected && isValid(selected)
        return (
          <Field data-invalid={fieldState.invalid} className={className}>
            <FieldTitle label={label} required={required} htmlFor={name} />
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id={name}
                  type="button"
                  variant="outline"
                  aria-invalid={fieldState.invalid}
                  onBlur={field.onBlur}
                  className={cn("w-full justify-between font-normal", !valid && "text-muted-foreground")}
                >
                  {valid ? format(selected, "dd MMM yyyy") : placeholder}
                  <CalendarIcon className="size-4 opacity-60" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-auto p-0">
                <Calendar
                  mode="single"
                  captionLayout="dropdown"
                  startMonth={new Date(fromYear, 0)}
                  endMonth={new Date(toYear, 11)}
                  selected={valid ? selected : undefined}
                  defaultMonth={valid ? selected : new Date(toYear, 0)}
                  onSelect={(d) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                />
              </PopoverContent>
            </Popover>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )
      }}
    />
  )
}

/** Drag-and-drop style file picker (PNG/JPG logos, photos). Keeps the chosen File in form state. */
export function FileDropField<T extends FieldValues>({
  control,
  name,
  label,
  className,
  hint = "PNG, JPG (Max 2 MB)",
  accept = "image/png,image/jpeg",
}: BaseProps<T> & { hint?: string; accept?: string }) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => {
        const file = field.value as File | undefined
        return (
          <Field className={className}>
            <FieldTitle label={label} htmlFor={name} />
            <label
              htmlFor={name}
              className={cn(
                "flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-input bg-muted/40 px-4 py-3 text-center text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-accent"
              )}
            >
              <UploadCloud className="size-8 text-primary" />
              {file ? (
                <span className="font-medium text-foreground">{file.name}</span>
              ) : (
                <>
                  <span>Drag &amp; drop file here</span>
                  <span className="text-xs">or</span>
                  <span className="rounded-md border bg-card px-3 py-1 font-medium text-foreground">Choose File</span>
                </>
              )}
              <input
                id={name}
                type="file"
                accept={accept}
                className="sr-only"
                onChange={(e) => field.onChange(e.target.files?.[0])}
              />
            </label>
            <FieldDescription className="text-xs">{hint}</FieldDescription>
          </Field>
        )
      }}
    />
  )
}
