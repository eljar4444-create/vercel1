import { Skeleton } from '@/components/ui/skeleton';

export default function SalonLoading() {
    return (
        <div className="min-h-screen bg-slate-50/60">
            <nav className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
                <div className="container mx-auto flex h-14 max-w-6xl items-center px-4">
                    <Skeleton className="h-5 w-28" />
                </div>
            </nav>
            <div className="container mx-auto max-w-6xl px-4 py-8">
                <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="flex flex-col gap-4 md:flex-row md:items-start">
                        <div className="flex-1">
                            <Skeleton className="h-9 w-64" />
                            <div className="mt-3 flex gap-4">
                                <Skeleton className="h-5 w-32" />
                                <Skeleton className="h-5 w-16" />
                            </div>
                        </div>
                        <Skeleton className="h-11 w-36 rounded-xl" />
                    </div>
                    <Skeleton className="mt-6 aspect-video w-full rounded-2xl md:aspect-[2/1]" />
                </section>
                <section className="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-2">
                        <Skeleton className="h-8 w-48" />
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-24 w-full rounded-2xl" />
                            ))}
                        </div>
                    </div>
                    <aside className="space-y-6">
                        <Skeleton className="h-64 w-full rounded-3xl" />
                    </aside>
                </section>
            </div>
        </div>
    );
}
