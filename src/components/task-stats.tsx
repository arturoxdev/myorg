import { format } from "date-fns"
import { AlertTriangle, CircleCheck, CircleDashed, Flame } from "lucide-react"

import { Progress } from "@/components/ui/progress"
import type { Task } from "@/db/schema"
import { cn } from "@/lib/utils"

/** Resumen de la vista actual: se calcula sobre las tareas que ya se cargaron. */
export function TaskStats({ tasks }: { tasks: Task[] }) {
  const today = format(new Date(), "yyyy-MM-dd")
  const pending = tasks.filter((t) => !t.completed)
  const overdue = pending.filter((t) => t.dueDate && t.dueDate < today).length
  const important = pending.filter((t) => t.priority === "high" || t.priority === "urgent").length
  const done = tasks.length - pending.length
  const progress = tasks.length ? Math.round((done / tasks.length) * 100) : 0

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      <Stat
        icon={<CircleDashed />}
        label="Pendientes"
        value={pending.length}
        hint={`de ${tasks.length} en total`}
      />
      <Stat
        icon={<AlertTriangle />}
        label="Vencidas"
        value={overdue}
        hint={overdue ? "Requieren atención" : "Todo al día"}
        tone={overdue ? "destructive" : undefined}
      />
      <Stat icon={<Flame />} label="Prioridad alta" value={important} hint="Alta o urgente" />
      <Stat icon={<CircleCheck />} label="Progreso" value={`${progress}%`}>
        <Progress value={progress} className="h-1" aria-label="Progreso" />
      </Stat>
    </div>
  )
}

function Stat({
  icon,
  label,
  value,
  hint,
  tone,
  children,
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  hint?: string
  tone?: "destructive"
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-transparent bg-card p-[13px] ring-1 ring-foreground/10">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span
          className={cn(
            "flex size-6 items-center justify-center rounded-md border bg-background dark:bg-input/30 [&_svg]:size-3.5",
            tone === "destructive" && "border-destructive/15 bg-destructive/10 text-destructive"
          )}
        >
          {icon}
        </span>
        {label}
      </div>
      <div className="flex items-end justify-between gap-2">
        <span
          className={cn(
            "text-2xl leading-none font-semibold tracking-tight tabular-nums",
            tone === "destructive" && "text-destructive"
          )}
        >
          {value}
        </span>
        {hint && <span className="truncate text-xs text-muted-foreground">{hint}</span>}
      </div>
      {children}
    </div>
  )
}
