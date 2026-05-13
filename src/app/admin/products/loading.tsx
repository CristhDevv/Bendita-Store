export default function AdminProductsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div className="space-y-2">
          <div className="h-8 w-48 bg-white/5 rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-white/5 rounded-full animate-pulse" />
        </div>
        <div className="h-10 w-36 bg-gold/20 rounded-xl animate-pulse" />
      </div>

      <div className="bg-navy-900 rounded-2xl border border-white/10 overflow-hidden">
        <div className="p-4 border-b border-white/10 flex justify-between gap-4">
          <div className="h-10 flex-1 max-w-sm bg-white/5 rounded-xl animate-pulse" />
          <div className="h-10 w-32 bg-white/5 rounded-xl animate-pulse" />
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                {[...Array(6)].map((_, i) => (
                  <th key={i} className="p-4"><div className="h-4 w-20 bg-white/10 rounded-full animate-pulse" /></th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(6)].map((_, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="p-4"><div className="w-12 h-12 bg-white/5 rounded-lg animate-pulse" /></td>
                  <td className="p-4">
                    <div className="space-y-2">
                      <div className="h-4 w-32 bg-white/5 rounded-full animate-pulse" />
                      <div className="h-3 w-20 bg-white/5 rounded-full animate-pulse" />
                    </div>
                  </td>
                  <td className="p-4"><div className="h-4 w-24 bg-white/5 rounded-full animate-pulse" /></td>
                  <td className="p-4"><div className="h-6 w-16 bg-white/5 rounded-full animate-pulse" /></td>
                  <td className="p-4"><div className="h-6 w-12 bg-white/5 rounded-full animate-pulse" /></td>
                  <td className="p-4"><div className="h-8 w-24 bg-white/5 rounded-lg animate-pulse" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
