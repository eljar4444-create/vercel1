import { Skeleton } from '@/components/ui/skeleton';

export default function SearchLoading() {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="border-b border-slate-200 bg-white">
                <div className="container mx-auto flex h-14 max-w-6xl items-center px-4">
                    <Skeleton className="h-5 w-24" />
                </div>
            </div>
            <div className="container mx-auto max-w-6xl px-4 py-6">
                <div className="flex flex-col gap-6 lg:flex-row">
                    <aside className="w-full space-y-4 lg:w-72 lg:shrink-0">
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-32 w-full rounded-xl" />
                    </aside>
                    <div className="flex-1 space-y-4">
                        <Skeleton className="h-10 w-full max-w-md rounded-xl" />
                        <div className="grid gap-4 sm:grid-cols-2">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-40 w-full rounded-2xl" />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
