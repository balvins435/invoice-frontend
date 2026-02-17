import { Spinner } from '@/components/ui/Spinner';

export default function DashboardLoading() {
  return (
    <div className="p-6">
      <div className="mb-6 flex items-center gap-3">
        <Spinner size="md" />
        <p className="text-sm text-gray-600 dark:text-slate-400">Loading page...</p>
      </div>

      <div className="animate-pulse space-y-6">
        <div className="h-10 w-56 rounded-lg bg-gray-200 dark:bg-slate-700" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="h-28 rounded-xl bg-gray-200 dark:bg-slate-700" />
          <div className="h-28 rounded-xl bg-gray-200 dark:bg-slate-700" />
          <div className="h-28 rounded-xl bg-gray-200 dark:bg-slate-700" />
          <div className="h-28 rounded-xl bg-gray-200 dark:bg-slate-700" />
        </div>
        <div className="h-72 rounded-xl bg-gray-200 dark:bg-slate-700" />
      </div>
    </div>
  );
}
