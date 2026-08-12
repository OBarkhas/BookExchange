export default function Loading() {
  return (
    <div className="page-enter mx-auto w-full max-w-6xl space-y-8 px-4 py-8 sm:px-6">
      <div className="skeleton h-48 rounded-3xl" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="skeleton h-24 rounded-2xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-amber-100 bg-white/80"
          >
            <div className="skeleton aspect-[4/3]" />
            <div className="space-y-2.5 p-4">
              <div className="skeleton h-4 w-3/4 rounded-lg" />
              <div className="skeleton h-3 w-1/2 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
