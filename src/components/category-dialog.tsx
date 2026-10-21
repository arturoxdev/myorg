"use client"

import { ImageUp, X } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { toast } from "sonner"

import { saveCategory } from "@/actions/categories"
import { EmojiPicker } from "@/components/emoji-picker"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { Category } from "@/db/schema"
import { uploadImage } from "@/lib/upload"

type CategoryLike = Pick<Category, "id" | "name" | "emoji" | "iconKey">

type Props = {
  category?: CategoryLike
  /** Elemento que abre el diálogo; se puede omitir si se controla con open/onOpenChange. */
  children?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function CategoryDialog({ category, children, open: openProp, onOpenChange }: Props) {
  const [openState, setOpenState] = useState(false)
  const open = openProp ?? openState
  const setOpen = onOpenChange ?? setOpenState

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-md">
        {/* Se monta en cada apertura para reiniciar el formulario. */}
        {open && <CategoryForm category={category} onDone={() => setOpen(false)} />}
      </DialogContent>
    </Dialog>
  )
}

function CategoryForm({ category, onDone }: { category?: CategoryLike; onDone: () => void }) {
  const router = useRouter()
  const fileInput = useRef<HTMLInputElement>(null)
  const [pending, startTransition] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [name, setName] = useState(category?.name ?? "")
  const [emoji, setEmoji] = useState(category?.emoji ?? "📁")
  const [iconKey, setIconKey] = useState<string | null>(category?.iconKey ?? null)
  const [mode, setMode] = useState(category?.iconKey ? "logo" : "emoji")

  async function onFile(file: File | undefined) {
    if (!file) return
    setUploading(true)
    try {
      const { key } = await uploadImage(file, "categories")
      setIconKey(key)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo subir el logo")
    } finally {
      setUploading(false)
    }
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const result = await saveCategory(category?.id ?? null, {
        name,
        emoji: mode === "emoji" ? emoji : null,
        iconKey: mode === "logo" ? iconKey : null,
      })
      if (!result.ok) {
        toast.error(result.error)
        return
      }
      toast.success(category ? "Categoría actualizada" : "Categoría creada")
      onDone()
      if (!category) router.push(`/categories/${result.id}`)
    })
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <DialogHeader>
        <DialogTitle>{category ? "Editar categoría" : "Nueva categoría"}</DialogTitle>
        <DialogDescription>Elige un emoji o sube un logo que la represente.</DialogDescription>
      </DialogHeader>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="category-name">Nombre</FieldLabel>
          <Input
            id="category-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Trabajo, Casa, Estudio..."
            required
            autoFocus
          />
        </Field>
        <Field>
          <FieldLabel>Icono</FieldLabel>
          <Tabs value={mode} onValueChange={setMode}>
            <TabsList className="w-full">
              <TabsTrigger value="emoji">Emoji</TabsTrigger>
              <TabsTrigger value="logo">Logo</TabsTrigger>
            </TabsList>
            <TabsContent value="emoji" className="pt-2">
              <EmojiPicker value={emoji} onChange={setEmoji} />
            </TabsContent>
            <TabsContent value="logo" className="pt-2">
              <div className="flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-muted/50">
                  {uploading ? (
                    <Spinner />
                  ) : iconKey ? (
                    <Image
                      src={`/api/files/${iconKey}`}
                      alt="Logo"
                      width={64}
                      height={64}
                      unoptimized
                      className="size-full object-cover"
                    />
                  ) : (
                    <ImageUp className="size-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploading}
                      onClick={() => fileInput.current?.click()}
                    >
                      {iconKey ? "Cambiar" : "Subir logo"}
                    </Button>
                    {iconKey && (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIconKey(null)}>
                        <X />
                        Quitar
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">PNG, JPG, WEBP o SVG. Máx. 10 MB.</p>
                </div>
                <input
                  ref={fileInput}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/gif"
                  hidden
                  onChange={(e) => {
                    void onFile(e.target.files?.[0])
                    e.target.value = ""
                  }}
                />
              </div>
            </TabsContent>
          </Tabs>
        </Field>
      </FieldGroup>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending || uploading}>
          {pending && <Spinner />}
          Guardar
        </Button>
      </DialogFooter>
    </form>
  )
}
