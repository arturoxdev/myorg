import { notFound } from "next/navigation"
import { Suspense } from "react"
import { z } from "zod"

import { CategoryIcon } from "@/components/category-icon"
import { PageSkeleton } from "@/components/page-skeleton"
import { TasksView } from "@/components/tasks-view"
import { getCategory } from "@/db/queries"

async function Content({ params, searchParams }: PageProps<"/categories/[id]">) {
  const { id } = await params
  const { q } = await searchParams
  if (!z.uuid().safeParse(id).success) notFound()

  const category = await getCategory(id)
  if (!category) notFound()

  return (
    <TasksView
      categoryId={category.id}
      title={category.name}
      icon={<CategoryIcon category={category} className="size-5 text-lg" />}
      q={typeof q === "string" ? q : undefined}
    />
  )
}

export default function Page(props: PageProps<"/categories/[id]">) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Content {...props} />
    </Suspense>
  )
}
