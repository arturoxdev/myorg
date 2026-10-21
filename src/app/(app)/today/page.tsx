import { Suspense } from "react"

import { PageSkeleton } from "@/components/page-skeleton"
import { TasksView } from "@/components/tasks-view"

async function Content({ searchParams }: Pick<PageProps<"/today">, "searchParams">) {
  const { q } = await searchParams
  return <TasksView view="today" title="Hoy" q={typeof q === "string" ? q : undefined} />
}

export default function Page({ searchParams }: PageProps<"/today">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content searchParams={searchParams} />
    </Suspense>
  )
}
