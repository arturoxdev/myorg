import { format, isBefore, isToday, isTomorrow, parseISO, startOfToday } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import type { Priority } from "@/db/schema"
import { getPriority } from "@/lib/priority"
import { cn } from "@/lib/utils"

/** Badge compacto y rectangular para los metadatos de una tarea. */
const metaBadge = "h-5 gap-1 rounded-sm px-1.5 font-normal tabular-nums"

export function formatDue(value: string) {
  const date = parseISO(value)
  if (isToday(date)) return "Hoy"
  if (isTomorrow(date)) return "Mañana"
  return format(date, "d MMM", { locale: es })
}

export function isOverdue(dueDate: string | null, completed: boolean) {
  return !completed && !!dueDate && isBefore(parseISO(dueDate), startOfToday())
}

export function PriorityDot({ priority, className }: { priority: Priority; className?: string }) {
  return <span className={cn("size-1.5 shrink-0 rounded-full", getPriority(priority).className, className)} />
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant="outline" className={cn(metaBadge, "bg-background text-muted-foreground dark:bg-input/30")}>
      <PriorityDot priority={priority} />
      {getPriority(priority).label}
    </Badge>
  )
}

export function DueBadge({ dueDate, overdue }: { dueDate: string; overdue: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        metaBadge,
        overdue
          ? "border-destructive/15 bg-destructive/10 text-destructive dark:border-destructive/25 dark:bg-destructive/15"
          : "bg-background text-muted-foreground dark:bg-input/30"
      )}
    >
      <CalendarDays />
      {formatDue(dueDate)}
    </Badge>
  )
}
