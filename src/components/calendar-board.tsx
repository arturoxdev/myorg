"use client"

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronRight, CirclePlus, Plus } from "lucide-react"
import { useOptimistic, useState, useTransition } from "react"
import { toast } from "sonner"

import { scheduleTask, toggleTask } from "@/actions/tasks"
import { CategoryIcon } from "@/components/category-icon"
import type { TaskFormCategory } from "@/components/task-form"
import { TaskSheet } from "@/components/task-sheet"
import { TaskTitle } from "@/components/task-title"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import type { Category, Task } from "@/db/schema"
import { useCompleteAnimation } from "@/hooks/use-complete-animation"
import { getPriority } from "@/lib/priority"
import { cn } from "@/lib/utils"

type CalendarTask = Task & { category: Category | null }

type Change =
  | { id: string; dueDate: string | null }
  | { id: string; completed: boolean }

/** Id del panel lateral como zona para soltar: quita la fecha. */
const UNSCHEDULED = "unscheduled"

type SheetState = { open: boolean; task?: Task; categoryId?: string; dueDate?: string }

type Props = {
  tasks: CalendarTask[]
  categories: TaskFormCategory[]
  /** Días visibles (yyyy-MM-dd), uno por columna. */
  days: string[]
  today: string
}

export function CalendarBoard({ tasks, categories, days, today }: Props) {
  const [, startTransition] = useTransition()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [sheet, setSheet] = useState<SheetState>({ open: false })
  const [optimisticTasks, applyChange] = useOptimistic(tasks, (state, change: Change) =>
    state.map((t) => (t.id === change.id ? { ...t, ...change } : t))
  )
  // La distancia mínima permite hacer clic en la tarea sin empezar a arrastrarla.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const visibleDays = new Set(days)
  const byDay = new Map<string, CalendarTask[]>(days.map((d) => [d, []]))
  const unscheduled: CalendarTask[] = []
  const overdue: CalendarTask[] = []
  for (const task of optimisticTasks) {
    if (task.dueDate && visibleDays.has(task.dueDate)) byDay.get(task.dueDate)!.push(task)
    else if (task.completed) continue
    else if (!task.dueDate) unscheduled.push(task)
    else if (task.dueDate < today) overdue.push(task)
  }

  function update(change: Change, action: () => Promise<void>, onStart?: () => void) {
    startTransition(async () => {
      applyChange(change)
      onStart?.()
      try {
        await action()
      } catch {
        toast.error("No se pudo actualizar la tarea")
      }
    })
  }

  // Al completar, la tarea se tacha antes de bajar al final de su día (o salir del panel).
  const { completing, toggle } = useCompleteAnimation((id, completed, settle) =>
    update({ id, completed }, () => toggleTask(id, completed), settle)
  )

  function onDragEnd({ active, over }: DragEndEvent) {
    setActiveId(null)
    if (!over || over.id === active.data.current?.from) return
    const id = String(active.id)
    const dueDate = over.id === UNSCHEDULED ? null : String(over.id)
    update({ id, dueDate }, () => scheduleTask(id, dueDate))
  }

  function openSheet(state: Omit<SheetState, "open">) {
    setSheet({ open: true, ...state })
  }

  const activeTask = activeId ? optimisticTasks.find((t) => t.id === activeId) : undefined
  const cardProps = { completing, onToggle: toggle, onOpen: (task: Task) => openSheet({ task }) }

  return (
    <DndContext
      id="calendar"
      sensors={sensors}
      onDragStart={({ active }) => setActiveId(String(active.id))}
      onDragEnd={onDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <UnscheduledPanel>
          {overdue.length > 0 && (
            <PanelGroup title="Vencidas" count={overdue.length} className="text-destructive">
              {overdue.map((task) => (
                <DraggableTask key={task.id} task={task} from={UNSCHEDULED} showDate {...cardProps} />
              ))}
            </PanelGroup>
          )}
          {categories.map((category) => {
            const list = unscheduled.filter((t) => t.categoryId === category.id)
            return (
              <PanelGroup
                key={category.id}
                title={category.name}
                icon={<CategoryIcon category={category} />}
                count={list.length}
                onAdd={() => openSheet({ categoryId: category.id })}
              >
                {list.map((task) => (
                  <DraggableTask key={task.id} task={task} from={UNSCHEDULED} {...cardProps} />
                ))}
              </PanelGroup>
            )
          })}
          <PanelGroup
            title="Sin categoría"
            count={unscheduled.filter((t) => !t.categoryId).length}
            onAdd={() => openSheet({})}
          >
            {unscheduled
              .filter((t) => !t.categoryId)
              .map((task) => (
                <DraggableTask key={task.id} task={task} from={UNSCHEDULED} {...cardProps} />
              ))}
          </PanelGroup>
        </UnscheduledPanel>

        <div className="flex min-h-0 flex-1 gap-3 overflow-x-auto p-3">
          {days.map((day) => (
            <DayColumn
              key={day}
              day={day}
              isToday={day === today}
              onAdd={() => openSheet({ dueDate: day })}
            >
              {/* Pendientes primero; dentro de cada grupo se respeta el orden por prioridad. */}
              {byDay
                .get(day)!
                .toSorted((a, b) => Number(a.completed) - Number(b.completed))
                .map((task) => (
                  <DraggableTask key={task.id} task={task} from={day} showCategory {...cardProps} />
                ))}
            </DayColumn>
          ))}
        </div>
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && <TaskCard task={activeTask} showCategory className="cursor-grabbing shadow-lg" />}
      </DragOverlay>

      <TaskSheet
        open={sheet.open}
        onOpenChange={(open) => setSheet((s) => ({ ...s, open }))}
        task={sheet.task}
        categories={categories}
        defaultCategoryId={sheet.categoryId}
        defaultDueDate={sheet.dueDate}
      />
    </DndContext>
  )
}

