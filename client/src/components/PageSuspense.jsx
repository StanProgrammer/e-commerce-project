const PageSuspense = () => (
  <div
    className="flex min-h-[60vh] items-center justify-center bg-slate-50"
    role="status"
    aria-label="Loading page"
  >
    <div className="flex flex-col items-center gap-3 text-sm font-medium text-slate-500">
      <i className="ri-loader-4-line animate-spin text-2xl text-primary" aria-hidden="true"></i>
      <span>Loading page…</span>
    </div>
  </div>
);

export default PageSuspense;
