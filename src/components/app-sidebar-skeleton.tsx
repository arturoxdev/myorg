import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarHeader } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"

export function AppSidebarSkeleton() {
  return (
    <Sidebar variant="inset" collapsible="icon">
      <SidebarHeader>
        <Skeleton className="h-12 w-full rounded-lg" />
        <Skeleton className="h-8 w-full" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="gap-3">
          {["60%", "45%", "70%", "50%", "65%"].map((width, i) => (
            <div key={i} className="flex h-6 items-center gap-2 px-2">
              <Skeleton className="size-4 rounded-md" />
              <Skeleton className="h-4" style={{ width }} />
            </div>
          ))}
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <Skeleton className="h-12 w-full rounded-lg" />
      </SidebarFooter>
    </Sidebar>
  )
}
