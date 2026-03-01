import { Skeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
    return (
        <div className="min-h-screen bg-slate-50">
            <div className="border-b border-slate-200 bg-white">
                <div className="container mx-auto flex h-14 max-w-6xl items-center px-4">
                    <Skeleton className="h-5 w-24" />
                </div>
            </div>
            <div className="container mx-auto max-w-6xl px-4 py-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                    <aside className="space-y-4 lg:col-span-1">
                        <Skeleton className="h-10 w-full rounded-xl" />
                        <Skeleton className="h-24 w-full rounded-2xl" />
                        <Skeleton className="h-32 w-full rounded-2xl" />
                    </aside>
                    <main className="space-y-6 lg:col-span-3">
                        <Skeleton className="h-12 w-64 rounded-xl" />
                        <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-28 w-full rounded-xl" />
                            ))}
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}
