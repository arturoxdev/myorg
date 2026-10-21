import { ListTodo, Plus } from "lucide-react"

import { NewTaskSheet } from "@/components/task-sheet"
import { PageHeader } from "@/components/page-header"
import { TaskList } from "@/components/task-list"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { getCategories, getTasks, type TaskFilters } from "@/db/queries"

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
      <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-4 md:p-8">
        <div className="flex items-center gap-3">
          {icon}
          <div>
            <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">
              {filters.q
                ? `Resultados para “${filters.q}”`
                : (description ?? `${count} ${count === 1 ? noun : `${noun}s`}`)}
            </p>
          </div>
        </div>
        {tasks.length > 0 ? (
          <TaskList tasks={tasks} categories={categories} grouped={!isCompletedView} />
        ) : (
          <Empty className="border">
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
