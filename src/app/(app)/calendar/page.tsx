import { addDays, format, isValid, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { io } from "next/cache"
import Link from "next/link"
import { Suspense } from "react"

import { CalendarBoard } from "@/components/calendar-board"
import { PageHeader } from "@/components/page-header"
import { PageSkeleton } from "@/components/page-skeleton"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { getCalendarTasks, getCategories } from "@/db/queries"

const DAYS = 7

function toKey(date: Date) {
  return format(date, "yyyy-MM-dd")
}

async function Content({ searchParams }: Pick<PageProps<"/calendar">, "searchParams">) {
  const { start } = await searchParams
  // El día actual se calcula en cada petición, no en el prerender.
  await io()
  const today = toKey(new Date())
  const first =
    typeof start === "string" && /^\d{4}-\d{2}-\d{2}$/.test(start) && isValid(parseISO(start))
      ? parseISO(start)
      : parseISO(today)
  const days = Array.from({ length: DAYS }, (_, i) => toKey(addDays(first, i)))
  const last = parseISO(days[DAYS - 1])

  const [tasks, categories] = await Promise.all([
    getCalendarTasks(days[0], days[DAYS - 1], today),
    getCategories(),
  ])

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader crumbs={[{ label: "Tareas", href: "/" }, { label: "Calendario" }]}>
        <span className="hidden text-sm text-muted-foreground tabular-nums sm:block">
          {format(first, "d MMM", { locale: es })} – {format(last, "d MMM yyyy", { locale: es })}
        </span>
        <ButtonGroup>
          <Button variant="outline" size="icon-sm" asChild>
            <Link href={`/calendar?start=${toKey(addDays(first, -DAYS))}`} aria-label="Semana anterior">
              <ChevronLeft />
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/calendar">Hoy</Link>
          </Button>
          <Button variant="outline" size="icon-sm" asChild>
            <Link href={`/calendar?start=${toKey(addDays(first, DAYS))}`} aria-label="Semana siguiente">
              <ChevronRight />
            </Link>
          </Button>
        </ButtonGroup>
      </PageHeader>
      <CalendarBoard tasks={tasks} categories={categories} days={days} today={today} />
    </div>
  )
}

export default function Page({ searchParams }: PageProps<"/calendar">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content searchParams={searchParams} />
    </Suspense>
  )
}
