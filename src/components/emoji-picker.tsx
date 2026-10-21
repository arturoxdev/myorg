"use client"

import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const EMOJIS = [
  "📁", "💼", "🏠", "🛒", "💡", "📚", "🎯", "🚀", "💻", "📞",
  "✈️", "🏋️", "🍎", "💰", "🎨", "🎵", "🧹", "🐶", "❤️", "⭐",
  "📝", "📅", "🔧", "🌱", "🎓", "🏥", "🎁", "☕", "🧠", "🔥",
]

export function EmojiPicker({ value, onChange }: { value: string; onChange: (emoji: string) => void }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-10 gap-1">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onChange(emoji)}
            className={cn(
              "flex aspect-square items-center justify-center rounded-md text-lg transition-colors hover:bg-muted",
              value === emoji && "bg-muted ring-1 ring-ring"
            )}
          >
            {emoji}
          </button>
        ))}
      </div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="O escribe / pega cualquier emoji"
        maxLength={16}
      />
    </div>
  )
}
