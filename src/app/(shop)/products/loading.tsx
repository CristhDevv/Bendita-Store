export default function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-8 mt-24">
      {/* Header and Filter Bar Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div className="space-y-3">
          <div className="h-10 w-48 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-5 w-64 bg-white/5 rounded-lg animate-pulse" />
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <div className="h-12 w-32 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-12 w-40 bg-white/5 rounded-xl animate-pulse" />
          <div className="h-12 w-32 bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>

      {/* Grid Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="flex flex-col gap-3">
            <div className="aspect-[3/4] w-full rounded-3xl bg-white/5 animate-pulse border border-white/5" />
            <div className="space-y-2">
              <div className="h-3 w-1/3 bg-white/5 rounded-full animate-pulse" />
              <div className="h-5 w-3/4 bg-white/5 rounded-full animate-pulse" />
              <div className="h-4 w-1/2 bg-white/5 rounded-full animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
