import { Suspense } from "react"

import { PageSkeleton } from "@/components/page-skeleton"
import { TasksView } from "@/components/tasks-view"

async function Content({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const { q } = await searchParams
  return <TasksView view="all" title="Todas" q={typeof q === "string" ? q : undefined} />
}

export default function Page({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content searchParams={searchParams} />
    </Suspense>
  )
}
