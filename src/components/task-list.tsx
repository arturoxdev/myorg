"use client"

import { format, isBefore, isToday, isTomorrow, parseISO, startOfToday } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays, ChevronRight } from "lucide-react"
import { useOptimistic, useState, useTransition } from "react"
import { toast } from "sonner"

import { toggleTask } from "@/actions/tasks"
import { CategoryIcon } from "@/components/category-icon"
import type { TaskFormCategory } from "@/components/task-form"
import { TaskSheet } from "@/components/task-sheet"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Category, Task } from "@/db/schema"
import { getPriority } from "@/lib/priority"
import { playCompleteSound } from "@/lib/sounds"
import { cn } from "@/lib/utils"

type TaskWithCategory = Task & { category: Category | null }

function formatDue(value: string) {
  const date = parseISO(value)
  if (isToday(date)) return "Hoy"
  if (isTomorrow(date)) return "Mañana"
  return format(date, "d MMM yyyy", { locale: es })
}

type Props = {
  tasks: TaskWithCategory[]
  categories: TaskFormCategory[]
  /** En la vista "Completadas" no se separa en secciones. */
  grouped?: boolean
}

export function TaskList({ tasks, categories, grouped = true }: Props) {
  const [, startTransition] = useTransition()
  // Se guarda una copia para que el panel siga abierto aunque la tarea cambie de sección.
  const [selected, setSelected] = useState<Task | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [optimisticTasks, setOptimistic] = useOptimistic(
    tasks,
    (state, { id, completed }: { id: string; completed: boolean }) =>
      state.map((t) => (t.id === id ? { ...t, completed, updatedAt: new Date() } : t))
  )

  function onToggle(id: string, completed: boolean) {
    if (completed) playCompleteSound()
    startTransition(async () => {
      setOptimistic({ id, completed })
      try {
        await toggleTask(id, completed)
        toast.success(completed ? "Tarea completada" : "Tarea marcada como pendiente")
      } catch {
        toast.error("No se pudo actualizar la tarea")
      }
    })
  }

  function onOpen(task: Task) {
    setSelected(task)
    setSheetOpen(true)
  }

  const pending = optimisticTasks.filter((t) => !t.completed)
  // Las completadas más recientes primero.
  const completed = optimisticTasks
    .filter((t) => t.completed)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  const rows = (list: TaskWithCategory[]) =>
    list.map((task) => <TaskRow key={task.id} task={task} onToggle={onToggle} onOpen={onOpen} />)

  return (
    <>
      {grouped ? (
        <div className="flex flex-col gap-4">
          <TaskSection title="Pendientes" count={pending.length} defaultOpen>
            {pending.length > 0 ? (
              rows(pending)
            ) : (
              <li className="px-4 py-3 text-sm text-muted-foreground">No hay tareas pendientes.</li>
            )}
          </TaskSection>
          {completed.length > 0 && (
            <TaskSection title="Completadas" count={completed.length}>
              {rows(completed)}
            </TaskSection>
          )}
        </div>
      ) : (
        <ul className="divide-y rounded-xl border">{rows(completed)}</ul>
      )}
      <TaskSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        task={selected ?? undefined}
        categories={categories}
      />
    </>
  )
}

function TaskSection({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string
  count: number
  defaultOpen?: boolean
  children: React.ReactNode
}) {
  return (
    <Collapsible defaultOpen={defaultOpen} className="group/section flex flex-col gap-2">
      <CollapsibleTrigger className="flex w-fit cursor-pointer items-center gap-1.5 rounded-sm text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
        <ChevronRight className="size-4 text-muted-foreground transition-transform group-data-[state=open]/section:rotate-90" />
        {title}
        <span className="font-normal text-muted-foreground">{count}</span>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="divide-y rounded-xl border">{children}</ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

function TaskRow({
  task,
  onToggle,
  onOpen,
}: {
  task: TaskWithCategory
  onToggle: (id: string, completed: boolean) => void
  onOpen: (task: Task) => void
}) {
  const priority = getPriority(task.priority)
  const overdue = !task.completed && task.dueDate && isBefore(parseISO(task.dueDate), startOfToday())

  return (
    <li className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40">
      <Checkbox
        className="mt-0.5"
        checked={task.completed}
        onCheckedChange={(v) => onToggle(task.id, v === true)}
        aria-label={task.completed ? "Marcar como pendiente" : "Marcar como completada"}
      />
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span
          className={cn(
            "truncate text-sm font-medium",
            task.completed && "text-muted-foreground line-through"
          )}
        >
          {task.title}
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", priority.className)} />
            {priority.label}
          </span>
          {task.dueDate && (
            <span className={cn("flex items-center gap-1", overdue && "text-destructive")}>
              <CalendarDays className="size-3" />
              {formatDue(task.dueDate)}
            </span>
          )}
          {task.category && (
            <span className="flex items-center gap-1">
              <CategoryIcon category={task.category} className="size-3.5 text-xs" />
              {task.category.name}
            </span>
          )}
        </span>
      </button>
    </li>
  )
}
