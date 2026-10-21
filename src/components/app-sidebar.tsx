"use client"

import { CalendarDays, CalendarClock, CalendarRange, CheckCircle2, CheckSquare, Inbox, Plus } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import * as React from "react"

import { CategoryDialog } from "@/components/category-dialog"
import { CategoryIcon } from "@/components/category-icon"
import { CategoryMenu } from "@/components/category-menu"
import { NavUser } from "@/components/nav-user"
import { NEW_TASK_KEY } from "@/components/new-task-shortcut"
import { NewTaskSheet } from "@/components/task-sheet"
import { SearchForm } from "@/components/search-form"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { Kbd } from "@/components/ui/kbd"
import { categoryIdFromPath } from "@/lib/routes"

const views = [
  { title: "Todas", url: "/", icon: Inbox },
  { title: "Hoy", url: "/today", icon: CalendarDays },
  { title: "Próximas", url: "/upcoming", icon: CalendarClock },
  { title: "Calendario", url: "/calendar", icon: CalendarRange },
  { title: "Completadas", url: "/completed", icon: CheckCircle2 },
]

type SidebarCategory = {
  id: string
  name: string
  emoji: string | null
  iconKey: string | null
  pending: number
}

export function AppSidebar({
  categories,
  username,
  ...props
}: React.ComponentProps<typeof Sidebar> & { categories: SidebarCategory[]; username: string }) {
  const pathname = usePathname()

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <CheckSquare className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-medium">Tareas</span>
                  <span className="text-xs text-muted-foreground">Gestor personal</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <React.Suspense>
          <SearchForm />
        </React.Suspense>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <NewTaskSheet
                  categories={categories}
                  defaultCategoryId={categoryIdFromPath(pathname)}
                >
                  <SidebarMenuButton>
                    <Plus />
                    Nueva tarea
                    <Kbd className="ml-auto uppercase">{NEW_TASK_KEY}</Kbd>
                  </SidebarMenuButton>
                </NewTaskSheet>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Vistas</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {views.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      {item.title}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Categorías</SidebarGroupLabel>
          <CategoryDialog>
            <SidebarGroupAction title="Nueva categoría">
              <Plus />
              <span className="sr-only">Nueva categoría</span>
            </SidebarGroupAction>
          </CategoryDialog>
          <SidebarGroupContent>
            <SidebarMenu>
              {categories.map((category) => (
                <SidebarMenuItem key={category.id}>
                  <SidebarMenuButton asChild isActive={pathname === `/categories/${category.id}`}>
                    <Link href={`/categories/${category.id}`}>
                      <CategoryIcon category={category} />
                      <span>{category.name}</span>
                    </Link>
                  </SidebarMenuButton>
                  {category.pending > 0 && (
                    // Se oculta al pasar el mouse para dejar sitio al menú "⋯".
                    <SidebarMenuBadge className="transition-opacity group-focus-within/menu-item:opacity-0 group-hover/menu-item:opacity-0">
                      {category.pending}
                    </SidebarMenuBadge>
                  )}
                  <CategoryMenu category={category} />
                </SidebarMenuItem>
              ))}
              {categories.length === 0 && (
                <SidebarMenuItem>
                  <CategoryDialog>
                    <SidebarMenuButton className="text-muted-foreground">
                      <Plus />
                      Crear categoría
                    </SidebarMenuButton>
                  </CategoryDialog>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser username={username} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
