export default function Loading() {
  return (
    <div className="page-enter space-y-8">
      <div className="space-y-2.5">
        <div className="skeleton h-8 w-52 rounded-xl" />
        <div className="skeleton h-4 w-72 max-w-full rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-2xl border border-amber-100 bg-white/80"
          >
            <div className="skeleton aspect-[4/3]" />
            <div className="space-y-2.5 p-4">
              <div className="skeleton h-4 w-3/4 rounded-lg" />
              <div className="skeleton h-3 w-1/2 rounded-lg" />
              <div className="skeleton mt-3 h-8 w-full rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
