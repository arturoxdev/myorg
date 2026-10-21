import type { Priority } from "@/db/schema"

export const PRIORITIES: { value: Priority; label: string; className: string }[] = [
  { value: "low", label: "Baja", className: "bg-muted-foreground/40" },
  { value: "medium", label: "Media", className: "bg-sky-500" },
  { value: "high", label: "Alta", className: "bg-amber-500" },
  { value: "urgent", label: "Urgente", className: "bg-red-500" },
]

export function getPriority(value: Priority) {
  return PRIORITIES.find((p) => p.value === value) ?? PRIORITIES[1]
}
