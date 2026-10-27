"use client"

import { cn } from "cn"
import { Collapsible as CollapsiblePrimitive } from "radix-ui"

function Collapsible({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root data-slot="collapsible" {...props} />
}

function CollapsibleTrigger({
  ...props
}: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return (
    <CollapsiblePrimitive.CollapsibleTrigger
      data-slot="collapsible-trigger"
      {...props}
    />
  )
}

/**
 * Abre y cierra con una transición de `grid-template-rows` (0fr ↔ 1fr), que se
 * revierte si se vuelve a pulsar a mitad de camino; los keyframes no pueden.
 * Siempre montado: cerrado queda en `visibility: hidden`, fuera del foco y del
 * árbol de accesibilidad. La transición vive en un hijo porque Radix anula la
 * del propio Content cada vez que cambia de estado. Con reduced motion la
 * altura cambia de golpe y solo se desvanece la opacidad.
 */
function CollapsibleContent({
  className,
  children,
  ...props
}: Omit<React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>, "forceMount">) {
  return (
    <CollapsiblePrimitive.CollapsibleContent
      data-slot="collapsible-content"
      forceMount
      className="group/collapsible-content"
      {...props}
    >
      <div className="invisible grid grid-rows-[0fr] opacity-0 transition-[opacity,visibility] duration-150 ease-out group-data-[state=open]/collapsible-content:visible group-data-[state=open]/collapsible-content:grid-rows-[1fr] group-data-[state=open]/collapsible-content:opacity-100 group-data-[state=open]/collapsible-content:duration-200 motion-safe:transition-[grid-template-rows,opacity,visibility]">
        <div className={cn("min-h-0 overflow-hidden", className)}>{children}</div>
      </div>
    </CollapsiblePrimitive.CollapsibleContent>
  )
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
