"use client"

import Image from "@tiptap/extension-image"
import Placeholder from "@tiptap/extension-placeholder"
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import {
  Bold,
  Heading2,
  ImagePlus,
  Italic,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"

import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import { Toggle } from "@/components/ui/toggle"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { uploadImage } from "@/lib/upload"

type Props = {
  value: string
  onChange: (html: string) => void
  onUploadingChange?: (uploading: boolean) => void
  onImageUploaded?: (key: string) => void
}

export function RichTextEditor({ value, onChange, onUploadingChange, onImageUploaded }: Props) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [uploads, setUploads] = useState(0)
  const editorRef = useRef<Editor | null>(null)

  async function insertImages(editor: Editor, files: File[], pos?: number) {
    const images = files.filter((f) => f.type.startsWith("image/"))
    if (!images.length) return false

    setUploads((n) => n + images.length)
    onUploadingChange?.(true)
    for (const file of images) {
      try {
        const { key, url } = await uploadImage(file, "tasks")
        onImageUploaded?.(key)
        const chain = editor.chain().focus()
        if (pos !== undefined) chain.insertContentAt(pos, { type: "image", attrs: { src: url, alt: file.name } })
        else chain.setImage({ src: url, alt: file.name })
        chain.run()
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "No se pudo subir la imagen")
      } finally {
        setUploads((n) => {
          if (n - 1 === 0) onUploadingChange?.(false)
          return n - 1
        })
      }
    }
    return true
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false } }),
      Image.configure({ HTMLAttributes: { class: "rounded-lg border" } }),
      Placeholder.configure({ placeholder: "Añade una descripción, pega o arrastra imágenes..." }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "tiptap min-h-48 px-3 py-2 text-sm outline-none",
      },
      // Reserva ⌘/Ctrl + Enter para enviar el formulario en vez de insertar un salto de línea.
      handleKeyDown(view, event) {
        return event.key === "Enter" && (event.metaKey || event.ctrlKey)
      },
      handlePaste(view, event) {
        const files = Array.from(event.clipboardData?.files ?? [])
        if (!files.some((f) => f.type.startsWith("image/")) || !editorRef.current) return false
        void insertImages(editorRef.current, files)
        return true
      },
      handleDrop(view, event) {
        const files = Array.from(event.dataTransfer?.files ?? [])
        if (!files.some((f) => f.type.startsWith("image/")) || !editorRef.current) return false
        const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos
        void insertImages(editorRef.current, files, pos)
        return true
      },
    },
    onUpdate: ({ editor }) => onChange(editor.isEmpty ? "" : editor.getHTML()),
  })
  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  const state = useEditorState({
    editor,
    selector: ({ editor }) => ({
      bold: editor?.isActive("bold") ?? false,
      italic: editor?.isActive("italic") ?? false,
      strike: editor?.isActive("strike") ?? false,
      heading: editor?.isActive("heading", { level: 2 }) ?? false,
      bulletList: editor?.isActive("bulletList") ?? false,
      orderedList: editor?.isActive("orderedList") ?? false,
      blockquote: editor?.isActive("blockquote") ?? false,
    }),
  })

  const tools = editor
    ? [
        { label: "Negrita", icon: Bold, active: state?.bold, run: () => editor.chain().focus().toggleBold().run() },
        { label: "Cursiva", icon: Italic, active: state?.italic, run: () => editor.chain().focus().toggleItalic().run() },
        { label: "Tachado", icon: Strikethrough, active: state?.strike, run: () => editor.chain().focus().toggleStrike().run() },
        { label: "Título", icon: Heading2, active: state?.heading, run: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
        { label: "Lista", icon: List, active: state?.bulletList, run: () => editor.chain().focus().toggleBulletList().run() },
        { label: "Lista numerada", icon: ListOrdered, active: state?.orderedList, run: () => editor.chain().focus().toggleOrderedList().run() },
        { label: "Cita", icon: Quote, active: state?.blockquote, run: () => editor.chain().focus().toggleBlockquote().run() },
      ]
    : []

  return (
    <div className="rounded-lg border bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 dark:bg-input/30">
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
        {tools.map((tool) => (
          <Tooltip key={tool.label}>
            <TooltipTrigger asChild>
              <Toggle size="sm" pressed={tool.active} onPressedChange={tool.run} aria-label={tool.label}>
                <tool.icon />
              </Toggle>
            </TooltipTrigger>
            <TooltipContent>{tool.label}</TooltipContent>
          </Tooltip>
        ))}
        <Separator orientation="vertical" className="mx-1 data-[orientation=vertical]:h-4" />
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              pressed={false}
              disabled={!editor}
              onPressedChange={() => fileInput.current?.click()}
              aria-label="Insertar imagen"
            >
              {uploads > 0 ? <Spinner /> : <ImagePlus />}
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>Insertar imagen</TooltipContent>
        </Tooltip>
        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          multiple
          hidden
          onChange={(e) => {
            const files = Array.from(e.target.files ?? [])
            e.target.value = ""
            if (editor) void insertImages(editor, files)
          }}
        />
        {uploads > 0 && <span className="ml-auto pr-2 text-xs text-muted-foreground">Subiendo imagen...</span>}
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
