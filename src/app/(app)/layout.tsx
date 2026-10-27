import { Suspense } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { AppSidebarSkeleton } from "@/components/app-sidebar-skeleton"
import { NewTaskShortcut } from "@/components/new-task-shortcut"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { getCategories } from "@/db/queries"
import { requireSession } from "@/lib/auth"

async function SessionSidebar() {
  const session = await requireSession()
  const categories = await getCategories()
  return (
    <>
      <AppSidebar categories={categories} username={session.username} />
      {/* Fuera del sidebar: en móvil su contenido se desmonta al cerrarse. */}
      <NewTaskShortcut categories={categories} />
    </>
  )
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    // Alto fijo: el contenido se desplaza dentro del panel y el header queda fijo arriba.
    <SidebarProvider className="h-svh">
      <Suspense fallback={<AppSidebarSkeleton />}>
        <SessionSidebar />
      </Suspense>
      {/* min-w-0: el calendario se desplaza en horizontal sin ensanchar la página. */}
      <SidebarInset className="min-w-0 overflow-y-auto">{children}</SidebarInset>
    </SidebarProvider>
  )
}
