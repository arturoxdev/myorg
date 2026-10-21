"use client"

import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays, Trash2, X } from "lucide-react"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { deleteTask, saveTask, toggleTask, type TaskInput } from "@/actions/tasks"
import { CategoryIcon } from "@/components/category-icon"
import { RichTextEditor } from "@/components/rich-text-editor"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Spinner } from "@/components/ui/spinner"
import { Switch } from "@/components/ui/switch"
import type { Category, Task } from "@/db/schema"
import { PRIORITIES } from "@/lib/priority"
import { playCompleteSound } from "@/lib/sounds"
import { cn } from "@/lib/utils"

const NO_CATEGORY = "none"

export type TaskFormCategory = Pick<Category, "id" | "name" | "emoji" | "iconKey">

type Props = {
  task?: Task
  categories: TaskFormCategory[]
  defaultCategoryId?: string
  defaultDueDate?: string
  /** Se llama al guardar o eliminar la tarea; el panel se cierra. */
  onDone: () => void
  onCancel: () => void
  onImageUploaded?: (key: string) => void
}

export function TaskForm({
  task,
  categories,
  defaultCategoryId,
  defaultDueDate,
  onDone,
  onCancel,
  onImageUploaded,
}: Props) {
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [values, setValues] = useState<TaskInput>({
    title: task?.title ?? "",
    description: task?.description ?? "",
    dueDate: task?.dueDate ?? defaultDueDate ?? null,
    categoryId: task?.categoryId ?? defaultCategoryId ?? null,
    priority: task?.priority ?? "medium",
  })
  const [completed, setCompleted] = useState(task?.completed ?? false)

  function set<K extends keyof TaskInput>(key: K, value: TaskInput[K]) {
    setValues((v) => ({ ...v, [key]: value }))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await saveTask(task?.id ?? null, values)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(task ? "Tarea actualizada" : "Tarea creada")
      onDone()
    })
  }

  // ⌘/Ctrl + Enter envía el formulario desde cualquier campo.
  const formRef = useRef<HTMLFormElement>(null)
  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key !== "Enter" || !(e.metaKey || e.ctrlKey)) return
    e.preventDefault()
    if (!pending && !uploading) formRef.current?.requestSubmit()
  }

  function onDelete() {
    if (!task) return
    startTransition(async () => {
      const result = await deleteTask(task.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Tarea eliminada")
      onDone()
    })
  }

  function onToggleCompleted(value: boolean) {
    if (!task) return
    if (value) playCompleteSound()
    setCompleted(value)
    startTransition(async () => {
      await toggleTask(task.id, value)
    })
  }

  const dueDate = values.dueDate ? parseISO(values.dueDate) : undefined

  const titleField = (
    <Field>
      <FieldLabel htmlFor="title" className="sr-only">
        Título
      </FieldLabel>
      <Input
        id="title"
        value={values.title}
        onChange={(e) => set("title", e.target.value)}
        placeholder="Título de la tarea"
        className="h-11 border-none px-0 text-xl font-semibold shadow-none focus-visible:ring-0 md:text-xl dark:bg-transparent"
        required
        data-autofocus={!task || undefined}
      />
    </Field>
  )

  const descriptionField = (
    <Field>
      <FieldLabel>Descripción</FieldLabel>
      <RichTextEditor
        value={values.description}
        onChange={(html) => set("description", html)}
        onUploadingChange={setUploading}
        onImageUploaded={onImageUploaded}
      />
    </Field>
  )

  const dateField = (
    <Field>
      <FieldLabel>Fecha</FieldLabel>
      <div className="flex gap-1">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn("flex-1 justify-start font-normal", !dueDate && "text-muted-foreground")}
            >
              <CalendarDays />
              {dueDate ? format(dueDate, "d 'de' MMMM yyyy", { locale: es }) : "Sin fecha"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              locale={es}
              selected={dueDate}
              defaultMonth={dueDate}
              onSelect={(date) => {
                set("dueDate", date ? format(date, "yyyy-MM-dd") : null)
                setCalendarOpen(false)
              }}
            />
          </PopoverContent>
        </Popover>
        {dueDate && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => set("dueDate", null)}
            aria-label="Quitar fecha"
          >
            <X />
          </Button>
        )}
      </div>
    </Field>
  )

  const categoryField = (
    <Field>
      <FieldLabel>Categoría</FieldLabel>
      <Select
        value={values.categoryId ?? NO_CATEGORY}
        onValueChange={(v) => set("categoryId", v === NO_CATEGORY ? null : v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_CATEGORY}>Sin categoría</SelectItem>
          {categories.length > 0 && <SelectSeparator />}
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              <CategoryIcon category={category} />
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )

  const priorityField = (
    <Field>
      <FieldLabel>Prioridad</FieldLabel>
      <Select
        value={values.priority}
        onValueChange={(v) => set("priority", v as TaskInput["priority"])}
      >
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              <span className={cn("size-2 rounded-full", p.className)} />
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  )

  // El panel solo se monta en el cliente al abrirse, así que navigator está disponible.
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform)

  return (
    <form
      ref={formRef}
      onSubmit={onSubmit}
      onKeyDown={onKeyDown}
      className="flex min-h-0 flex-1 flex-col"
    >
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <FieldGroup>
          {titleField}
          <div className="grid gap-4 sm:grid-cols-3">
            {dateField}
            {categoryField}
            {priorityField}
          </div>
          {task && (
            <Field orientation="horizontal" className="w-fit">
              <Switch id="completed" checked={completed} onCheckedChange={onToggleCompleted} />
              <FieldLabel htmlFor="completed">Completada</FieldLabel>
            </Field>
          )}
          {descriptionField}
        </FieldGroup>
      </div>
      <div className="flex items-center gap-2 border-t p-4">
        {task && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" className="text-destructive" disabled={pending}>
                <Trash2 />
                Eliminar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Eliminar esta tarea?</AlertDialogTitle>
                <AlertDialogDescription>
                  Se eliminará “{task.title}” junto con sus imágenes. Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction variant="destructive" onClick={onDelete}>
                  Eliminar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
        <Button type="button" variant="outline" className="ml-auto" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || uploading}>
          {pending && <Spinner />}
          {task ? "Guardar" : "Crear tarea"}
          <KbdGroup className="ml-1 hidden sm:inline-flex">
            <Kbd>{isMac ? "⌘" : "Ctrl"}</Kbd>
            <Kbd>↵</Kbd>
          </KbdGroup>
        </Button>
      </div>
    </form>
  )
}
