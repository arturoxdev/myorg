import Image from "next/image"
import { Tag } from "lucide-react"

import { cn } from "@/lib/utils"

type Props = {
  category: { name: string; emoji: string | null; iconKey: string | null }
  className?: string
}

export function CategoryIcon({ category, className }: Props) {
  if (category.iconKey) {
    return (
      <Image
        src={`/api/files/${category.iconKey}`}
        alt={category.name}
        width={32}
        height={32}
        // Se sirve desde R2 a través de una ruta autenticada, sin optimizar.
        unoptimized
        className={cn("size-4 shrink-0 rounded-sm object-cover", className)}
      />
    )
  }
  if (category.emoji) {
    return (
      <span className={cn("flex size-4 shrink-0 items-center justify-center text-sm leading-none", className)}>
        {category.emoji}
      </span>
    )
  }
  return <Tag className={cn("size-4 shrink-0", className)} />
}
