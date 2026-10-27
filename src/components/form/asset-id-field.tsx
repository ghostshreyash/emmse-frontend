import { useState } from "react"
import { Controller, type Control, type FieldPath, type FieldValues } from "react-hook-form"
import { ChevronsUpDown } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { AssetRecord } from "@/data/assets"

/**
 * Asset ID as a searchable dropdown, like Asset Details on Add Maintenance Task:
 * type to filter the register by tag ID, name or category, then pick one. The
 * field holds the tag ID; `onPick` hands back the whole record so the form can
 * fill the fields that follow from it.
 */
export function AssetIdField<T extends FieldValues>({
  control,
  name,
  label,
  required,
  className,
  options,
  placeholder = "Search by asset ID or name",
  empty = "No asset matches.",
  onPick,
}: {
  control: Control<T>
  name: FieldPath<T>
  label: string
  required?: boolean
  className?: string
  options: AssetRecord[]
  placeholder?: string
  /** Shown when the search finds nothing, or the list is empty */
  empty?: string
  onPick: (asset: AssetRecord) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const picked = options.find((o) => o.tagId === field.value)
        return (
          <Field data-invalid={fieldState.invalid} className={className}>
            <FieldLabel htmlFor={name} className="gap-1">
              {label}
              {required ? <span className="text-critical">*</span> : null}
            </FieldLabel>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  id={name}
                  type="button"
                  variant="outline"
                  role="combobox"
                  aria-expanded={open}
                  aria-invalid={fieldState.invalid}
                  onBlur={field.onBlur}
                  className="w-full justify-between bg-card px-3 font-normal"
                >
                  {picked ? (
                    <span className="flex min-w-0 items-center gap-1.5">
                      <span className="font-semibold tabular-nums">{picked.tagId}</span>
                      <span className="truncate text-muted-foreground">· {picked.name}</span>
                    </span>
                  ) : (
                    <span className="truncate text-muted-foreground">{placeholder}</span>
                  )}
                  <ChevronsUpDown className="size-3.5 text-muted-foreground" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-(--radix-popover-trigger-width) min-w-80 p-0">
                <Command>
                  <CommandInput placeholder="Type an asset ID, name or category" className="text-xs" />
                  <CommandList>
                    <CommandEmpty className="py-4 text-center text-xs text-muted-foreground">{empty}</CommandEmpty>
                    <CommandGroup>
                      {options.map((o) => (
                        <CommandItem
                          key={o.tagId}
                          value={`${o.tagId} ${o.name} ${o.category}`}
                          data-checked={o.tagId === field.value}
                          onSelect={() => {
                            field.onChange(o.tagId)
                            onPick(o)
                            setOpen(false)
                          }}
                          className="items-start text-xs"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block font-semibold tabular-nums">{o.tagId}</span>
                            <span className="block truncate text-[0.7rem] text-muted-foreground">
                              {o.name} · {o.category}
                            </span>
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )
      }}
    />
  )
}
