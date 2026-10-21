"use client"

import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"

import { CategoryDialog } from "@/components/category-dialog"
import { DeleteCategoryDialog } from "@/components/delete-category-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { SidebarMenuAction } from "@/components/ui/sidebar"
import type { Category } from "@/db/schema"

/** Menú "⋯" de una categoría en el sidebar: editar o eliminar. */
export function CategoryMenu({ category }: { category: Pick<Category, "id" | "name" | "emoji" | "iconKey"> }) {
  const [editOpen, setEditOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuAction showOnHover className="data-[state=open]:bg-sidebar-accent">
            <MoreHorizontal />
            <span className="sr-only">Opciones de {category.name}</span>
          </SidebarMenuAction>
        </DropdownMenuTrigger>
        <DropdownMenuContent side="right" align="start">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}>
            <Trash2 />
            Eliminar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <CategoryDialog category={category} open={editOpen} onOpenChange={setEditOpen} />
      <DeleteCategoryDialog category={category} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  )
}
