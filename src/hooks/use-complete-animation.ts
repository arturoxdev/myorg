"use client"

import { useRef, useState } from "react"

import { playCompleteSound } from "@/lib/sounds"

/** Lo que dura el tachado y el cambio de color del título (ver `.task-title` en globals.css). */
const COMPLETE_ANIMATION_MS = 850

/**
 * Al completar una tarea la marca primero solo en pantalla para que se vea el tachado,
 * y al terminar la animación llama a `commit`, que la guarda (y la mueve de sección).
 * `commit` debe llamar a `settle()` dentro de su transición para soltar el estado local
 * a la vez que la tarea llega como completada.
 */
export function useCompleteAnimation(
  commit: (id: string, completed: boolean, settle: () => void) => void
) {
  const [completing, setCompleting] = useState<ReadonlySet<string>>(() => new Set())
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())

  function settle(id: string) {
    setCompleting((current) => {
      if (!current.has(id)) return current
      const next = new Set(current)
      next.delete(id)
      return next
    })
  }

  function toggle(id: string, completed: boolean) {
    const timer = timers.current.get(id)
    if (timer) {
      // Se desmarcó durante la animación: se cancela sin llegar a guardarla.
      clearTimeout(timer)
      timers.current.delete(id)
      settle(id)
      return
    }
    if (!completed) return commit(id, false, () => settle(id))

    playCompleteSound()
    setCompleting((current) => new Set(current).add(id))
    timers.current.set(
      id,
      setTimeout(() => {
        timers.current.delete(id)
        commit(id, true, () => settle(id))
      }, COMPLETE_ANIMATION_MS)
    )
  }

  return { completing, toggle }
}
