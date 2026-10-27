import { CalendarClock, CalendarDays, CheckCircle2, Inbox, ListTodo, Plus } from "lucide-react"

import { NewTaskSheet } from "@/components/task-sheet"
import { PageHeader } from "@/components/page-header"
import { TaskList } from "@/components/task-list"
import { TaskStats } from "@/components/task-stats"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getCategories, getTasks, type TaskFilters, type TaskView } from "@/db/queries"

const viewIcons: Record<TaskView, React.ReactNode> = {
  all: <Inbox />,
  today: <CalendarDays />,
  upcoming: <CalendarClock />,
  completed: <CheckCircle2 />,
}

type Props = TaskFilters & {
  title: string
  description?: string
  icon?: React.ReactNode
}

export async function TasksView({ title, description, icon, ...filters }: Props) {
  const [tasks, categories] = await Promise.all([getTasks(filters), getCategories()])
  const pending = tasks.filter((t) => !t.completed).length
  const isCompletedView = filters.view === "completed"
  const count = isCompletedView ? tasks.length : pending
  const noun = isCompletedView ? "completada" : "pendiente"

  return (
    <>
      <PageHeader crumbs={[{ label: "Tareas", href: "/" }, { label: title }]}>
        <NewTaskSheet categories={categories} defaultCategoryId={filters.categoryId}>
          <Button size="sm">
            <Plus />
            Nueva tarea
          </Button>
        </NewTaskSheet>
      </PageHeader>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-transparent bg-background text-muted-foreground shadow-xs ring-1 ring-foreground/10 dark:bg-input/30 [&_svg]:size-4.5">
            {icon ?? viewIcons[filters.view ?? "all"]}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <h1 className="truncate text-lg leading-tight font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground tabular-nums">
              {filters.q
                ? `Resultados para “${filters.q}”`
                : (description ?? `${count} ${count === 1 ? noun : `${noun}s`}`)}
            </p>
          </div>
        </div>
        {!isCompletedView && !filters.q && tasks.length > 0 && <TaskStats tasks={tasks} />}
        {tasks.length > 0 ? (
          <TaskList tasks={tasks} categories={categories} grouped={!isCompletedView} />
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ListTodo />
              </EmptyMedia>
              <EmptyTitle>Sin tareas</EmptyTitle>
              <EmptyDescription>
                {filters.q ? "Ninguna tarea coincide con tu búsqueda." : "No hay nada por aquí todavía."}
              </EmptyDescription>
            </EmptyHeader>
            {!filters.q && filters.view !== "completed" && (
              <EmptyContent>
                <NewTaskSheet categories={categories} defaultCategoryId={filters.categoryId}>
                  <Button size="sm" variant="outline">
                    <Plus />
                    Crear tarea
                  </Button>
                </NewTaskSheet>
              </EmptyContent>
            )}
          </Empty>
        )}
      </div>
    </>
  )
}
