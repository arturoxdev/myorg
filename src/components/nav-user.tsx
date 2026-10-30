"use client"

import { ChevronsUpDown, LogOut } from "lucide-react"

import { logout } from "@/actions/auth"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar"

export function NavUser({ username }: { username: string }) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="rounded-2xl data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg border border-transparent bg-background text-xs font-medium uppercase ring-1 ring-foreground/10">
                  {username.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-col gap-1 leading-none">
                <span className="truncate font-medium">{username}</span>
                <span className="text-xs text-muted-foreground">Cuenta personal</span>
              </div>
              <ChevronsUpDown className="ms-auto text-muted-foreground" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-(--radix-dropdown-menu-trigger-width) min-w-56" side="top" align="start" sideOffset={6}>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Sesión iniciada</DropdownMenuLabel>
            <DropdownMenuItem onSelect={() => logout()}>
              <LogOut />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
