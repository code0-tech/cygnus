export function BlogSkeleton() {
    return (
        <div className="animate-pulse space-y-8">
            <div className="flex justify-start">
                <div className="h-9 w-24 rounded-xl bg-white/10" />
            </div>

            <header className="flex flex-col items-center text-center">
                <div className="mb-3 h-11 w-4/5 max-w-3xl rounded-2xl bg-white/10" />
                <div className="h-6 w-3/4 max-w-2xl rounded-full bg-white/10" />
                <div className="mt-3 h-6 w-1/2 max-w-xl rounded-full bg-white/10" />
            </header>

            <div className="rounded-3xl p-2">
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-white/10 ring ring-white/10" />
            </div>

            <div className="grid grid-cols-1 gap-12 lg:grid-cols-4">
                <aside className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="size-10 shrink-0 rounded-full bg-white/10" />
                        <div className="min-w-0 space-y-2">
                            <div className="h-4 w-32 rounded-full bg-white/10" />
                            <div className="h-3 w-48 rounded-full bg-white/10" />
                        </div>
                    </div>

                    <div className="hidden space-y-3 lg:block">
                        <div className="h-4 w-28 rounded-full bg-white/10" />
                        <div className="h-3 w-40 rounded-full bg-white/10" />
                        <div className="h-3 w-32 rounded-full bg-white/10" />
                        <div className="h-3 w-44 rounded-full bg-white/10" />
                        <div className="h-3 w-36 rounded-full bg-white/10" />
                    </div>
                </aside>

                <article className="space-y-6 lg:col-span-3">
                    <div className="h-9 w-3/4 rounded-2xl bg-white/10" />
                    <div className="space-y-3">
                        <div className="h-5 w-full rounded-full bg-white/10" />
                        <div className="h-5 w-11/12 rounded-full bg-white/10" />
                        <div className="h-5 w-5/6 rounded-full bg-white/10" />
                    </div>
                    <div className="h-8 w-2/3 rounded-2xl bg-white/10" />
                    <div className="space-y-3">
                        <div className="h-5 w-full rounded-full bg-white/10" />
                        <div className="h-5 w-full rounded-full bg-white/10" />
                        <div className="h-5 w-4/5 rounded-full bg-white/10" />
                    </div>
                    <div className="h-64 w-full rounded-2xl bg-white/10" />
                    <div className="space-y-3">
                        <div className="h-5 w-full rounded-full bg-white/10" />
                        <div className="h-5 w-10/12 rounded-full bg-white/10" />
                        <div className="h-5 w-7/12 rounded-full bg-white/10" />
                    </div>
                </article>
            </div>
        </div>
    )
}
