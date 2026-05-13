export default function OrdersLoading() {
  return (
    <div className="space-y-6">
      <div className="mb-8">
        <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse mb-2" />
        <div className="h-4 w-64 bg-white/5 rounded-full animate-pulse" />
      </div>

      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-navy-900/50 rounded-2xl p-6 border border-white/5 animate-pulse">
            <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
              <div className="space-y-2">
                <div className="h-5 w-32 bg-white/5 rounded-full" />
                <div className="h-4 w-24 bg-white/5 rounded-full" />
              </div>
              <div className="flex items-center gap-3">
                <div className="h-6 w-24 bg-white/5 rounded-full" />
                <div className="h-8 w-24 bg-gold/10 rounded-lg" />
              </div>
            </div>
            <div className="border-t border-white/5 pt-4 flex justify-between items-center">
              <div className="flex -space-x-2">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="w-10 h-10 rounded-full bg-white/5 border-2 border-navy-900" />
                ))}
              </div>
              <div className="h-6 w-28 bg-white/5 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