function UnscheduledPanel({ children }: { children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: UNSCHEDULED })
  return (
    <aside
      ref={setNodeRef}
      className={cn(
        "flex max-h-72 shrink-0 flex-col gap-4 overflow-y-auto border-b p-3 transition-colors md:max-h-none md:w-72 md:border-r md:border-b-0",
        isOver && "bg-muted/60"
      )}
    >
      <div className="px-1">
        <h2 className="text-sm font-medium">Sin fecha</h2>
        <p className="text-xs text-muted-foreground">Arrastra una tarea a un día para programarla.</p>
      </div>
      {children}
    </aside>
  )
}

function PanelGroup({
  title,
  icon,
  count,
  onAdd,
  className,
  children,
}: {
  title: string
  icon?: React.ReactNode
  count: number
  onAdd?: () => void
  className?: string
  children: React.ReactNode
}) {
  return (
    <Collapsible defaultOpen className="group/panel flex flex-col gap-1.5">
      <CollapsibleTrigger
        className={cn(
          "flex cursor-pointer items-center gap-1.5 rounded-sm px-1 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
          className
        )}
      >
        <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-data-[state=open]/panel:rotate-90" />
        {icon}
        <span className="truncate">{title}</span>
        {count > 0 && <span className="font-normal text-muted-foreground">{count}</span>}
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-1.5">
        {children}
        {onAdd && (
          <Button
            variant="ghost"
            size="sm"
            className="justify-start text-muted-foreground"
            onClick={onAdd}
          >
            <Plus />
            Nueva tarea
          </Button>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function DayColumn({
  day,
  isToday,
  onAdd,
  children,
}: {
  day: string
  isToday: boolean
  onAdd: () => void
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({ id: day })
  const date = parseISO(day)
  return (
    <section
      ref={setNodeRef}
      className={cn(
        "flex w-72 shrink-0 flex-col gap-2 rounded-xl p-2 transition-colors",
        isOver && "bg-muted/60"
      )}
    >
      <header className="flex items-baseline gap-1.5 px-1 py-1">
        <h2 className="text-base font-semibold capitalize">{format(date, "EEEE", { locale: es })}</h2>
        <span className="text-base text-muted-foreground">{format(date, "d MMM", { locale: es })}</span>
        {isToday && (
          <Badge className="ml-auto self-center" variant="secondary">
            Hoy
          </Badge>
        )}
      </header>
      <Button variant="secondary" className="justify-start font-normal text-muted-foreground" onClick={onAdd}>
        <CirclePlus />
        Agregar tarea
      </Button>
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">{children}</div>
    </section>
  )
}

type CardProps = {
  task: CalendarTask
  showCategory?: boolean
  showDate?: boolean
  /** Tareas con la animación de completar en curso. */
  completing?: ReadonlySet<string>
  onToggle?: (id: string, completed: boolean) => void
  onOpen?: (task: Task) => void
  className?: string
}

function DraggableTask({ from, ...props }: CardProps & { from: string }) {
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: props.task.id,
    data: { from },
  })
  return (
    <div ref={setNodeRef} {...listeners} className={cn("touch-none", isDragging && "opacity-40")}>
      <TaskCard {...props} />
    </div>
  )
}

function TaskCard({
  task,
  showCategory,
  showDate,
  completing,
  onToggle,
  onOpen,
  className,
}: CardProps) {
  const completed = task.completed || !!completing?.has(task.id)
  const priority = getPriority(task.priority)
  return (
    <div
      className={cn(
        "flex cursor-grab items-start gap-2.5 rounded-lg border bg-card p-2.5 text-card-foreground shadow-xs",
        className
      )}
    >
      <Checkbox
        className="mt-0.5"
        checked={completed}
        onCheckedChange={(v) => onToggle?.(task.id, v === true)}
        aria-label={completed ? "Marcar como pendiente" : "Marcar como completada"}
      />
      <button
        type="button"
        onClick={() => onOpen?.(task)}
        className="flex min-w-0 flex-1 cursor-pointer flex-col gap-1 rounded-sm text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="line-clamp-3 text-sm">
          <TaskTitle completed={completed}>{task.title}</TaskTitle>
        </span>
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className={cn("size-2 rounded-full", priority.className)} />
            {priority.label}
          </span>
          {showDate && task.dueDate && (
            <span className="text-destructive">
              {format(parseISO(task.dueDate), "d MMM", { locale: es })}
            </span>
          )}
          {showCategory && task.category && (
            <span className="flex min-w-0 items-center gap-1">
              <CategoryIcon category={task.category} className="size-3.5 text-xs" />
              <span className="truncate">{task.category.name}</span>
            </span>
          )}
        </span>
      </button>
    </div>
  )
}
