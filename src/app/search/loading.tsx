import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton that mirrors the horizontal SearchResultListItem layout:
 * [Photo] [Name / Location / Services] [Price]
 */
function SearchResultSkeleton() {
    return (
        <article className="flex flex-col sm:flex-row gap-4 sm:gap-5 pb-8 mb-8 border-b border-gray-200/50 last:border-b-0 last:pb-0 last:mb-0">
            {/* Photo placeholder */}
            <Skeleton className="w-full sm:w-44 sm:min-w-[11rem] aspect-[4/5] shrink-0 rounded-xl" />

            {/* Info block */}
            <div className="flex flex-col flex-grow min-w-0 gap-3">
                {/* Name + rating row */}
                <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 space-y-2">
                        <Skeleton className="h-5 w-40" />
                        <div className="flex items-center gap-1.5">
                            <Skeleton className="h-3.5 w-3.5 rounded-full" />
                            <Skeleton className="h-3.5 w-28" />
                        </div>
                    </div>
                    <Skeleton className="h-6 w-14 rounded-full shrink-0" />
                </div>

                {/* Service rows (2 columns on xl) */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-x-6 gap-y-4 w-full mt-1">
                    {[1, 2].map((i) => (
                        <div key={i} className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-14" />
                            </div>
                            <div className="flex gap-1.5">
                                {[1, 2, 3].map((j) => (
                                    <Skeleton key={j} className="h-8 w-16 rounded-lg" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Price + CTA */}
            <div className="hidden sm:flex flex-col items-end justify-center shrink-0 w-28 border-l border-gray-200/50 pl-4 ml-2 gap-2">
                <Skeleton className="h-3 w-8" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-4 w-20 mt-2" />
            </div>
        </article>
    );
}

export default function SearchLoading() {
    return (
        <main className="h-[calc(100dvh-64px)] overflow-hidden bg-transparent">
            <div className="flex h-full min-h-0 flex-col lg:flex-row">
                {/* ── Left panel: results ── */}
                <div className="relative z-10 h-full min-h-0 w-full overflow-y-auto bg-transparent p-4 pb-12 shadow-[20px_0_30px_-15px_rgba(0,0,0,0.05)] md:p-6 lg:w-[48%] xl:w-[46%]">
                    {/* Header */}
                    <div className="mb-3 flex items-center justify-between gap-3">
                        <Skeleton className="h-7 w-64" />
                        <Skeleton className="h-4 w-20" />
                    </div>

                    {/* Tab toggle */}
                    <div className="mb-4 inline-flex rounded-full bg-stone-100 p-1">
                        <Skeleton className="h-8 w-36 rounded-full" />
                        <Skeleton className="h-8 w-24 rounded-full ml-1" />
                    </div>

                    {/* Quick filters */}
                    <div className="mb-4 flex gap-2 flex-wrap">
                        {[1, 2, 3, 4].map((i) => (
                            <Skeleton key={i} className="h-8 w-24 rounded-full" />
                        ))}
                    </div>

                    {/* Skeleton cards */}
                    <div className="flex flex-col gap-0 w-full">
                        {[1, 2, 3, 4].map((i) => (
                            <SearchResultSkeleton key={i} />
                        ))}
                    </div>
                </div>

                {/* ── Right panel: map placeholder ── */}
                <aside className="relative hidden h-full p-4 lg:flex lg:w-[52%] xl:w-[54%] lg:items-stretch">
                    <Skeleton className="h-full w-full rounded-3xl" />
                </aside>
            </div>
        </main>
    );
}
