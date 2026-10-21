"use client"

import { useRef, useState } from "react"

import { discardUploads } from "@/actions/tasks"
import { TaskForm, type TaskFormCategory } from "@/components/task-form"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { Task } from "@/db/schema"

type TaskSheetProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Tarea a ver/editar; sin ella el panel crea una nueva. */
  task?: Task
  categories: TaskFormCategory[]
  defaultCategoryId?: string
  /** Fecha preseleccionada al crear (yyyy-MM-dd). */
  defaultDueDate?: string
  trigger?: React.ReactNode
}

export function TaskSheet({
  open,
  onOpenChange,
  task,
  categories,
  defaultCategoryId,
  defaultDueDate,
  trigger,
}: TaskSheetProps) {
  // Imágenes subidas desde que se abrió el panel; se borran si se cierra sin guardar.
  const uploads = useRef<string[]>([])
  const contentRef = useRef<HTMLDivElement>(null)

  function handleOpenChange(next: boolean) {
    if (!next && uploads.current.length) {
      void discardUploads(uploads.current)
    }
    uploads.current = []
    onOpenChange(next)
  }

  function onDone() {
    uploads.current = []
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent
        ref={contentRef}
        className="w-full outline-none data-[side=right]:sm:max-w-xl"
        onOpenAutoFocus={(e) => {
          // Al crear, el cursor va directo al título para empezar a escribir.
          // Al ver una tarea existente no se enfoca ni selecciona ningún campo:
          // el foco queda en el panel (Esc y Tab siguen funcionando).
          e.preventDefault()
          const input = contentRef.current?.querySelector<HTMLElement>("[data-autofocus]")
          ;(input ?? contentRef.current)?.focus()
        }}
      >
        <SheetHeader>
          <SheetTitle>{task ? "Tarea" : "Nueva tarea"}</SheetTitle>
          <SheetDescription>
            {task ? "Revisa o edita los detalles de la tarea." : "Completa los detalles; solo el título es obligatorio."}
          </SheetDescription>
        </SheetHeader>
        {/* El contenido se desmonta al cerrar, así el formulario se reinicia en cada apertura. */}
        <TaskForm
          key={task?.id ?? "new"}
          task={task}
          categories={categories}
          defaultCategoryId={defaultCategoryId}
          defaultDueDate={defaultDueDate}
          onDone={onDone}
          onCancel={() => handleOpenChange(false)}
          onImageUploaded={(key) => uploads.current.push(key)}
        />
      </SheetContent>
    </Sheet>
  )
}

type NewTaskSheetProps = {
  categories: TaskFormCategory[]
  defaultCategoryId?: string
  /** Elemento que abre el panel (se renderiza con asChild). */
  children: React.ReactNode
}

export function NewTaskSheet({ categories, defaultCategoryId, children }: NewTaskSheetProps) {
  const [open, setOpen] = useState(false)
  return (
    <TaskSheet
      open={open}
      onOpenChange={setOpen}
      categories={categories}
      defaultCategoryId={defaultCategoryId}
      trigger={children}
    />
  )
}
