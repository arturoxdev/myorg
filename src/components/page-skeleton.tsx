import { Skeleton } from "@/components/ui/skeleton"

export function PageSkeleton() {
  return (
    <>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b ps-3 pe-2">
        <Skeleton className="size-7 rounded-md" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="ms-auto h-7 w-28 rounded-md" />
      </header>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 md:p-6">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-[74px] rounded-xl" />
          ))}
        </div>
        <div className="overflow-hidden rounded-xl border border-transparent ring-1 ring-foreground/10">
          <div className="flex h-11 items-center border-b px-4">
            <Skeleton className="h-4 w-24" />
          </div>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="flex h-14 items-center gap-3 border-b px-4 last:border-b-0">
              <Skeleton className="size-4 rounded-[4px]" />
              <Skeleton className="h-4" style={{ width: `${40 + ((i * 13) % 35)}%` }} />
              <Skeleton className="ms-auto h-5 w-16 rounded-sm" />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
