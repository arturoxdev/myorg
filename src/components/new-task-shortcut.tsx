"use client"

import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import type { TaskFormCategory } from "@/components/task-form"
import { TaskSheet } from "@/components/task-sheet"
import { categoryIdFromPath } from "@/lib/routes"

/** Tecla que abre el panel de nueva tarea (sin modificadores). */
export const NEW_TASK_KEY = "n"

function isTyping(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  return target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName)
}

export function NewTaskShortcut({ categories }: { categories: TaskFormCategory[] }) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() !== NEW_TASK_KEY || e.repeat) return
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return
      if (isTyping(e.target)) return
      // No abrir encima de otro panel o diálogo.
      if (document.querySelector('[role="dialog"], [role="alertdialog"]')) return

      e.preventDefault()
      setOpen(true)
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  return (
    <TaskSheet
      open={open}
      onOpenChange={setOpen}
      categories={categories}
      defaultCategoryId={categoryIdFromPath(pathname)}
    />
  )
}
