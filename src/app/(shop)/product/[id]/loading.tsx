export default function ProductLoading() {
  return (
    <div className="container mx-auto px-4 py-8 mt-24">
      {/* Breadcrumb Skeleton */}
      <div className="h-4 w-48 bg-white/5 rounded-full animate-pulse mb-8" />

      <div className="flex flex-col lg:flex-row gap-12 lg:gap-16">
        {/* Left: Gallery Skeleton */}
        <div className="w-full lg:w-1/2 flex flex-col gap-4">
          <div className="aspect-square w-full bg-white/5 rounded-3xl animate-pulse border border-white/5" />
          <div className="flex gap-4 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="w-24 aspect-square shrink-0 bg-white/5 rounded-2xl animate-pulse border border-white/5" />
            ))}
          </div>
        </div>

        {/* Right: Info Skeleton */}
        <div className="w-full lg:w-1/2 flex flex-col gap-6 py-4">
          <div className="space-y-4 mb-4">
            <div className="h-4 w-32 bg-gold/20 rounded-full animate-pulse" />
            <div className="h-12 w-3/4 bg-white/5 rounded-2xl animate-pulse" />
            <div className="h-6 w-1/4 bg-white/5 rounded-full animate-pulse" />
          </div>

          <div className="h-10 w-40 bg-gold/10 rounded-full animate-pulse mb-4" />

          <div className="space-y-3 mb-6">
            <div className="h-4 w-full bg-white/5 rounded-full animate-pulse" />
            <div className="h-4 w-full bg-white/5 rounded-full animate-pulse" />
            <div className="h-4 w-3/4 bg-white/5 rounded-full animate-pulse" />
          </div>

          {/* Selector Skeletons */}
          <div className="space-y-4 mb-8">
            <div className="h-4 w-20 bg-white/5 rounded-full animate-pulse" />
            <div className="flex gap-3">
              <div className="h-10 w-20 bg-white/5 rounded-xl animate-pulse" />
              <div className="h-10 w-20 bg-white/5 rounded-xl animate-pulse" />
            </div>
          </div>

          {/* Button Skeleton */}
          <div className="h-14 w-full bg-white/5 rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
