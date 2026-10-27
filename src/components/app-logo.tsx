import { useId } from "react"

import { cn } from "@/lib/utils"

/**
 * Marca de la app: una tarea hecha (check) sobre una pendiente (círculo),
 * en blanco sobre un tile azul con degradado. Es el mismo dibujo que
 * `app/icon.svg` (favicon); si cambias uno, cambia el otro.
 */
export function AppLogo({ className }: { className?: string }) {
  const gradient = useId()
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={cn("size-8 shrink-0", className)}>
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="oklch(0.7 0.15 240)" />
          <stop offset="1" stopColor="oklch(0.53 0.22 264)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="10" fill={`url(#${gradient})`} />
      <g
        fill="none"
        stroke="white"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        transform="translate(6 6) scale(1.25)"
      >
        <path d="M2 5.5 4 7.5 7.5 3M10 5.25h4" />
        <path d="M10 11.75h4" strokeOpacity={0.65} />
        <circle cx="4.5" cy="11.75" r="2" strokeOpacity={0.65} />
      </g>
    </svg>
  )
}
