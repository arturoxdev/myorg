"use client"

import { usePathname, useRouter } from "next/navigation"
import { useTransition } from "react"
import { toast } from "sonner"

import { deleteCategory } from "@/actions/categories"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

type Props = {
  category: { id: string; name: string }
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DeleteCategoryDialog({ category, open, onOpenChange }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [pending, startTransition] = useTransition()

  function onDelete() {
    startTransition(async () => {
      const result = await deleteCategory(category.id)
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success("Categoría eliminada")
      onOpenChange(false)
      // Si estabas viendo esa categoría, vuelve a todas las tareas.
      if (pathname === `/categories/${category.id}`) router.push("/")
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Eliminar “{category.name}”?</AlertDialogTitle>
          <AlertDialogDescription>
            Las tareas de esta categoría no se eliminan, quedarán sin categoría.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={(e) => {
              // Mantener abierto hasta que termine la eliminación.
              e.preventDefault()
              onDelete()
            }}
          >
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
