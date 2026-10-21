import { cn } from "@/lib/utils"

/**
 * Título de una tarea; al completarse se tacha de izquierda a derecha
 * y después pasa a gris. Es inline para que el tachado siga el texto
 * línea por línea cuando ocupa varias.
 */
export function TaskTitle({
  completed,
  className,
  children,
}: {
  completed: boolean
  className?: string
  children: React.ReactNode
}) {
  return (
    <span data-completed={completed} className={cn("task-title", className)}>
      {children}
    </span>
  )
}
