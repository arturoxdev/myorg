"use client"

import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { CalendarDays, CircleCheck, Flag, Tag, Trash2, X } from "lucide-react"
import { useLayoutEffect, useRef, useState, useTransition } from "react"
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
import { Textarea } from "@/components/ui/textarea"
import type { Category, Task } from "@/db/schema"
import { PRIORITIES } from "@/lib/priority"
import { playCompleteSound } from "@/lib/sounds"
import { cn } from "@/lib/utils"

const NO_CATEGORY = "none"

/** Trigger de propiedad sin borde: se ve como texto hasta pasar el mouse. */
const ghost =
  "w-full justify-start border-transparent bg-transparent font-normal shadow-none hover:bg-muted aria-expanded:bg-muted dark:bg-transparent dark:hover:bg-muted/50 [&>svg:last-child]:ms-auto [&>svg:last-child]:opacity-0 hover:[&>svg:last-child]:opacity-100 focus-visible:[&>svg:last-child]:opacity-100"

function PropertyRow({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[7.5rem_1fr] items-center gap-2">
      <dt className="flex items-center gap-2 text-sm text-muted-foreground [&_svg]:size-4">
        {icon}
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

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

  // El título crece hacia abajo para mostrarse siempre completo
  // (respaldo para navegadores sin soporte de field-sizing).
  const titleRef = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = titleRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = `${el.scrollHeight}px`
  }, [values.title])

  // El título es de una sola línea: Enter envía el formulario como en un input.
  function onTitleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Enter" || e.shiftKey || e.nativeEvent.isComposing) return
    e.preventDefault()
    if (!pending && !uploading) formRef.current?.requestSubmit()
  }

  const dueDate = values.dueDate ? parseISO(values.dueDate) : undefined

  const titleField = (
    <Field>
      <FieldLabel htmlFor="title" className="sr-only">
        Título
      </FieldLabel>
      <Textarea
        ref={titleRef}
        id="title"
        rows={1}
        value={values.title}
        onChange={(e) => set("title", e.target.value.replace(/\r?\n/g, " "))}
        onKeyDown={onTitleKeyDown}
        placeholder="Título de la tarea"
        className="min-h-11 resize-none overflow-hidden rounded-none border-none px-0 py-1.5 text-xl leading-tight font-semibold tracking-tight break-words shadow-none focus-visible:ring-0 md:text-xl dark:bg-transparent"
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
    <PropertyRow label="Fecha" icon={<CalendarDays />}>
      <div className="flex gap-1">
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn("flex-1 justify-start text-sm font-normal", !dueDate && "text-muted-foreground")}
            >
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
            size="icon-sm"
            className="text-muted-foreground"
            onClick={() => set("dueDate", null)}
            aria-label="Quitar fecha"
          >
            <X />
          </Button>
        )}
      </div>
    </PropertyRow>
  )

  const categoryField = (
    <PropertyRow label="Categoría" icon={<Tag />}>
      <Select
        value={values.categoryId ?? NO_CATEGORY}
        onValueChange={(v) => set("categoryId", v === NO_CATEGORY ? null : v)}
      >
        <SelectTrigger size="sm" className={ghost}>
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
    </PropertyRow>
  )

  const priorityField = (
    <PropertyRow label="Prioridad" icon={<Flag />}>
      <Select
        value={values.priority}
        onValueChange={(v) => set("priority", v as TaskInput["priority"])}
      >
        <SelectTrigger size="sm" className={ghost}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {PRIORITIES.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              <span className={cn("size-1.5 rounded-full", p.className)} />
              {p.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </PropertyRow>
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
      <div className="flex-1 overflow-y-auto overscroll-contain p-4">
        <FieldGroup className="gap-5">
          {titleField}
          <dl className="flex flex-col gap-0.5">
            {dateField}
            {categoryField}
            {priorityField}
            {task && (
              <PropertyRow label="Estado" icon={<CircleCheck />}>
                <label className="flex h-7 cursor-pointer items-center gap-2 px-2.5 text-sm">
                  <Switch id="completed" checked={completed} onCheckedChange={onToggleCompleted} />
                  {completed ? "Completada" : "Pendiente"}
                </label>
              </PropertyRow>
            )}
          </dl>
          {descriptionField}
        </FieldGroup>
      </div>
      <div className="flex items-center gap-2 border-t bg-muted/40 px-4 py-3">
        {task && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="ghost" className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive" disabled={pending}>
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
