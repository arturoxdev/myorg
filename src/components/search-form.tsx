"use client"

import { Search } from "lucide-react"
import { usePathname, useSearchParams } from "next/navigation"

import { Label } from "@/components/ui/label"
import { SidebarGroup, SidebarGroupContent, SidebarInput } from "@/components/ui/sidebar"

export function SearchForm({ ...props }: React.ComponentProps<"form">) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // La búsqueda se aplica sobre la vista actual.
  return (
    <form action={pathname} {...props}>
      <SidebarGroup className="py-0">
        <SidebarGroupContent className="relative">
          <Label htmlFor="search" className="sr-only">
            Buscar
          </Label>
          <SidebarInput
            key={searchParams.get("q")}
            id="search"
            name="q"
            defaultValue={searchParams.get("q") ?? ""}
            placeholder="Buscar tareas..."
            className="pl-8"
          />
          <Search className="pointer-events-none absolute top-1/2 left-2 size-4 -translate-y-1/2 opacity-50 select-none" />
        </SidebarGroupContent>
      </SidebarGroup>
    </form>
  )
}
