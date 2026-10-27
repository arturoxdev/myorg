"use client"

import { ChevronRight } from "lucide-react"
import { useOptimistic, useState, useTransition } from "react"
import { toast } from "sonner"

import { toggleTask } from "@/actions/tasks"
import { CategoryIcon } from "@/components/category-icon"
import { DueBadge, isOverdue, PriorityBadge } from "@/components/task-badges"
import type { TaskFormCategory } from "@/components/task-form"
import { TaskSheet } from "@/components/task-sheet"
import { TaskTitle } from "@/components/task-title"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Category, Task } from "@/db/schema"
import { Badge } from "@/components/ui/badge"
import { useCompleteAnimation } from "@/hooks/use-complete-animation"

type TaskWithCategory = Task & { category: Category | null }

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

  // Al completar, la tarea se tacha y luego pasa a "Completadas".
  const { completing, toggle } = useCompleteAnimation((id, completed, settle) => {
    startTransition(async () => {
      setOptimistic({ id, completed })
      settle()
      try {
        await toggleTask(id, completed)
        toast.success(completed ? "Tarea completada" : "Tarea marcada como pendiente")
      } catch {
        toast.error("No se pudo actualizar la tarea")
      }
    })
  })

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
    list.map((task) => (
      <TaskRow
        key={task.id}
        task={task}
        completed={task.completed || completing.has(task.id)}
        onToggle={toggle}
        onOpen={onOpen}
      />
    ))

  return (
    <>
      {grouped ? (
        <div className="flex flex-col gap-3">
          <TaskSection title="Pendientes" count={pending.length} defaultOpen>
            {pending.length > 0 ? (
              rows(pending)
            ) : (
              <li className="px-4 py-6 text-center text-sm text-muted-foreground">
                No hay tareas pendientes. Buen trabajo.
              </li>
            )}
          </TaskSection>
          {completed.length > 0 && (
            <TaskSection title="Completadas" count={completed.length}>
              {rows(completed)}
            </TaskSection>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-transparent bg-card ring-1 ring-foreground/10">
          <ul className="divide-y">{rows(completed)}</ul>
        </div>
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
    <Collapsible
      defaultOpen={defaultOpen}
      className="group/section overflow-hidden rounded-xl border border-transparent bg-card ring-1 ring-foreground/10"
    >
      <CollapsibleTrigger className="flex h-11 w-full cursor-pointer items-center gap-2 px-4 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:ring-inset">
        <ChevronRight className="size-4 text-muted-foreground group-data-[state=open]/section:rotate-90 motion-safe:transition-transform motion-safe:duration-200 motion-safe:ease-out" />
        {title}
        <Badge variant="secondary" className="h-5 min-w-5 rounded-sm px-1.5 tabular-nums">
          {count}
        </Badge>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="divide-y border-t">{children}</ul>
      </CollapsibleContent>
    </Collapsible>
  )
}

function TaskRow({
  task,
  completed,
  onToggle,
  onOpen,
}: {
  task: TaskWithCategory
  /** Incluye la animación en curso: se ve completada antes de guardarse. */
  completed: boolean
  onToggle: (id: string, completed: boolean) => void
  onOpen: (task: Task) => void
}) {
  return (
    <li className="flex items-start gap-3 px-4 transition-colors duration-150 hover:bg-muted/40 sm:items-center">
      <Checkbox
        className="mt-3 sm:mt-0"
        checked={completed}
        onCheckedChange={(v) => onToggle(task.id, v === true)}
        aria-label={completed ? "Marcar como pendiente" : "Marcar como completada"}
      />
      <button
        type="button"
        onClick={() => onOpen(task)}
        className="flex min-h-14 min-w-0 flex-1 cursor-pointer flex-col justify-center gap-1.5 rounded-sm py-2.5 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50 sm:flex-row sm:items-center sm:gap-3"
      >
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">
            <TaskTitle completed={completed}>{task.title}</TaskTitle>
          </span>
          {task.category && (
            <span className="icon-stroke-regular flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
              <CategoryIcon category={task.category} className="size-3.5 text-xs" />
              <span className="truncate">{task.category.name}</span>
            </span>
          )}
        </span>
        <span className="flex shrink-0 items-center gap-1.5">
          {task.dueDate && <DueBadge dueDate={task.dueDate} overdue={isOverdue(task.dueDate, completed)} />}
          <PriorityBadge priority={task.priority} />
        </span>
      </button>
    </li>
  )
}
